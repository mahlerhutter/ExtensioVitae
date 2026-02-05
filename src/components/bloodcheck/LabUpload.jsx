import React, { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';
import { logger } from '../../lib/logger';

export default function LabUpload({ onUploadComplete }) {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFiles(files[0]);
        }
    }, []);

    const handleFileInput = (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files[0]);
        }
    };

    const handleFiles = async (file) => {
        if (!user) {
            addToast('Bitte melde dich an, um Dateien hochzuladen.', 'error');
            return;
        }

        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'];
        if (!validTypes.includes(file.type)) {
            addToast('Nur PDF, JPG, PNG oder HEIC Dateien erlaubt.', 'error');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            addToast('Datei ist zu groß (Max 10MB).', 'error');
            return;
        }

        setUploading(true);
        setProgress(10); // Start progress

        try {
            // 1. Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('lab-reports')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            setProgress(50); // Upload done

            // 2. Create database record
            const { data: dbData, error: dbError } = await supabase
                .from('lab_results')
                .insert({
                    user_id: user.id,
                    file_path: filePath,
                    test_date: new Date().toISOString(), // Default to today, user can edit later
                    status: 'pending', // Will trigger Edge Function processing later
                    provider: 'Manual Upload'
                })
                .select()
                .single();

            if (dbError) throw dbError;

            setProgress(100);
            addToast('Upload erfolgreich! Analyse wird gestartet...', 'success');
            logger.info('[LabUpload] File uploaded successfully:', dbData.id);

            if (onUploadComplete) {
                onUploadComplete(dbData);
            }

        } catch (error) {
            logger.error('[LabUpload] Upload failed:', error);
            addToast('Upload fehlgeschlagen: ' + error.message, 'error');
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    return (
        <div
            className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out text-center group cursor-pointer
        ${isDragOver
                    ? 'border-amber-400 bg-amber-400/5'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-900/50 hover:bg-slate-800/50'
                }
      `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('lab-file-input').click()}
        >
            <input
                type="file"
                id="lab-file-input"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.heic"
                onChange={handleFileInput}
                disabled={uploading}
            />

            {uploading ? (
                <div className="flex flex-col items-center justify-center py-4">
                    <div className="w-12 h-12 border-4 border-slate-700 border-t-amber-400 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-300 font-medium">Wird hochgeladen...</p>
                    <div className="w-48 h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
                        <div
                            className="h-full bg-amber-400 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            ) : (
                <>
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center transition-transform group-hover:scale-110 ${isDragOver ? 'bg-amber-400/20 text-amber-400' : 'text-slate-400'}`}>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>

                    <h3 className="text-lg font-medium text-white mb-2">
                        Laborbericht hochladen
                    </h3>
                    <p className="text-slate-400 text-sm mb-4 max-w-sm mx-auto">
                        Ziehe dein PDF oder Bild hierher, oder klicke zum Auswählen.
                    </p>

                    <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-medium">
                        <span className="bg-slate-800 px-2 py-1 rounded">PDF</span>
                        <span className="bg-slate-800 px-2 py-1 rounded">JPG</span>
                        <span className="bg-slate-800 px-2 py-1 rounded">PNG</span>
                    </div>
                </>
            )}
        </div>
    );
}
