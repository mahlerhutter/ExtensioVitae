import React, { useState, useEffect } from 'react';

/**
 * Module Config Modal
 *
 * Collects configuration for a module before activation.
 * Renders form fields based on the module's config_schema.
 */
export default function ModuleConfigModal({ module, language = 'de', onActivate, onClose }) {
  const [config, setConfig] = useState({});
  const [errors, setErrors] = useState({});

  // Initialize config with defaults from schema
  useEffect(() => {
    if (module?.config_schema?.properties) {
      const defaults = {};
      Object.entries(module.config_schema.properties).forEach(([key, schema]) => {
        if (schema.default !== undefined) {
          defaults[key] = schema.default;
        }
      });
      setConfig(defaults);
    }
  }, [module]);

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    const schema = module.config_schema;

    if (schema?.required) {
      schema.required.forEach(key => {
        if (!config[key] && config[key] !== 0 && config[key] !== false) {
          newErrors[key] = language === 'de' ? 'Pflichtfeld' : 'Required';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onActivate(config);
    }
  };

  const schema = module?.config_schema;
  const properties = schema?.properties || {};

  // Render form field based on type
  const renderField = (key, fieldSchema) => {
    const value = config[key] ?? '';
    const error = errors[key];
    const isRequired = schema?.required?.includes(key);

    // Get label
    const label = fieldSchema.title ||
      (language === 'de' ? fieldSchema.title_de : fieldSchema.title_en) ||
      key;

    // Get description
    const description = fieldSchema.description ||
      (language === 'de' ? fieldSchema.description_de : fieldSchema.description_en);

    // Common wrapper
    const Field = ({ children }) => (
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
          {isRequired && <span className="text-red-400 ml-1">*</span>}
        </label>
        {children}
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
      </div>
    );

    // String / time input
    if (fieldSchema.type === 'string') {
      if (fieldSchema.format === 'time') {
        return (
          <Field key={key}>
            <input
              type="time"
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-white
                ${error ? 'border-red-500' : 'border-slate-700'}
                focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500`}
            />
          </Field>
        );
      }

      if (fieldSchema.enum) {
        return (
          <Field key={key}>
            <select
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-white
                ${error ? 'border-red-500' : 'border-slate-700'}
                focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500`}
            >
              <option value="">
                {language === 'de' ? '-- Auswählen --' : '-- Select --'}
              </option>
              {fieldSchema.enum.map((opt) => (
                <option key={opt} value={opt}>
                  {fieldSchema.enumLabels?.[opt] || opt}
                </option>
              ))}
            </select>
          </Field>
        );
      }

      return (
        <Field key={key}>
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={fieldSchema.placeholder}
            className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-white
              ${error ? 'border-red-500' : 'border-slate-700'}
              focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500`}
          />
        </Field>
      );
    }

    // Number input
    if (fieldSchema.type === 'number' || fieldSchema.type === 'integer') {
      return (
        <Field key={key}>
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(key, e.target.value ? Number(e.target.value) : '')}
            min={fieldSchema.minimum}
            max={fieldSchema.maximum}
            step={fieldSchema.type === 'integer' ? 1 : undefined}
            className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-white
              ${error ? 'border-red-500' : 'border-slate-700'}
              focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500`}
          />
        </Field>
      );
    }

    // Boolean (checkbox)
    if (fieldSchema.type === 'boolean') {
      return (
        <Field key={key}>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(key, e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-slate-300">
              {fieldSchema.checkboxLabel || label}
            </span>
          </label>
        </Field>
      );
    }

    // Array of strings (multi-select / tags)
    if (fieldSchema.type === 'array' && fieldSchema.items?.type === 'string') {
      const options = fieldSchema.items.enum || [];
      const currentArray = Array.isArray(value) ? value : [];

      return (
        <Field key={key}>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const isSelected = currentArray.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      handleChange(key, currentArray.filter(v => v !== opt));
                    } else {
                      handleChange(key, [...currentArray, opt]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isSelected
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {fieldSchema.items.enumLabels?.[opt] || opt}
                </button>
              );
            })}
          </div>
        </Field>
      );
    }

    // Fallback
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{module.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {language === 'de' ? module.name_de : module.name_en}
              </h3>
              <p className="text-sm text-slate-400">
                {language === 'de' ? 'Modul konfigurieren' : 'Configure Module'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {/* Description */}
          <p className="text-sm text-slate-400 mb-6">
            {language === 'de' ? module.description_de : module.description_en}
          </p>

          {/* Form fields */}
          {Object.entries(properties).map(([key, fieldSchema]) =>
            renderField(key, fieldSchema)
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            {language === 'de' ? 'Abbrechen' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors"
          >
            {language === 'de' ? 'Aktivieren' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}
