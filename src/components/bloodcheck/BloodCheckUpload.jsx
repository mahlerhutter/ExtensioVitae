import React, { useState, useRef } from 'react';

/**
 * Blood Check Upload Component
 *
 * Handles file upload for lab reports with OCR.
 */
export default function BloodCheckUpload({ language = 'de', onUpload, onCancel }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert(language === 'de'
        ? 'Bitte nur Bilder (JPG, PNG) oder PDF hochladen.'
        : 'Please upload only images (JPG, PNG) or PDF.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(language === 'de'
        ? 'Datei zu groß. Maximum: 10MB'
        : 'File too large. Maximum: 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      await onUpload(selectedFile);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? 'border-amber-500 bg-amber-500/10'
            : selectedFile
              ? 'border-green-500 bg-green-500/10'
              : 'border-slate-700 hover:border-slate-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {selectedFile ? (
          <div>
            <div className="text-4xl mb-3">✅</div>
            <p className="text-white font-medium">{selectedFile.name}</p>
            <p className="text-sm text-slate-400 mt-1">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              onClick={() => setSelectedFile(null)}
              className="mt-3 text-sm text-slate-400 hover:text-red-400 transition-colors"
            >
              {language === 'de' ? 'Entfernen' : 'Remove'}
            </button>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-3">📄</div>
            <p className="text-white font-medium mb-2">
              {language === 'de'
                ? 'Blutbild hier ablegen'
                : 'Drop blood panel here'}
            </p>
            <p className="text-sm text-slate-400 mb-4">
              {language === 'de'
                ? 'oder klicken zum Auswählen'
                : 'or click to select'}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
            >
              {language === 'de' ? 'Datei auswählen' : 'Select file'}
            </button>
            <p className="text-xs text-slate-500 mt-4">
              JPG, PNG, PDF · Max 10MB
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-slate-800/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-white mb-2">
          💡 {language === 'de' ? 'Tipps für beste Ergebnisse' : 'Tips for best results'}
        </h4>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• {language === 'de' ? 'Gut lesbare Fotos oder Scans' : 'Clear, readable photos or scans'}</li>
          <li>• {language === 'de' ? 'Alle Werte im Bild sichtbar' : 'All values visible in image'}</li>
          <li>• {language === 'de' ? 'PDF direkt vom Labor ist am besten' : 'PDF directly from lab is best'}</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
        >
          {language === 'de' ? 'Abbrechen' : 'Cancel'}
        </button>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              {language === 'de' ? 'Wird analysiert...' : 'Analyzing...'}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {language === 'de' ? 'Analysieren' : 'Analyze'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
