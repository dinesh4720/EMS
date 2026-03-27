import { API_URL } from '../../config/api.js';
import { useState, useMemo } from 'react';
import { Select, SelectItem, Button, Input } from '@heroui/react';
import {
  Download, GraduationCap, Users, IndianRupee, UserCheck, FileSpreadsheet,
  CalendarCheck, Briefcase, CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getAuthHeaders } from '../../utils/authSession';

const EXPORT_TYPE_ICONS = {
  students: { icon: GraduationCap, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' },
  staff: { icon: Users, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950' },
  'fee-collection': { icon: IndianRupee, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  attendance: { icon: UserCheck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' },
  'exam-results': { icon: FileSpreadsheet, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950' },
  payroll: { icon: Briefcase, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950' },
};

export default function ExportCenter() {
  const { t } = useTranslation();
  const { classesWithTeachers, currentAcademicYear } = useApp();
  const [exporting, setExporting] = useState(null);
  const [format, setFormat] = useState('xlsx');

  // Date range for attendance export (defaults to current academic year: Apr 1 – Mar 31)
  const currentYear = new Date().getFullYear();
  const defaultStartDate = currentAcademicYear
    ? `${currentAcademicYear.split('-')[0]}-04-01`
    : `${currentYear}-04-01`;
  const defaultEndDate = currentAcademicYear
    ? `${parseInt(currentAcademicYear.split('-')[0]) + 1}-03-31`
    : `${currentYear + 1}-03-31`;
  const [attendanceStartDate, setAttendanceStartDate] = useState(defaultStartDate);
  const [attendanceEndDate, setAttendanceEndDate] = useState(defaultEndDate);
  const EXPORT_TYPES = useMemo(() => [
    { key: 'students', label: t('exportCenter.types.students.label'), description: t('exportCenter.types.students.description'), ...EXPORT_TYPE_ICONS.students },
    { key: 'staff', label: t('exportCenter.types.staff.label'), description: t('exportCenter.types.staff.description'), ...EXPORT_TYPE_ICONS.staff },
    { key: 'fee-collection', label: t('exportCenter.types.feeCollection.label'), description: t('exportCenter.types.feeCollection.description'), ...EXPORT_TYPE_ICONS['fee-collection'] },
    { key: 'attendance', label: t('exportCenter.types.attendance.label'), description: t('exportCenter.types.attendance.description'), ...EXPORT_TYPE_ICONS.attendance },
    { key: 'exam-results', label: t('exportCenter.types.examResults.label'), description: t('exportCenter.types.examResults.description'), ...EXPORT_TYPE_ICONS['exam-results'] },
    { key: 'payroll', label: t('exportCenter.types.payroll.label'), description: t('exportCenter.types.payroll.description'), ...EXPORT_TYPE_ICONS.payroll },
  ], [t]);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const params = new URLSearchParams({ format });
      if (currentAcademicYear) {
        params.set('academicYear', currentAcademicYear);
      }
      // Attendance export requires startDate/endDate
      if (type === 'attendance') {
        if (!attendanceStartDate || !attendanceEndDate) {
          toast.error(t('exportCenter.dateRangeRequired', 'Start date and end date are required for attendance export'));
          setExporting(null);
          return;
        }
        params.set('startDate', attendanceStartDate);
        params.set('endDate', attendanceEndDate);
      }
      const url = `${API_URL}/export/${type}?${params}`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

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
      toast.success(t('exportCenter.exportButton', { format: format.toUpperCase() }) + ' ' + t('common.success', 'successful'));
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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">{t('exportCenter.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('exportCenter.subtitle')}</p>
        </div>
        <div className="w-36">
          <Select
            label={t('exportCenter.formatLabel')}
            size="sm"
            selectedKeys={[format]}
            onChange={(e) => setFormat(e.target.value)}
          >
            <SelectItem key="xlsx" textValue="Excel (.xlsx)">{t('pages.excelXlsx')}</SelectItem>
            <SelectItem key="csv" textValue="CSV (.csv)">{t('pages.cSVCsv')}</SelectItem>
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
            {/* Date range inputs for attendance export */}
            {exp.key === 'attendance' && (
              <div className="flex gap-2 mb-3">
                <Input
                  type="date"
                  size="sm"
                  label={t('common.startDate', 'Start Date')}
                  value={attendanceStartDate}
                  onChange={(e) => setAttendanceStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  size="sm"
                  label={t('common.endDate', 'End Date')}
                  value={attendanceEndDate}
                  onChange={(e) => setAttendanceEndDate(e.target.value)}
                />
              </div>
            )}
            <div className="mt-auto">
              <Button
                size="sm"
                variant="flat"
                className="w-full"
                startContent={exporting === exp.key ? null : <Download size={14} />}
                isLoading={exporting === exp.key}
                onPress={() => handleExport(exp.key)}
              >
                {exporting === exp.key ? t('exportCenter.exporting') : t('exportCenter.exportButton', { format: format.toUpperCase() })}
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
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('exportCenter.scopeInfo')}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{t('exportCenter.scopeDetail')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
