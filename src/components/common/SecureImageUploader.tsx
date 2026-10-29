import React, { useState, useRef } from 'react';
import { validateAndProcessImageUpload, FileValidationResult } from '../../utils/secureUpload';
import { Upload, X, CheckCircle2, AlertTriangle, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { sanitizeURL } from '../../utils/sanitize';

interface SecureImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  maxSizeMB?: number;
}

export const SecureImageUploader: React.FC<SecureImageUploaderProps> = ({
  value,
  onChange,
  label = 'Product Image',
  maxSizeMB = 3,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [mode, setMode] = useState<'upload' | 'url'>('upload');

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    setSuccessInfo(null);
    setIsProcessing(true);

    try {
      const result: FileValidationResult = await validateAndProcessImageUpload(file, {
        maxSizeInMB: maxSizeMB,
      });

      if (!result.isValid) {
        setErrorMessage(result.error || 'Failed to upload image.');
        setIsProcessing(false);
        return;
      }

      if (result.dataUrl) {
        onChange(result.dataUrl);
        setSuccessInfo(`Safely processed & sanitized (${result.fileSizeFormatted})`);
      }
    } catch (err) {
      setErrorMessage('Unexpected error processing image file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    const sanitized = sanitizeURL(urlInput.trim());
    if (!sanitized) {
      setErrorMessage('Invalid or unsafe URL protocol. Only http:// and https:// image URLs are allowed.');
      return;
    }
    setErrorMessage(null);
    onChange(sanitized);
    setSuccessInfo('Image URL validated and sanitized');
    setUrlInput('');
  };

  const handleRemove = () => {
    onChange('');
    setErrorMessage(null);
    setSuccessInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentSafeImage = sanitizeURL(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
          <span>{label}</span>
          <span className="inline-flex items-center text-[10px] font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Max {maxSizeMB}MB • JPG, PNG, WEBP
          </span>
        </label>

        {/* Toggle Mode */}
        <div className="flex space-x-1 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-colors ${
              mode === 'upload'
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-colors ${
              mode === 'url'
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Web URL
          </button>
        </div>
      </div>

      {/* Preview if exists */}
      {currentSafeImage ? (
        <div className="relative flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden border border-slate-300 dark:border-slate-600 shrink-0 flex items-center justify-center">
            <img
              src={currentSafeImage}
              alt="Safe Preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              Image Loaded Securely
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              ✓ Sanitized & protected against script execution
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            title="Remove Image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {mode === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center space-y-1.5">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isProcessing ? 'Verifying binary signature & re-encoding...' : 'Click or drag safe image file'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Strict type checking (JPG, PNG, WEBP, AVIF up to {maxSizeMB}MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="flex space-x-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}
        </>
      )}

      {/* Status Feedback */}
      {errorMessage && (
        <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 text-xs bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successInfo && (
        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{successInfo}</span>
        </div>
      )}
    </div>
  );
};
