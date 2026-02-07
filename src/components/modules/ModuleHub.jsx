import React, { useState, useEffect, useCallback } from 'react';
import {
  getAvailableModules,
  getUserModules,
  getModuleCategories,
  activateModule,
  pauseModule,
  resumeModule,
  deactivateModule
} from '../../lib/moduleService';
import { useToast } from '../Toast';
import { useConfirm } from '../ui/ConfirmModal';
import ModuleCard from './ModuleCard';
import ModuleConfigModal from './ModuleConfigModal';
import ModuleDetailSheet from '../dashboard/ModuleDetailSheet';

/**
 * Module Hub Component
 *
 * Central place to discover, activate, and manage modules.
 * Shows available modules by category and active module instances.
 */
export default function ModuleHub({ userId, language = 'de' }) {
  const [availableModules, setAvailableModules] = useState([]);
  const [userModules, setUserModules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [view, setView] = useState('active'); // 'active' | 'discover'
  const [loading, setLoading] = useState(true);
  const [configModal, setConfigModal] = useState(null); // Module to configure
  const [selectedDetailModule, setSelectedDetailModule] = useState(null); // Module for detail sheet
  const { addToast } = useToast();
  const { showConfirm, ConfirmDialog } = useConfirm();

  // Load data
  const loadData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const [modules, userMods, cats] = await Promise.all([
        getAvailableModules(),
        getUserModules(userId),
        getModuleCategories()
      ]);

      setAvailableModules(modules);
      setUserModules(userMods);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading module hub:', error);
      addToast(language === 'de' ? 'Fehler beim Laden' : 'Error loading modules', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId, language, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check if module is already active
  const isModuleActive = (moduleId) => {
    return userModules.some(um => um.module_id === moduleId && um.status === 'active');
  };

  const isModulePaused = (moduleId) => {
    return userModules.some(um => um.module_id === moduleId && um.status === 'paused');
  };

  const getModuleInstance = (moduleId) => {
    return userModules.find(um => um.module_id === moduleId);
  };

  // Filter modules by category
  const filteredModules = selectedCategory === 'all'
    ? availableModules
    : availableModules.filter(m => m.category === selectedCategory);

  // Handlers
  const handleActivate = (module) => {
    // If module has config schema, show config modal
    if (module.config_schema && Object.keys(module.config_schema).length > 0) {
      setConfigModal(module);
    } else {
      // Activate directly
      handleActivateWithConfig(module, {});
    }
  };

  const handleActivateWithConfig = async (module, config) => {
    try {
      const result = await activateModule(userId, module.slug, config);

      if (result.success) {
        addToast(
          language === 'de' ? `${module.name_de} aktiviert!` : `${module.name_en} activated!`,
          'success'
        );
        loadData();
        setConfigModal(null);
      } else {
        // Better error message for common issues
        const errorMsg = result.error || 'Error';
        if (errorMsg.includes('foreign key') || errorMsg.includes('module_definitions')) {
          addToast(
            language === 'de'
              ? '⚠️ Module-System noch nicht initialisiert. Bitte Datenbank-Migration ausführen.'
              : '⚠️ Module system not initialized. Please run database migration.',
            'error'
          );
        } else if (errorMsg.includes('already active')) {
          addToast(
            language === 'de' ? 'Modul ist bereits aktiv' : 'Module already active',
            'info'
          );
        } else {
          addToast(errorMsg, 'error');
        }
      }
    } catch (error) {
      console.error('[ModuleHub] Activation error:', error);
      addToast(
        language === 'de'
          ? `Fehler: ${error.message}. Bitte versuche es später erneut.`
          : `Error: ${error.message}. Please try again later.`,
        'error'
      );
    }
  };

  const handlePause = async (instanceId, moduleName) => {
    const result = await pauseModule(instanceId);
    if (result.success) {
      addToast(
        language === 'de' ? `${moduleName} pausiert` : `${moduleName} paused`,
        'info'
      );
      loadData();
    } else {
      addToast(result.error, 'error');
    }
  };

  const handleResume = async (instanceId, moduleName) => {
    const result = await resumeModule(instanceId);
    if (result.success) {
      addToast(
        language === 'de' ? `${moduleName} fortgesetzt` : `${moduleName} resumed`,
        'success'
      );
      loadData();
    } else {
      addToast(result.error, 'error');
    }
  };

  const handleDeactivate = async (instanceId, moduleName) => {
    const confirmed = await showConfirm({
      title: language === 'de' ? 'Modul deaktivieren?' : 'Deactivate module?',
      message: language === 'de'
        ? `${moduleName} wird gestoppt und dein Fortschritt wird gespeichert. Du kannst das Modul jederzeit wieder aktivieren.`
        : `${moduleName} will be stopped and your progress will be saved. You can reactivate the module anytime.`,
      confirmText: language === 'de' ? 'Deaktivieren' : 'Deactivate',
      cancelText: language === 'de' ? 'Abbrechen' : 'Cancel',
      confirmVariant: 'danger',
      icon: '🛑'
    });

    if (!confirmed) return;

    const result = await deactivateModule(instanceId);
    if (result.success) {
      addToast(
        language === 'de' ? `${moduleName} deaktiviert` : `${moduleName} deactivated`,
        'info'
      );
      loadData();
    } else {
      addToast(result.error, 'error');
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-slate-800 rounded" />
          <div className="h-32 bg-slate-800 rounded" />
          <div className="h-32 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  const activeModules = userModules.filter(um => um.status === 'active');
  const pausedModules = userModules.filter(um => um.status === 'paused');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {language === 'de' ? 'Module Hub' : 'Module Hub'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {language === 'de'
                ? `${activeModules.length} aktive Module`
                : `${activeModules.length} active modules`}
            </p>
          </div>

          {/* View toggle */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setView('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'active'
                  ? 'bg-amber-500 text-slate-900'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              {language === 'de' ? 'Aktiv' : 'Active'}
              {activeModules.length > 0 && (
                <span className="ml-1.5 text-xs">({activeModules.length})</span>
              )}
            </button>
            <button
              onClick={() => setView('discover')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'discover'
                  ? 'bg-amber-500 text-slate-900'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              {language === 'de' ? 'Entdecken' : 'Discover'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {view === 'active' ? (
          // Active Modules View
          <>
            {activeModules.length === 0 && pausedModules.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🧩</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {language === 'de' ? 'Keine aktiven Module' : 'No Active Modules'}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  {language === 'de'
                    ? 'Aktiviere Module, um personalisierte Aufgaben zu erhalten.'
                    : 'Activate modules to receive personalized tasks.'}
                </p>
                <button
                  onClick={() => setView('discover')}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors"
                >
                  {language === 'de' ? 'Module entdecken' : 'Discover Modules'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active */}
                {activeModules.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-3">
                      {language === 'de' ? 'Aktiv' : 'Active'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeModules.map((instance) => (
                        <ModuleCard
                          key={instance.id}
                          module={instance.module}
                          instance={instance}
                          language={language}
                          onPause={() => handlePause(instance.id, instance.module.name_de)}
                          onDeactivate={() => handleDeactivate(instance.id, instance.module.name_de)}
                          onShowDetails={() => setSelectedDetailModule(instance)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Paused */}
                {pausedModules.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-3">
                      {language === 'de' ? 'Pausiert' : 'Paused'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pausedModules.map((instance) => (
                        <ModuleCard
                          key={instance.id}
                          module={instance.module}
                          instance={instance}
                          language={language}
                          isPaused
                          onResume={() => handleResume(instance.id, instance.module.name_de)}
                          onDeactivate={() => handleDeactivate(instance.id, instance.module.name_de)}
                          onShowDetails={() => setSelectedDetailModule(instance)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          // Discover View
          <>
            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all'
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
              >
                {language === 'de' ? 'Alle' : 'All'}
              </button>
              {categories.filter(c => c.count > 0).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                >
                  <span className="mr-1.5">{cat.icon}</span>
                  {language === 'de' ? cat.name_de : cat.name_en}
                  <span className="ml-1.5 text-xs opacity-70">({cat.count})</span>
                </button>
              ))}
            </div>

            {/* Module grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredModules.map((module) => {
                const isActive = isModuleActive(module.id);
                const isPaused = isModulePaused(module.id);
                const instance = getModuleInstance(module.id);

                return (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    instance={instance}
                    language={language}
                    isActive={isActive}
                    isPaused={isPaused}
                    isDiscovery
                    onActivate={() => handleActivate(module)}
                    onPause={() => instance && handlePause(instance.id, module.name_de)}
                    onResume={() => instance && handleResume(instance.id, module.name_de)}
                    onShowDetails={() => setSelectedDetailModule({ module })}
                  />
                );
              })}
            </div>

            {filteredModules.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-400">
                  {language === 'de'
                    ? 'Keine Module in dieser Kategorie.'
                    : 'No modules in this category.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Config Modal */}
      {configModal && (
        <ModuleConfigModal
          module={configModal}
          language={language}
          onActivate={(config) => handleActivateWithConfig(configModal, config)}
          onClose={() => setConfigModal(null)}
        />
      )}

      {/* Module Detail Sheet */}
      {selectedDetailModule && (
        <ModuleDetailSheet
          module={selectedDetailModule}
          language={language}
          onClose={() => setSelectedDetailModule(null)}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmDialog />
    </div>
  );
}
