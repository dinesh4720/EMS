import { useState, useRef, useCallback } from 'react';
import { Button, Chip, Checkbox } from '@heroui/react';
import { Upload, Download, FileText, Users, UserCheck, DollarSign, Calendar, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../../config/api';
import { clearStoredUser, getAuthHeaders } from '../../utils/authSession';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const IMPORT_TYPES = [
  { key: 'students', label: 'Students', icon: Users },
  { key: 'staff', label: 'Staff', icon: UserCheck },
  { key: 'fees', label: 'Fee Payments', icon: DollarSign },
  { key: 'attendance', label: 'Attendance', icon: Calendar },
];

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

const statusColor = {
  completed: 'success',
  running: 'primary',
  failed: 'danger',
  queued: 'warning',
  rolled_back: 'default',
};

const statusLabel = {
  completed: 'Completed',
  running: 'Running',
  failed: 'Failed',
  queued: 'Queued',
  rolled_back: 'Rolled Back',
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
}

export default function BulkImport() {
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'history'
  const [selectedType, setSelectedType] = useState('students');
  const [file, setFile] = useState(null);
  const [dryRun, setDryRun] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rollingBack, setRollingBack] = useState(null);
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

  const validateFile = (f) => {
    if (!f) return false;
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error('Only CSV and Excel files (.csv, .xlsx, .xls) are accepted');
      return false;
    }
    return true;
  };

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f && validateFile(f)) {
      setFile(f);
      setResult(null);
    }
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f && validateFile(f)) {
      setFile(f);
      setResult(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${API_URL}/bulk-import/template/${selectedType}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (response.status === 401) { clearStoredUser(); throw new Error('Session expired. Please log in again.'); }
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || `bulk-import-${selectedType}-template.csv`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch {
      toast.error('Failed to download template');
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const headers = getAuthHeaders();
      // Do not set Content-Type for FormData
      delete headers['Content-Type'];

      const url = `${API_URL}/bulk-import/${selectedType}${dryRun ? '?dryRun=true' : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      });

      if (response.status === 401) { clearStoredUser(); throw new Error('Session expired. Please log in again.'); }
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const errMsg =
          typeof errData?.error === 'string' ? errData.error
          : errData?.message || 'Import failed';
        throw new Error(errMsg);
      }

      const data = await response.json();
      setResult(data);

      if (dryRun) {
        toast.success('Dry run completed');
      } else {
        const failedCount = Array.isArray(data.failed) ? data.failed.length : (data.failed || 0);
        const importedCount = data.imported || 0;
        if (failedCount > 0 && importedCount === 0) {
          toast.error(`Import failed — ${failedCount} row(s) had errors, nothing was imported`);
        } else if (failedCount > 0) {
          toast(`${importedCount} imported, ${failedCount} failed — check errors below`, { icon: '⚠️' });
        } else {
          toast.success(`Import completed — ${importedCount} record(s) imported`);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`${API_URL}/bulk-import/history`, {
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
      });
      if (response.status === 401) { clearStoredUser(); throw new Error('Session expired. Please log in again.'); }
      if (!response.ok) throw new Error('Failed to load history');
      const data = await response.json();
      setHistory(data?.jobs || []);
    } catch {
      toast.error('Failed to load import history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleHistoryTab = () => {
    setActiveTab('history');
    fetchHistory();
  };

  const handleRollback = (jobId) => {
    showConfirm({
      title: 'Rollback Import',
      message: 'Are you sure you want to rollback this import? This will undo all changes.',
      variant: 'warning',
      confirmText: 'Rollback',
      onConfirm: async () => {
        setRollingBack(jobId);
        try {
          const response = await fetch(`${API_URL}/bulk-import/history/${jobId}/rollback`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            credentials: 'include',
          });
          if (response.status === 401) { clearStoredUser(); throw new Error('Session expired. Please log in again.'); }
          if (!response.ok) throw new Error('Rollback failed');

          toast.success('Import rolled back successfully');
          // Refresh history
          fetchHistory();
        } catch {
          toast.error('Rollback failed');
        } finally {
          setRollingBack(null);
        }
      },
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Bulk Import</h1>

      {/* Tab buttons */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-0">
        <button
          role="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'import'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
          onClick={() => setActiveTab('import')}
        >
          Import
        </button>
        <button
          role="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
          onClick={handleHistoryTab}
        >
          History
        </button>
      </div>

      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Type selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {IMPORT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.key;
              return (
                <button
                  key={type.key}
                  role="button"
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                  onClick={() => {
                    setSelectedType(type.key);
                    setFile(null);
                    setResult(null);
                  }}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* Download template */}
          <div className="flex items-center gap-3">
            <Button
              variant="bordered"
              size="sm"
              startContent={<Download size={14} />}
              onPress={handleDownloadTemplate}
            >
              Download Template
            </Button>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Download a pre-formatted template for {selectedType} import
            </span>
          </div>

          {/* Upload area */}
          <div
            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
            />

            {file ? (
              <div className="space-y-2">
                <FileText size={32} className="mx-auto text-primary-500" />
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{file.name}</p>
                <p className="text-xs text-zinc-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload size={32} className="mx-auto text-zinc-400 dark:text-zinc-500" />
                <p className="text-zinc-600 dark:text-zinc-400">
                  Drag and drop a file here or click to browse
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Accepted formats: csv, xlsx, xls
                </p>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                isSelected={dryRun}
                onValueChange={setDryRun}
                size="sm"
              >
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Dry run</span>
              </Checkbox>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                (validate without importing)
              </span>
            </div>

            {dryRun ? (
              <Button
                color="primary"
                variant="flat"
                isDisabled={!file}
                isLoading={importing}
                onPress={handleImport}
              >
                Validate File
              </Button>
            ) : (
              <Button
                color="primary"
                isDisabled={!file}
                isLoading={importing}
                onPress={handleImport}
              >
                Import
              </Button>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Import Result</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                  <p className="text-xs text-green-700 dark:text-green-400">Imported</p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">Skipped</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{Array.isArray(result.failed) ? result.failed.length : result.failed}</p>
                  <p className="text-xs text-red-700 dark:text-red-400">Failed</p>
                </div>
              </div>

              {result.dryRun && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  This was a dry run. No data was imported.
                </p>
              )}

              {result.message && (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {result.message}
                </p>
              )}

              {Array.isArray(result.failed) && result.failed.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Error Details</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {result.failed.map((row, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs p-2 bg-red-50 dark:bg-red-950 rounded">
                        <span className="text-red-600 font-mono shrink-0">Row {row.row}</span>
                        <span className="text-red-700 dark:text-red-400">{row.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {historyLoading ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs text-zinc-500 dark:text-zinc-400 uppercase">
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Results</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, r) => (
                    <tr key={r} className="animate-pulse">
                      {Array.from({ length: 6 }).map((_, c) => (
                        <td key={c} className="px-4 py-3">
                          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 dark:text-zinc-500">
              No import history found
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs text-zinc-500 dark:text-zinc-400 uppercase">
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Results</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((job) => (
                    <tr key={job._id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {job.fileName}
                      </td>
                      <td className="px-4 py-3 capitalize text-zinc-600 dark:text-zinc-400">
                        {job.type}
                      </td>
                      <td className="px-4 py-3">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={statusColor[job.status] || 'default'}
                        >
                          {statusLabel[job.status] || job.status}
                        </Chip>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 text-xs">
                        {job.importedCount > 0 || job.skippedCount > 0 || job.failedCount > 0 ? (
                          <span>
                            {job.importedCount} imported, {job.skippedCount} skipped, {job.failedCount} failed
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                        {formatDate(job.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {job.status === 'completed' && !job.dryRun && job.importedCount > 0 && (
                          <Button
                            size="sm"
                            variant="flat"
                            color="warning"
                            isLoading={rollingBack === job._id}
                            startContent={<RotateCcw size={12} />}
                            onPress={() => handleRollback(job._id)}
                          >
                            Rollback
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
