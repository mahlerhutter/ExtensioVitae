import React, { useState, useEffect, useMemo } from 'react';
import { getAvailableModules } from '../../lib/moduleService';
import ModulePreview from './ModulePreview';

/**
 * Module Marketplace Component
 *
 * Browse and install available modules.
 */
export default function ModuleMarketplace({ userId, language = 'de', onActivate, onClose }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedModule, setSelectedModule] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    try {
      const data = await getAvailableModules();
      setModules(data || []);
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(['all']);
    modules.forEach(m => {
      if (m.category) cats.add(m.category);
    });
    return Array.from(cats);
  }, [modules]);

  // Filter modules
  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      // Category filter
      if (selectedCategory !== 'all' && m.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = (language === 'de' ? m.name_de : m.name_en || m.name_de).toLowerCase();
        const desc = (language === 'de' ? m.description_de : m.description_en || m.description_de).toLowerCase();
        return name.includes(query) || desc.includes(query);
      }

      return true;
    });
  }, [modules, selectedCategory, searchQuery, language]);

  // Group by category for display
  const groupedModules = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredModules };
    }

    const groups = {};
    filteredModules.forEach(m => {
      const cat = m.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    });
    return groups;
  }, [filteredModules, selectedCategory]);

  const getCategoryLabel = (category) => {
    const labels = {
      all: { de: 'Alle', en: 'All' },
      nutrition: { de: 'Ernährung', en: 'Nutrition' },
      exercise: { de: 'Bewegung', en: 'Exercise' },
      sleep: { de: 'Schlaf', en: 'Sleep' },
      mindfulness: { de: 'Achtsamkeit', en: 'Mindfulness' },
      fasting: { de: 'Fasten', en: 'Fasting' },
      supplements: { de: 'Supplements', en: 'Supplements' },
      recovery: { de: 'Erholung', en: 'Recovery' },
      plans: { de: 'Pläne', en: 'Plans' },
      other: { de: 'Sonstiges', en: 'Other' }
    };
    return labels[category]?.[language] || category;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      nutrition: '🥗',
      exercise: '🏃',
      sleep: '😴',
      mindfulness: '🧘',
      fasting: '⏱️',
      supplements: '💊',
      recovery: '🌿',
      plans: '📋',
      other: '📦'
    };
    return icons[category] || '📦';
  };

  // Show module preview
  if (selectedModule) {
    return (
      <ModulePreview
        module={selectedModule}
        userId={userId}
        language={language}
        onActivate={(config) => {
          onActivate?.(selectedModule, config);
          setSelectedModule(null);
        }}
        onBack={() => setSelectedModule(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">
              {language === 'de' ? 'Module' : 'Modules'}
            </h2>
            <p className="text-sm text-slate-400">
              {modules.length} {language === 'de' ? 'verfügbar' : 'available'}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'de' ? 'Module suchen...' : 'Search modules...'}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {category !== 'all' && <span className="mr-1">{getCategoryIcon(category)}</span>}
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Module list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-slate-400">
              {language === 'de' ? 'Keine Module gefunden' : 'No modules found'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedModules).map(([category, categoryModules]) => (
              <div key={category}>
                {selectedCategory === 'all' && (
                  <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                    <span>{getCategoryIcon(category)}</span>
                    {getCategoryLabel(category)}
                  </h3>
                )}
                <div className="grid gap-3">
                  {categoryModules.map(module => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      language={language}
                      onClick={() => setSelectedModule(module)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Module Card Component
function ModuleCard({ module, language, onClick }) {
  const name = language === 'de' ? module.name_de : (module.name_en || module.name_de);
  const description = language === 'de' ? module.description_de : (module.description_en || module.description_de);

  const getDifficultyColor = (level) => {
    const colors = {
      beginner: 'bg-green-500/20 text-green-400',
      intermediate: 'bg-yellow-500/20 text-yellow-400',
      advanced: 'bg-orange-500/20 text-orange-400',
      expert: 'bg-red-500/20 text-red-400'
    };
    return colors[level] || 'bg-slate-500/20 text-slate-400';
  };

  const getDifficultyLabel = (level) => {
    const labels = {
      beginner: { de: 'Anfänger', en: 'Beginner' },
      intermediate: { de: 'Mittel', en: 'Intermediate' },
      advanced: { de: 'Fortgeschritten', en: 'Advanced' },
      expert: { de: 'Experte', en: 'Expert' }
    };
    return labels[level]?.[language] || level;
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all text-left"
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-2xl flex-shrink-0">
          {module.icon || '📋'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-white font-medium truncate">{name}</h4>
            {module.is_premium && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 flex-shrink-0">
                PRO
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 line-clamp-2 mt-1">{description}</p>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2">
            {module.duration_days && (
              <span className="text-xs text-slate-500">
                {module.duration_days} {language === 'de' ? 'Tage' : 'days'}
              </span>
            )}
            {module.difficulty_level && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(module.difficulty_level)}`}>
                {getDifficultyLabel(module.difficulty_level)}
              </span>
            )}
            {module.tasks_per_day && (
              <span className="text-xs text-slate-500">
                ~{module.tasks_per_day} {language === 'de' ? 'Tasks/Tag' : 'tasks/day'}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <svg className="w-5 h-5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
