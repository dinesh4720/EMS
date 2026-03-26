import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Select, SelectItem, Chip } from '@heroui/react';
import {
  Upload, FileSpreadsheet, Download, AlertTriangle, CheckCircle2,
  XCircle, Loader2,
} from 'lucide-react';
import { bulkImportApi } from '../../services/api';
import { API_URL } from '../../config/api.js';
import { getAuthHeaders } from '../../utils/authSession';
import toast from 'react-hot-toast';

const IMPORT_TYPES = [
  { key: 'students', label: 'Students', description: 'Import student records from CSV/Excel' },
  { key: 'staff', label: 'Staff', description: 'Import staff members from CSV/Excel' },
  { key: 'fees', label: 'Fee Payments', description: 'Import fee payment records' },
  { key: 'attendance', label: 'Attendance', description: 'Import attendance corrections' },
  { key: 'results', label: 'Exam Results', description: 'Import exam result data' },
];

export default function BulkImportPage() {
  const { t } = useTranslation();
  const [importType, setImportType] = useState('students');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (!droppedFile) return;
    if (droppedFile.size > MAX_FILE_SIZE) {
      toast.error(t('toast.error.fileSizeExceeds10mbLimit'));
      return;
    }
    if (/\.(csv|xlsx|xls)$/i.test(droppedFile.name)) {
      setFile(droppedFile);
      setPreview(null);
      setResult(null);
    } else {
      toast.error(t('toast.error.onlyCsvAndExcelFilesAreSupported'));
    }
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE) {
      toast.error(t('toast.error.fileSizeExceeds10mbLimit'));
      e.target.value = '';
      return;
    }
    setFile(selected);
    setPreview(null);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', importType);

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 10, 90));
      }, 300);

      const data = await bulkImportApi.upload(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (data.preview) {
        setPreview(data);
        toast.success(`File parsed: ${data.preview.length} rows found`);
      } else if (data.jobId) {
        setResult({ status: 'queued', jobId: data.jobId, message: data.message || 'Import queued for background processing' });
        toast.success(t('toast.success.importJobQueued'));
      } else {
        setResult({ status: 'success', ...data });
        toast.success(data.message || 'Import completed');
      }
    } catch (err) {
      toast.error(err.message || 'Upload failed');
      setResult({ status: 'error', message: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${API_URL}/bulk-import/template/${importType}`, { headers: getAuthHeaders(), credentials: 'include' });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk-import-${importType}-template.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('toast.error.failedToDownloadTemplate'));
    }
  };

  const selectedType = IMPORT_TYPES.find((t) => t.key === importType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">{t('pages.bulkImport')}</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('pages.importDataFromCsvOrExcelFiles')}</p>
      </div>

      {/* Type Selection + Template Download */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900/50 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-56">
            <Select
              label={t('pages.importType')}
              size="sm"
              selectedKeys={[importType]}
              onChange={(e) => {
                setImportType(e.target.value);
                setFile(null);
                setPreview(null);
                setResult(null);
              }}
            >
              {IMPORT_TYPES.map((t) => (
                <SelectItem key={t.key} textValue={t.label}>{t.label}</SelectItem>
              ))}
            </Select>
          </div>
          <Button
            size="sm"
            variant="flat"
            startContent={<Download size={14} />}
            onPress={handleDownloadTemplate}
          >
            Download Template
          </Button>
        </div>
        {selectedType && (
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-3">{selectedType.description}</p>
        )}
      </div>

      {/* Drop Zone */}
      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors p-8 text-center
          ${dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500'
            : 'border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload size={32} className="mx-auto text-gray-400 dark:text-zinc-500 mb-3" />
        <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
          {file ? file.name : 'Drop a file here or click to browse'}
        </p>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Supports CSV, XLS, XLSX (max 10 MB)
        </p>
        {file && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <FileSpreadsheet size={14} className="text-emerald-500" />
            <span className="text-xs text-gray-600 dark:text-zinc-400">
              {(file.size / 1024).toFixed(1)} KB
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setResult(null); }}
              className="text-xs text-rose-500 hover:text-rose-600 ml-2"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 size={16} className="animate-spin text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('pages.uploadingProcessing')}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {file && !uploading && !result && (
        <div className="flex justify-end">
          <Button
            color="primary"
            startContent={<Upload size={16} />}
            onPress={handleUpload}
          >
            Upload & Import
          </Button>
        </div>
      )}

      {/* Preview Table */}
      {preview?.preview && (
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.dataPreview')}</h3>
            <Chip size="sm" variant="flat">{preview.preview.length} rows</Chip>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-800">
                  {Object.keys(preview.preview[0] || {}).map((col) => (
                    <th key={col} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {preview.preview.slice(0, 10).map((row, i) => (
                  <tr key={`row-${i}`} className="hover:bg-gray-50 dark:hover:bg-zinc-900">
                    {Object.values(row).map((val, j) => (
                      <td key={`cell-${i}-${j}`} className="px-4 py-2.5 text-gray-700 dark:text-zinc-300 whitespace-nowrap">
                        {val !== null && val !== undefined ? String(val) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-lg border p-4 flex items-start gap-3
          ${result.status === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
            : result.status === 'queued'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'}
        `}>
          {result.status === 'error' ? (
            <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          ) : result.status === 'queued' ? (
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
              {result.status === 'error' ? 'Import Failed' : result.status === 'queued' ? 'Import Queued' : 'Import Successful'}
            </p>
            <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">{result.message}</p>
            {result.inserted > 0 && (
              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">{result.inserted} records imported</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
