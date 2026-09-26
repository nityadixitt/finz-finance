import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { uploadCsvFile, seedDemoData, getSampleCsvDownloadUrl } from '../services/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ inserted: number; reviewed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.txt')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a valid .csv file.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await uploadCsvFile(file);
      setSuccessResult({
        inserted: result.insertedCount,
        reviewed: result.reviewedCount,
      });
      // Real-time immediate refresh
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Failed to ingest CSV.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await seedDemoData();
      setSuccessResult({
        inserted: result.insertedCount,
        reviewed: result.reviewedCount,
      });
      // Real-time immediate refresh
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Failed to load demo data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0d1322] p-6 sm:p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Upload className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Ingest Bank Transactions</h3>
            <p className="text-xs text-slate-400">
              CSV Schema: Transaction ID, Date, Description, Counterparty, Amount, Method
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successResult && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Ingestion complete! Processed {successResult.inserted} transactions ({successResult.reviewed} queued for review).
            </span>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
            file
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-slate-700 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv,.txt"
            className="hidden"
          />
          {file ? (
            <div className="flex flex-col items-center">
              <FileText className="w-10 h-10 text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-white">{file.name}</p>
              <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB • Ready to parse</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-200">
                Drag and drop your bank CSV here, or <span className="text-emerald-400 underline">browse</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                Supports Standard Bank Statement formats (UTF-8)
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Process & Ingest CSV</span>
          </button>

          <a
            href={getSampleCsvDownloadUrl()}
            download="sample_transactions.csv"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sample CSV</span>
          </a>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors underline"
          >
            Or re-seed the default 3-month demo dataset
          </button>
        </div>
      </div>
    </div>
  );
};
