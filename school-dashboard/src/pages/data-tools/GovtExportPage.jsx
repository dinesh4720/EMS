import { useState } from 'react';
import { Button, Select, SelectItem } from '@heroui/react';
import {
  Download, Building2, FileText, ShieldCheck, ClipboardCheck,
  BookOpen, GraduationCap,
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const GOVT_TEMPLATES = [
  {
    key: 'udise',
    label: 'UDISE+ Enrollment',
    description: 'Unified District Information System for Education — enrollment data by class, gender, and category',
    icon: Building2,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950',
    endpoint: '/export/govt/udise',
  },
  {
    key: 'cbse',
    label: 'CBSE Affiliation Data',
    description: 'Student data in CBSE affiliation portal format',
    icon: GraduationCap,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    endpoint: '/export/govt/cbse',
  },
  {
    key: 'icse',
    label: 'ICSE Portal Data',
    description: 'Student data formatted for CISCE/ICSE portal submission',
    icon: BookOpen,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950',
    endpoint: '/export/govt/icse',
  },
  {
    key: 'state-board',
    label: 'State Board Export',
    description: 'Student data for state education board submissions',
    icon: FileText,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950',
    endpoint: '/export/govt/state-board',
  },
  {
    key: 'annual-report',
    label: 'Annual Report',
    description: 'Comprehensive school annual statistics report',
    icon: ClipboardCheck,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950',
    endpoint: '/export/govt/annual-report',
  },
  {
    key: 'compliance-checklist',
    label: 'Compliance Checklist',
    description: 'Regulatory compliance status check with pass/fail indicators',
    icon: ShieldCheck,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950',
    endpoint: '/export/govt/compliance-checklist',
  },
];

export default function GovtExportPage() {
  const [exporting, setExporting] = useState(null);
  const [format, setFormat] = useState('xlsx');

  const handleExport = async (template) => {
    setExporting(template.key);
    try {
      const params = new URLSearchParams({ format });
      const url = `${API_URL}${template.endpoint}?${params}`;
      const response = await fetch(url, { credentials: 'include' });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${template.key}_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
      toast.success(`${template.label} exported`);
    } catch (err) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Government Exports</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Download data in formats required by education boards and regulatory bodies
          </p>
        </div>
        <div className="w-36">
          <Select
            label="Format"
            size="sm"
            selectedKeys={[format]}
            onChange={(e) => setFormat(e.target.value)}
          >
            <SelectItem key="xlsx" textValue="Excel (.xlsx)">Excel (.xlsx)</SelectItem>
            <SelectItem key="csv" textValue="CSV (.csv)">CSV (.csv)</SelectItem>
          </Select>
        </div>
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GOVT_TEMPLATES.map((tpl) => (
          <div
            key={tpl.key}
            className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900/50 p-5 flex flex-col"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg ${tpl.bg} flex items-center justify-center shrink-0`}>
                <tpl.icon size={20} className={tpl.color} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{tpl.label}</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">{tpl.description}</p>
              </div>
            </div>
            <div className="mt-auto">
              <Button
                size="sm"
                variant="flat"
                className="w-full"
                startContent={exporting === tpl.key ? null : <Download size={14} />}
                isLoading={exporting === tpl.key}
                onPress={() => handleExport(tpl)}
              >
                {exporting === tpl.key ? 'Exporting...' : `Download ${format.toUpperCase()}`}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
        <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
          Exported data follows the latest format specifications from each regulatory body. Please verify the data before submitting to official portals, as field requirements may change. Configure your school's UDISE number, affiliation number, and board of education in Settings &gt; Institution to ensure accurate exports.
        </p>
      </div>
    </div>
  );
}
