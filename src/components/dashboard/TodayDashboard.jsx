import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDailyTracking, completeTask as completeTaskApi } from '../../lib/dailyTrackingService';
import { getActiveUserModules, deactivateModule, pauseModule, resumeModule } from '../../lib/moduleService';
import logger from '../../lib/logger';
import { useConfirm } from '../ui/ConfirmModal';
import ModuleDetailSheet from './ModuleDetailSheet';
import { optimizeDailyPlan } from '../../lib/optimizationEngine';
import { getCircadianIntelligence } from '../../lib/circadianService';
import YearlySuggestionBanner from './YearlySuggestionBanner';
import { getTodayLogs, deleteActivityLog, PILLAR_META } from '../../lib/smartLogService';

/**
 * Today Dashboard - Unified View
 *
 * Shows today's tasks integrated with active modules.
 * Modules are shown as collapsible sections with their tasks.
 */
export default function TodayDashboard({
  userId,
  language = 'de',
  onShowModuleHub,
  hasPlan = false,
  plan = null,
  planProgress = {},
  currentPlanDay = 1,
  onTaskToggle,
  activePack = null,
  onProtocolTaskToggle = () => { },
  activeMode = 'normal',
  calendarEvents = []
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todayTasks, setTodayTasks] = useState([]);
  const [activeModules, setActiveModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [completedToday, setCompletedToday] = useState(0);
  const [expandedModules, setExpandedModules] = useState({});
  const [expandPlan, setExpandPlan] = useState(true);
  const [moduleMenu, setModuleMenu] = useState(null); // For module action menu
  const { showConfirm, ConfirmDialog } = useConfirm();


  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [tracking, modules] = await Promise.all([
        getDailyTracking(userId, new Date()),
        getActiveUserModules(userId)
      ]);

      const serverTasks = tracking?.tasks || [];

      // Inject virtual tasks from active modules (client-side logic)
      const virtualTasks = [];
      const todayStr = new Date().toISOString().split('T')[0];

      (modules || []).forEach(m => {
        // Ensure definition exists
        const def = m.definition || m.module;
        if (def && def.daily_tasks && Array.isArray(def.daily_tasks)) {
          def.daily_tasks.forEach(dt => {
            const virtualId = `mt_${m.id}_${dt.id}`;
            const isDone = localStorage.getItem(`status_${virtualId}_${todayStr}`) === 'true';

            virtualTasks.push({
              id: virtualId,
              module_instance_id: m.id,
              title: dt.task,
              title_de: dt.task,
              completed: isDone,
              duration_minutes: dt.duration || 10,
              description: dt.description || '',
              is_virtual: true
            });
          });
        }
      });

      const allTasks = [...serverTasks, ...virtualTasks];
      setTodayTasks(allTasks);
      setActiveModules(modules || []);
      setCompletedToday(tasks.filter(t => t.completed).length);

      // Expand all modules by default
      const expanded = {};
      (modules || []).forEach(m => { expanded[m.id] = true; });
      setExpandedModules(expanded);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (taskId) => {
    const task = todayTasks.find(t => t.id === taskId);
    const newStatus = !task?.completed;

    setTodayTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, completed: newStatus } : t)
    );

    // Update count immediately for UI responsiveness
    setCompletedToday(prev => newStatus ? prev + 1 : prev - 1);

    try {
      if (task?.is_virtual) {
        // Handle virtual task (localStorage)
        const todayStr = new Date().toISOString().split('T')[0];
        if (newStatus) {
          localStorage.setItem(`status_${taskId}_${todayStr}`, 'true');
        } else {
          localStorage.removeItem(`status_${taskId}_${todayStr}`);
        }
      } else {
        // Handle normal task (server)
        await completeTaskApi(taskId);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      // Revert optimism if needed (simplified here)
    }

    setTimeout(loadData, 500);
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleDeactivateModule = async (module) => {
    const definition = module.definition || module.module;
    const name = language === 'de' ? (definition?.name_de || 'Modul') : (definition?.name_en || 'Module');

    const confirmed = await showConfirm({
      title: language === 'de' ? 'Modul deaktivieren?' : 'Deactivate module?',
      message: language === 'de'
        ? `${name} wird gestoppt und dein Fortschritt wird gespeichert.`
        : `${name} will be stopped and your progress will be saved.`,
      confirmText: language === 'de' ? 'Deaktivieren' : 'Deactivate',
      cancelText: language === 'de' ? 'Abbrechen' : 'Cancel',
      confirmVariant: 'danger',
      icon: '🛑'
    });

    if (!confirmed) return;

    const result = await deactivateModule(module.id);
    if (result.success) {
      loadData();
    }
    setModuleMenu(null);
  };

  const handlePauseModule = async (module) => {
    const result = await pauseModule(module.id);
    if (result.success) {
      loadData();
    }
    setModuleMenu(null);
  };

  const handleResumeModule = async (module) => {
    const result = await resumeModule(module.id);
    if (result.success) {
      loadData();
    }
    setModuleMenu(null);
  };

  // Get plan tasks for today
  const planDayData = plan?.days?.[currentPlanDay - 1];
  let planTasks = planDayData?.tasks || [];

  // Apply Chrono-Adaptive Optimization (v0.5.0)
  if (planTasks.length > 0) {
    try {
      const circadianIntel = getCircadianIntelligence();
      const totalCalendarMinutes = calendarEvents.reduce((sum, event) => sum + (event.duration_minutes || 60), 0);
      const isBusyDay = totalCalendarMinutes >= 240;

      const optimizedPlanDay = optimizeDailyPlan(
        { ...planDayData, tasks: planTasks },
        {
          activeMode,
          activePack,
          circadianIntel,
          isBusyDay,
          busyThreshold: 240
        }
      );

      planTasks = optimizedPlanDay.tasks;
    } catch (error) {
      console.error('[TodayDashboard] Optimization failed:', error);
      // Fall back to original tasks if optimization fails
    }
  }

  const planDayProgress = planProgress?.[currentPlanDay] || {};
  const planCompletedTasks = planTasks.filter(t => planDayProgress[t.id]).length;

  // Calculate total tasks (plan + modules)
  const allTasks = [...planTasks, ...todayTasks];
  const allCompletedCount = planCompletedTasks + completedToday;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {language === 'de' ? 'Lade deinen Tag...' : 'Loading your day...'}
          </p>
        </div>
      </div>
    );
  }

  const totalTasks = allTasks.length;
  const progressPercent = totalTasks > 0 ? (allCompletedCount / totalTasks) * 100 : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return language === 'de' ? 'Guten Morgen' : 'Good morning';
    if (hour < 18) return language === 'de' ? 'Guten Tag' : 'Good afternoon';
    return language === 'de' ? 'Guten Abend' : 'Good evening';
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header with Create Plan Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-white truncate">{getGreeting()}</h1>
          <p className="text-slate-400 text-xs sm:text-sm truncate">
            {hasPlan
              ? (language === 'de' ? `Tag ${currentPlanDay} von 30` : `Day ${currentPlanDay} of 30`)
              : activeModules.length > 0
                ? (language === 'de'
                  ? `${activeModules.length} aktive Module`
                  : `${activeModules.length} active modules`)
                : (language === 'de' ? 'Starte deine Longevity-Reise' : 'Start your longevity journey')
            }
          </p>
        </div>

        {/* Create Plan Button - shown if no plan */}
        {!hasPlan && (
          <button
            onClick={() => navigate('/intake')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl transition-colors shadow-lg shadow-amber-500/20 flex-shrink-0"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">
              {language === 'de' ? 'Neuen Plan' : 'New Plan'}
            </span>
          </button>
        )}
      </div>

      {/* Yearly Optimization Suggestion Banner */}
      <YearlySuggestionBanner
        userId={userId}
        language={language}
        onActivate={() => navigate('/module-hub')}
      />

      {/* Progress Overview Card */}
      {totalTasks > 0 && (
        <div className="rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Compact Progress Ring */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-800" />
                <circle
                  cx="32" cy="32" r="28" fill="none" stroke="url(#progressGradient)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${progressPercent * 1.76} 176`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base sm:text-lg font-bold text-white">{allCompletedCount}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500">/{totalTasks}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm text-slate-400">{language === 'de' ? 'Heute' : 'Today'}</span>
                <span className="text-xs sm:text-sm font-medium text-amber-400">{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-1.5 sm:h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {allCompletedCount === totalTasks && totalTasks > 0 && (
                <p className="text-[10px] sm:text-xs text-green-400 mt-1 flex items-center gap-1">
                  <span>✨</span>
                  {language === 'de' ? 'Alles erledigt!' : 'All done!'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Integrated Modules with Tasks - "Heute" */}
      <div className="rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-white">
              {language === 'de' ? 'Heute' : 'Today'}
            </h2>
            <TimeIndicator language={language} />
          </div>
          {activeModules.length > 0 && (
            <button
              onClick={onShowModuleHub}
              className="text-[10px] sm:text-xs text-slate-500 hover:text-amber-400 transition-colors whitespace-nowrap flex-shrink-0"
            >
              {language === 'de' ? 'Module' : 'Modules'}
            </button>
          )}
        </div>

        {!hasPlan && activeModules.length === 0 ? (
          <EmptyState language={language} onDiscover={onShowModuleHub} onCreatePlan={() => navigate('/intake')} />
        ) : (
          <div className="divide-y divide-slate-800/50">
            {/* Active Protocol Pack Section (Horizon 1 Phase 2) */}
            {activePack && (
              <div className="bg-amber-400/5 border-b border-amber-500/20">
                {/* Protocol Header */}
                <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/20 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 animate-pulse-slow">
                    {activePack.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-amber-400 font-bold text-sm sm:text-base truncate">
                        {activePack.title}
                      </h3>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-900 uppercase tracking-wider">
                        Active Protocol
                      </span>
                    </div>
                    <p className="text-slate-400 text-[10px] sm:text-xs line-clamp-1 leading-relaxed">
                      {activePack.description}
                    </p>
                  </div>
                </div>

                {/* Protocol Tasks */}
                <div className="px-3 sm:px-5 pb-4 space-y-2">
                  {activePack.tasks?.map(task => (
                    <ProtocolTaskItem
                      key={task.id}
                      task={task}
                      isCompleted={!!activePack.task_completion_status?.[task.id]?.completed}
                      language={language}
                      onComplete={() => onProtocolTaskToggle(task.id, !activePack.task_completion_status?.[task.id]?.completed)}
                    />
                  ))}
                </div>

                {/* Subtle Glow Divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
              </div>
            )}

            {/* 30-Day Plan Section */}
            {hasPlan && planTasks.length > 0 && (
              <div className="bg-slate-900/50">
                {/* Plan Header */}
                <div
                  onClick={() => setExpandPlan(!expandPlan)}
                  className="px-3 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-slate-800/30 transition-colors active:bg-slate-800/50"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center text-base sm:text-xl flex-shrink-0">
                    🎯
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm sm:text-base truncate">
                      {language === 'de' ? '30-Tage Plan' : '30-Day Plan'}
                    </h3>
                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500">
                      <span className="flex-shrink-0">Tag {currentPlanDay}/30</span>
                      <span className="w-12 sm:w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <span className="block h-full bg-amber-500" style={{ width: `${(currentPlanDay / 30) * 100}%` }} />
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className={`text-xs sm:text-sm font-medium ${planCompletedTasks === planTasks.length ? 'text-green-400' : 'text-slate-400'}`}>
                      {planCompletedTasks}/{planTasks.length}
                    </span>
                    <svg
                      className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-500 transition-transform ${expandPlan ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Plan Tasks */}
                {expandPlan && (
                  <div className="px-3 sm:px-5 pb-3 sm:pb-4 space-y-2">
                    {planTasks.map(task => (
                      <PlanTaskItem
                        key={task.id}
                        task={task}
                        isCompleted={!!planDayProgress[task.id]}
                        language={language}
                        onComplete={() => onTaskToggle && onTaskToggle(currentPlanDay, task.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Modules */}
            {activeModules.map(module => {
              const moduleTasks = todayTasks.filter(t => t.module_instance_id === module.id);
              const moduleCompleted = moduleTasks.filter(t => t.completed).length;
              const isExpanded = expandedModules[module.id];
              const definition = module.definition || module.module;
              const name = language === 'de'
                ? (definition?.name_de || definition?.name || 'Modul')
                : (definition?.name_en || definition?.name_de || 'Module');
              const progress = module.total_days > 0 ? Math.round((module.current_day / module.total_days) * 100) : 0;

              return (
                <div key={module.id} className="bg-slate-900/50">
                  {/* Module Header - Clickable */}
                  <div
                    onClick={() => toggleModule(module.id)}
                    className="px-3 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-slate-800/30 transition-colors active:bg-slate-800/50"
                  >
                    {/* Module Icon */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-800 flex items-center justify-center text-base sm:text-xl flex-shrink-0">
                      {definition?.icon || '📋'}
                    </div>

                    {/* Module Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <h3 className="text-white font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{name}</h3>
                        {module.status === 'paused' && (
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 flex-shrink-0">
                            {language === 'de' ? 'Pausiert' : 'Paused'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500">
                        <span className="flex-shrink-0">Tag {module.current_day || 1}/{module.total_days || 30}</span>
                        <span className="w-12 sm:w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                          <span className="block h-full bg-amber-500/50" style={{ width: `${progress}%` }} />
                        </span>
                      </div>
                    </div>

                    {/* Task Count & Actions */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <span className={`text-xs sm:text-sm font-medium ${moduleCompleted === moduleTasks.length && moduleTasks.length > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                        {moduleCompleted}/{moduleTasks.length}
                      </span>

                      {/* Module Menu Button */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setModuleMenu(moduleMenu === module.id ? null : module.id);
                          }}
                          className="p-1 sm:p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {moduleMenu === module.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={(e) => { e.stopPropagation(); setModuleMenu(null); }}
                            />
                            <div className="absolute right-0 top-full mt-1 w-44 sm:w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedModule(module); setModuleMenu(null); }}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs sm:text-sm text-white hover:bg-slate-700 flex items-center gap-2 sm:gap-3 transition-colors"
                              >
                                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="truncate">{language === 'de' ? 'Details' : 'Details'}</span>
                              </button>
                              {module.status === 'paused' ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleResumeModule(module); }}
                                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs sm:text-sm text-green-400 hover:bg-slate-700 flex items-center gap-2 sm:gap-3 transition-colors"
                                >
                                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {language === 'de' ? 'Fortsetzen' : 'Resume'}
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePauseModule(module); }}
                                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs sm:text-sm text-amber-400 hover:bg-slate-700 flex items-center gap-2 sm:gap-3 transition-colors"
                                >
                                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {language === 'de' ? 'Pausieren' : 'Pause'}
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeactivateModule(module); }}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs sm:text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2 sm:gap-3 transition-colors border-t border-slate-700"
                              >
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                {language === 'de' ? 'Deaktivieren' : 'Deactivate'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Expand Arrow */}
                      <svg
                        className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Tasks - Collapsible */}
                  {isExpanded && (
                    <div className="px-3 sm:px-5 pb-3 sm:pb-4 space-y-2">
                      {moduleTasks.length === 0 ? (
                        <p className="text-xs sm:text-sm text-slate-500 italic py-2">
                          {language === 'de' ? 'Keine Aufgaben für heute' : 'No tasks for today'}
                        </p>
                      ) : (
                        moduleTasks.map(task => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            language={language}
                            onComplete={() => handleTaskComplete(task.id)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SMART LOG — Getrackte Aktivitäten */}
      <TrackedActivitiesSection language={language} />

      {/* Module Detail Sheet */}
      {selectedModule && (
        <ModuleDetailSheet
          module={selectedModule}
          tasks={todayTasks.filter(t => t.module_instance_id === selectedModule.id)}
          language={language}
          onClose={() => setSelectedModule(null)}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmDialog />
    </div>
  );
}

// Task Item Component
function TaskItem({ task, language, onComplete }) {
  const isCompleted = task.completed;

  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all ${isCompleted
        ? 'bg-green-500/10 border border-green-500/20'
        : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 active:bg-slate-800'
        }`}
    >
      {/* Checkbox */}
      <button
        onClick={onComplete}
        disabled={isCompleted}
        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isCompleted
          ? 'bg-green-500 border-green-500'
          : 'border-slate-600 hover:border-amber-500'
          }`}
      >
        {isCompleted && (
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs sm:text-sm leading-tight ${isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
          {language === 'de' ? (task.title_de || task.title) : (task.title_en || task.title_de || task.title)}
        </p>
        {task.description && !isCompleted && (
          <p className="text-[10px] sm:text-xs text-slate-500 truncate mt-0.5">{task.description}</p>
        )}
      </div>

      {/* Duration */}
      {task.duration_minutes > 0 && (
        <span className="text-[10px] sm:text-xs text-slate-500 flex-shrink-0">
          {task.duration_minutes}m
        </span>
      )}
    </div>
  );
}

// Plan Task Item Component (for 30-day plan tasks) - Now with Optimization Labels
function PlanTaskItem({ task, isCompleted, onComplete }) {
  // Get pillar info
  const pillarConfig = {
    sleep: { icon: '😴', color: 'text-indigo-400' },
    nutrition: { icon: '🥗', color: 'text-green-400' },
    movement: { icon: '🏃', color: 'text-orange-400' },
    stress: { icon: '🧘', color: 'text-purple-400' },
    connection: { icon: '👥', color: 'text-pink-400' },
    environment: { icon: '🌿', color: 'text-teal-400' },
    circadian: { icon: '🌅', color: 'text-amber-400' },
    mental: { icon: '🧠', color: 'text-violet-400' },
    supplements: { icon: '💊', color: 'text-cyan-400' }
  };
  const pillar = pillarConfig[task.pillar] || { icon: '📋', color: 'text-slate-400' };

  // Task text can be in task.task or task.title
  const taskText = task.task || task.title || '';
  // Duration can be in time_minutes or duration
  const duration = task.time_minutes || task.duration;

  // Check if task is optimized
  const isOptimized = task.optimized === true;
  const showOriginalTask = task.originalTask && !isCompleted;

  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all ${isCompleted
        ? 'bg-green-500/10 border border-green-500/20'
        : isOptimized
          ? 'bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 hover:border-amber-500/50'
          : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 active:bg-slate-800'
        }`}
    >
      {/* Checkbox */}
      <button
        onClick={onComplete}
        disabled={isCompleted}
        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isCompleted
          ? 'bg-green-500 border-green-500'
          : isOptimized
            ? 'border-amber-500 hover:border-amber-400'
            : 'border-slate-600 hover:border-amber-500'
          }`}
      >
        {isCompleted && (
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Pillar Icon */}
      <span className={`text-base sm:text-lg ${pillar.color} flex-shrink-0`}>{pillar.icon}</span>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p className={`text-xs sm:text-sm leading-tight ${isCompleted ? 'text-slate-500 line-through' : 'text-white'} flex-1`}>
            {taskText}
          </p>
          {/* Optimization Badge */}
          {isOptimized && !isCompleted && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap flex-shrink-0 animate-pulse-slow">
              ⚡ Optimiert
            </span>
          )}
        </div>

        {/* Optimization Reason */}
        {isOptimized && task.optimizationReason && !isCompleted && (
          <p className="text-[10px] text-amber-400/70 italic mt-1 flex items-center gap-1">
            <span className="flex-shrink-0">→</span>
            <span>{task.optimizationReason}</span>
          </p>
        )}

        {/* Original Task (strikethrough) */}
        {showOriginalTask && (
          <p className="text-[10px] text-slate-600 line-through mt-0.5">
            {task.originalTask}
          </p>
        )}

        {/* When */}
        {task.when && !isCompleted && !task.optimizationReason && (
          <p className="text-[10px] sm:text-xs text-slate-500 capitalize mt-0.5">{task.when}</p>
        )}
      </div>

      {/* Duration (show original if modified) */}
      {duration > 0 && (
        <div className="flex flex-col items-end flex-shrink-0">
          <span className={`text-[10px] sm:text-xs ${isOptimized ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
            {duration}m
          </span>
          {task.originalTime && task.originalTime !== duration && !isCompleted && (
            <span className="text-[9px] text-slate-600 line-through">
              {task.originalTime}m
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Time Indicator Component
function TimeIndicator({ language }) {
  const hour = new Date().getHours();
  let period, icon;

  if (hour >= 5 && hour < 12) {
    period = language === 'de' ? 'Morgen' : 'Morning';
    icon = '🌅';
  } else if (hour >= 12 && hour < 17) {
    period = language === 'de' ? 'Mittag' : 'Afternoon';
    icon = '☀️';
  } else if (hour >= 17 && hour < 21) {
    period = language === 'de' ? 'Abend' : 'Evening';
    icon = '🌆';
  } else {
    period = language === 'de' ? 'Nacht' : 'Night';
    icon = '🌙';
  }

  return (
    <span className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 bg-slate-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
      <span>{icon}</span>
      <span className="hidden xs:inline">{period}</span>
    </span>
  );
}

// Empty State
function EmptyState({ language, onDiscover, onCreatePlan }) {
  return (
    <div className="p-5 sm:p-8 text-center">
      <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎯</div>
      <h3 className="text-white font-medium mb-2 text-sm sm:text-base">
        {language === 'de' ? 'Bereit für deine Longevity-Reise?' : 'Ready for your longevity journey?'}
      </h3>
      <p className="text-xs sm:text-sm text-slate-400 mb-4 sm:mb-6 max-w-sm mx-auto">
        {language === 'de'
          ? 'Erstelle einen 30-Tage Plan oder aktiviere Module.'
          : 'Create a 30-day plan or activate modules.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
        <button
          onClick={onCreatePlan}
          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-900 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {language === 'de' ? '30-Tage Plan' : '30-Day Plan'}
        </button>
        <button
          onClick={onDiscover}
          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-medium rounded-xl transition-colors text-sm sm:text-base"
        >
          {language === 'de' ? 'Module entdecken' : 'Explore Modules'}
        </button>
      </div>
    </div>
  );
}

// Protocol Task Item Component (for active protocol packs)
function ProtocolTaskItem({ task, isCompleted, onComplete }) {
  const pConfig = {
    sleep: { icon: '😴', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    nutrition: { icon: '💊', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    movement: { icon: '🏃', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    stress: { icon: '🧘', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    environment: { icon: '🛡️', color: 'text-amber-400', bg: 'bg-amber-500/10' }
  };
  const category = pConfig[task.category] || { icon: '⚡', color: 'text-amber-400', bg: 'bg-amber-500/10' };

  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all border ${isCompleted
        ? 'bg-green-500/10 border-green-500/20 opacity-75'
        : 'bg-slate-900/40 border-amber-500/20 hover:border-amber-500/40 active:bg-slate-800 shadow-sm'
        }`}
    >
      {/* Checkbox */}
      <button
        onClick={onComplete}
        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isCompleted
          ? 'bg-green-500 border-green-500'
          : 'border-amber-500/30 hover:border-amber-400 bg-slate-900/50'
          }`}
      >
        {isCompleted && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Category Icon */}
      {!isCompleted && (
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center ${category.bg} flex-shrink-0`}>
          <span className="text-lg sm:text-xl">{category.icon}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm sm:text-base font-semibold leading-tight ${isCompleted ? 'text-slate-500 line-through font-normal' : 'text-white'}`}>
            {task.title}
          </p>
          {task.priority === 'critical' && !isCompleted && (
            <span className="bg-red-500/20 text-red-500 text-[8px] font-bold px-1 rounded uppercase tracking-tighter">Required</span>
          )}
        </div>
        {(task.descr || task.description) && !isCompleted && (
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">{task.descr || task.description}</p>
        )}
      </div>

      {/* Duration */}
      {(task.time_minutes > 0 || task.duration_minutes > 0) && !isCompleted && (
        <span className="text-[10px] sm:text-xs text-amber-500/60 font-medium flex-shrink-0 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {task.time_minutes || task.duration_minutes}m
        </span>
      )}

      {/* Pulsing Style */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Tracked Activities Section — shows Smart Log entries in the daily overview
function TrackedActivitiesSection({ language }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const data = await getTodayLogs();
    setLogs(data);
    setLoading(false);
  };

  const handleDelete = async (logId) => {
    const result = await deleteActivityLog(logId);
    if (result.success) {
      setLogs(logs.filter(l => l.id !== logId));
    }
  };

  if (loading || logs.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent overflow-hidden">
      {/* Section Header */}
      <div className="px-4 sm:px-5 py-3 flex items-center gap-3 border-b border-amber-500/10">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-lg">
          ⚡
        </div>
        <div className="flex-1">
          <h3 className="text-white font-medium text-sm sm:text-base">
            {language === 'de' ? 'Getrackte Aktivitäten' : 'Tracked Activities'}
          </h3>
          <p className="text-xs text-slate-500">
            {logs.length} {language === 'de' ? 'heute erfasst' : 'logged today'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Compact pillar indicators */}
          {Object.keys(
            logs.reduce((acc, l) => { acc[l.pillar] = true; return acc; }, {})
          ).map(pillar => {
            const meta = PILLAR_META[pillar];
            return meta ? (
              <span key={pillar} className={`text-base`} title={meta.label}>{meta.emoji}</span>
            ) : null;
          })}
        </div>
      </div>

      {/* Activity Items */}
      <div className="divide-y divide-slate-800/30">
        {logs.map(log => {
          const meta = PILLAR_META[log.pillar] || PILLAR_META.movement;
          const secondaryMeta = log.secondary_pillar ? PILLAR_META[log.secondary_pillar] : null;

          return (
            <div
              key={log.id}
              className="px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-3 group hover:bg-slate-800/20 transition-colors"
            >
              {/* Emoji */}
              <span className="text-xl sm:text-2xl shrink-0">{log.display_emoji}</span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-sm font-medium truncate">
                    {log.display_text || log.activity}
                  </span>
                  {secondaryMeta && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${secondaryMeta.bgColor} ${secondaryMeta.color}`}>
                      +{secondaryMeta.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-xs text-slate-500">
                  <span className={meta.color}>{meta.label}</span>
                  {log.duration_minutes && <span>· {log.duration_minutes}min</span>}
                  {log.intensity && (
                    <span>· {log.intensity === 'high' ? '🔥' : log.intensity === 'medium' ? '⚡' : '🌱'}</span>
                  )}
                  <span>· {new Date(log.logged_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Pillar Badge */}
              <span className={`hidden sm:inline-flex text-xs px-2 py-1 rounded-lg ${meta.bgColor} ${meta.color} shrink-0`}>
                {meta.emoji} {meta.label}
              </span>

              {/* Delete */}
              <button
                onClick={() => handleDelete(log.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

