import React from 'react';

/**
 * Custom Confirm Modal - ExtensioVitae Style
 *
 * Replaces browser's native confirm() dialog with a styled modal.
 */
export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  icon = '⚠️'
}) {
  if (!isOpen) return null;

  const confirmStyles = {
    danger: 'bg-red-500 hover:bg-red-400 text-white',
    warning: 'bg-amber-500 hover:bg-amber-400 text-slate-900',
    primary: 'bg-amber-500 hover:bg-amber-400 text-slate-900'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
              confirmVariant === 'danger' ? 'bg-red-500/20' : 'bg-amber-500/20'
            }`}>
              {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-1">
                {title}
              </h3>
              <p className="text-sm text-slate-400">
                {message}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 font-semibold rounded-xl transition-colors ${confirmStyles[confirmVariant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for using the ConfirmModal
 *
 * Usage:
 * const { showConfirm, ConfirmDialog } = useConfirm();
 *
 * // In your handler:
 * const confirmed = await showConfirm({
 *   title: 'Modul deaktivieren?',
 *   message: 'Das Modul wird gestoppt...',
 *   confirmText: 'Deaktivieren',
 *   confirmVariant: 'danger'
 * });
 * if (confirmed) { ... }
 *
 * // In your JSX:
 * <ConfirmDialog />
 */
export function useConfirm() {
  const [state, setState] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Bestätigen',
    cancelText: 'Abbrechen',
    confirmVariant: 'danger',
    icon: '⚠️',
    resolve: null
  });

  const showConfirm = React.useCallback((options) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title || 'Bestätigen',
        message: options.message || '',
        confirmText: options.confirmText || 'Bestätigen',
        cancelText: options.cancelText || 'Abbrechen',
        confirmVariant: options.confirmVariant || 'danger',
        icon: options.icon || '⚠️',
        resolve
      });
    });
  }, []);

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true);
    setState(prev => ({ ...prev, isOpen: false }));
  }, [state.resolve]);

  const handleCancel = React.useCallback(() => {
    state.resolve?.(false);
    setState(prev => ({ ...prev, isOpen: false }));
  }, [state.resolve]);

  const ConfirmDialog = React.useCallback(() => (
    <ConfirmModal
      isOpen={state.isOpen}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      title={state.title}
      message={state.message}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      confirmVariant={state.confirmVariant}
      icon={state.icon}
    />
  ), [state, handleConfirm, handleCancel]);

  return { showConfirm, ConfirmDialog };
}
