import { useId, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Download, FileText, Users, UserCheck, DollarSign, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Checkbox from '../../components/ui/Checkbox';
import { requestBlob, requestUpload } from '../../services/api';

const IMPORT_TYPES = [
  { key: 'students', label: 'Students', icon: Users },
  { key: 'staff', label: 'Staff', icon: UserCheck },
  { key: 'fees', label: 'Fee Payments', icon: DollarSign },
  { key: 'attendance', label: 'Attendance', icon: Calendar },
];

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

function ImportTypeCard({ type, isSelected, onSelect }) {
  const { t } = useTranslation();
  const Icon = type.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={
        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors text-center ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2 ' +
        (isSelected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
          : 'border-border-token bg-surface text-fg-muted hover:border-border-token')
      }
    >
      <Icon size={20} aria-hidden="true" />
      <span className="text-sm font-medium">{t('dataTools.bulkImport.types.' + type.key, type.label)}</span>
    </button>
  );
}

function ResultPanel({ result }) {
  const { t } = useTranslation();
  if (!result) return null;

  const failedCount = Array.isArray(result.failed) ? result.failed.length : result.failed;

  return (
    <Card padding="md" radius="lg" className="space-y-4">
      <h2 className="font-semibold text-fg">{t('dataTools.bulkImport.resultTitle', 'Import Result')}</h2>
      <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
        <div className="p-3 bg-green-50 dark:bg-green-950/40 rounded-lg">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.imported}</p>
          <p className="text-xs text-green-700 dark:text-green-300">{t('dataTools.bulkImport.imported', 'Imported')}</p>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{result.skipped}</p>
          <p className="text-xs text-amber-700 dark:text-amber-300">{t('dataTools.bulkImport.skipped', 'Skipped')}</p>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-lg">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{failedCount}</p>
          <p className="text-xs text-red-700 dark:text-red-300">{t('dataTools.bulkImport.failed', 'Failed')}</p>
        </div>
      </div>

      {result.dryRun && (
        <p className="text-sm text-fg-muted">
          {t('dataTools.bulkImport.dryRunNotice', 'This was a dry run. No data was imported.')}
        </p>
      )}

      {result.message && (
        <p className="text-sm text-fg">{result.message}</p>
      )}

      {Array.isArray(result.failed) && result.failed.length > 0 && (
        <div className="mt-2">
          <h3 className="text-sm font-medium text-fg mb-2">
            {t('dataTools.bulkImport.errorDetails', 'Error Details')}
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {result.failed.map((row, i) => (
              <div
                key={row.row != null ? `failed-row-${row.row}` : `failed-${i}`}
                className="flex items-start gap-2 text-xs p-2 bg-red-50 dark:bg-red-950/40 rounded"
              >
                <span className="text-red-600 dark:text-red-400 font-mono shrink-0">
                  {t('dataTools.bulkImport.rowLabel', { row: row.row, defaultValue: 'Row {{row}}' })}
                </span>
                <span className="text-red-700 dark:text-red-300">{row.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function BulkImportForm() {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState('students');
  const [file, setFile] = useState(null);
  const [dryRun, setDryRun] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const fileInputId = useId();

  const validateFile = (picked) => {
    if (!picked) return false;
    const ext = picked.name.substring(picked.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error(t('dataTools.bulkImport.invalidFileType', 'Only CSV and Excel files (.csv, .xlsx, .xls) are accepted'));
      return false;
    }
    return true;
  };

  const handleFileSelect = (event) => {
    const picked = event.target.files?.[0];
    if (picked && validateFile(picked)) {
      setFile(picked);
      setResult(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const picked = event.dataTransfer?.files?.[0];
    if (picked && validateFile(picked)) {
      setFile(picked);
      setResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      // [SEC-08] Route through requestBlob() so a 401 attempts a token refresh
      // before logging the user out, instead of a premature session clear.
      const response = await requestBlob(`/bulk-import/template/${selectedType}`);

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || `bulk-import-${selectedType}-template.csv`;

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch {
      toast.error(t('dataTools.bulkImport.templateDownloadFailed', 'Failed to download template'));
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error(t('dataTools.bulkImport.selectFileFirst', 'Please select a file first'));
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // [SEC-08] Route through requestUpload() so a 401 attempts a token refresh
      // before logging the user out, instead of a premature session clear.
      // requestUpload omits Content-Type (browser sets the multipart boundary)
      // and returns the parsed JSON body.
      const data = await requestUpload(
        `/bulk-import/${selectedType}${dryRun ? '?dryRun=true' : ''}`,
        formData
      );
      setResult(data);

      if (dryRun) {
        toast.success(t('dataTools.bulkImport.dryRunCompleted', 'Dry run completed'));
      } else {
        const failedCount = Array.isArray(data.failed) ? data.failed.length : data.failed || 0;
        const importedCount = data.imported || 0;
        if (failedCount > 0 && importedCount === 0) {
          toast.error(t('dataTools.bulkImport.importFailedNothing', {
            count: failedCount,
            defaultValue: 'Import failed — {{count}} row(s) had errors, nothing was imported',
          }));
        } else if (failedCount > 0) {
          toast(t('dataTools.bulkImport.importPartial', {
            imported: importedCount,
            failed: failedCount,
            defaultValue: '{{imported}} imported, {{failed}} failed — check errors below',
          }), {
            icon: '⚠️',
          });
        } else {
          toast.success(t('dataTools.bulkImport.importCompleted', {
            count: importedCount,
            defaultValue: 'Import completed — {{count}} record(s) imported',
          }));
        }
      }
    } catch (err) {
      toast.error(err.message || t('dataTools.bulkImport.importFailed', 'Import failed'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {IMPORT_TYPES.map((type) => (
          <ImportTypeCard
            key={type.key}
            type={type}
            isSelected={selectedType === type.key}
            onSelect={() => {
              setSelectedType(type.key);
              setFile(null);
              setResult(null);
            }}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          icon={<Download size={14} />}
          onClick={handleDownloadTemplate}
        >
          {t('dataTools.bulkImport.downloadTemplate', 'Download Template')}
        </Button>
        <span className="text-xs text-fg-muted">
          {t('dataTools.bulkImport.templateHint', { type: selectedType, defaultValue: 'Download a pre-formatted template for {{type}} import' })}
        </span>
      </div>

      <label
        htmlFor={fileInputId}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={
          'block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ' +
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-primary)]/30 focus-within:ring-offset-2 ' +
          (isDragging
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
            : 'border-border-token hover:border-[var(--color-primary)]/60')
        }
      >
        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          className="sr-only"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
        />

        {file ? (
          <div className="space-y-2">
            <FileText size={32} className="mx-auto text-[var(--color-primary)]" aria-hidden="true" />
            <p className="font-medium text-fg">{file.name}</p>
            <p className="text-xs text-fg-muted">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload size={32} className="mx-auto text-fg-faint" aria-hidden="true" />
            <p className="text-fg">
              {t('dataTools.bulkImport.dropPrompt', 'Drag and drop a file here or click to browse')}
            </p>
            <p className="text-xs text-fg-muted">
              {t('dataTools.bulkImport.acceptedFormats', 'Accepted formats: csv, xlsx, xls')}
            </p>
          </div>
        )}
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox
          checked={dryRun}
          onChange={(e) => setDryRun(e.target.checked)}
          size="sm"
          label={t('dataTools.bulkImport.dryRun', 'Dry run')}
          description={t('dataTools.bulkImport.dryRunDescription', 'Validate without importing')}
        />

        <Button
          variant={dryRun ? 'secondary' : 'primary'}
          disabled={!file}
          loading={importing}
          onClick={handleImport}
        >
          {dryRun ? t('dataTools.bulkImport.validateFile', 'Validate File') : t('dataTools.bulkImport.importButton', 'Import')}
        </Button>
      </div>

      <ResultPanel result={result} />
    </div>
  );
}
