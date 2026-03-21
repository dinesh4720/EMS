import { useState } from 'react';
import { Select, SelectItem, Button } from '@heroui/react';
import {
  Download, GraduationCap, Users, IndianRupee, UserCheck, FileSpreadsheet,
  CalendarCheck, Briefcase, CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const EXPORT_TYPES = [
  { key: 'students', label: 'Students', description: 'Complete student master list', icon: GraduationCap, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' },
  { key: 'staff', label: 'Staff', description: 'Staff directory with details', icon: Users, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950' },
  { key: 'fee-collection', label: 'Fee Collection', description: 'Payment records and summaries', icon: IndianRupee, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  { key: 'attendance', label: 'Attendance', description: 'Student attendance records', icon: UserCheck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' },
  { key: 'exam-results', label: 'Exam Results', description: 'Exam scores and analysis', icon: FileSpreadsheet, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950' },
  { key: 'payroll', label: 'Payroll', description: 'Staff salary records', icon: Briefcase, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950' },
];

export default function ExportCenter() {
  const { classesWithTeachers, currentAcademicYear } = useApp();
  const [exporting, setExporting] = useState(null);
  const [format, setFormat] = useState('xlsx');

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const params = new URLSearchParams({ format, academicYear: currentAcademicYear || '' });
      const url = `${API_URL}/export/${type}?${params}`;
      const response = await fetch(url, { credentials: 'include' });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
      toast.success(`${type} exported successfully`);
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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Export Center</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Download school data as Excel or CSV files</p>
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

      {/* Export Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_TYPES.map((exp) => (
          <div
            key={exp.key}
            className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900/50 p-5 flex flex-col"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg ${exp.bg} flex items-center justify-center shrink-0`}>
                <exp.icon size={20} className={exp.color} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{exp.label}</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{exp.description}</p>
              </div>
            </div>
            <div className="mt-auto">
              <Button
                size="sm"
                variant="flat"
                className="w-full"
                startContent={exporting === exp.key ? null : <Download size={14} />}
                isLoading={exporting === exp.key}
                onPress={() => handleExport(exp.key)}
              >
                {exporting === exp.key ? 'Exporting...' : `Export ${format.toUpperCase()}`}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Exports are scoped to your school</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              All exported data is filtered by your current academic year and school context. Sensitive fields like passwords are never included.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
