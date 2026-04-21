import { useState } from 'react';
import { Chip } from '@heroui/react';
import toast from 'react-hot-toast';
import { API_URL } from '../../config/api';
import { clearStoredUser, getAuthHeaders } from '../../utils/authSession';

const EXPORT_TYPES = [
  { key: 'udise', title: 'UDISE+ Enrollment', badge: 'UDISE+', badgeColor: 'primary', hasClassId: false },
  { key: 'cbse', title: 'CBSE Affiliation Data', badge: 'CBSE', badgeColor: 'success', hasClassId: true },
  { key: 'icse', title: 'ICSE Portal Format', badge: 'ICSE', badgeColor: 'warning', hasClassId: true },
  { key: 'state-board', title: 'State Board Format', badge: 'State Board', badgeColor: 'secondary', hasClassId: true },
  { key: 'annual-report', title: 'Annual Report Summary', badge: 'Annual', badgeColor: 'default', hasClassId: false },
  { key: 'compliance-checklist', title: 'Compliance Checklist', badge: 'Checklist', badgeColor: 'default', hasClassId: false },
];

export default function GovtExport() {
  const [filters, setFilters] = useState(() =>
    Object.fromEntries(EXPORT_TYPES.map((t) => [t.key, { academicYear: '', classId: '' }]))
  );
  const [exporting, setExporting] = useState(null); // "udise-csv" etc.

  const updateFilter = (key, field, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleExport = async (type, format) => {
    const exportKey = `${type}-${format}`;
    const { academicYear, classId } = filters[type];

    setExporting(exportKey);
    try {
      const params = new URLSearchParams();
      if (academicYear) params.set('academicYear', academicYear);
      if (classId) params.set('classId', classId);
      params.set('format', format);

      const url = `${API_URL}/export/govt/${type}?${params.toString()}`;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.status === 401) {
        clearStoredUser();
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(err.error || 'Export failed');
      }

      // Trigger download
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || `${type}_export.${format}`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Export downloaded');
    } catch (err) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Government Portal Exports</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Export data in formats required by government portals and regulatory bodies.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {EXPORT_TYPES.map((type) => (
          <div
            key={type.key}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{type.title}</h3>
              <Chip size="sm" variant="flat" color={type.badgeColor}>{type.badge}</Chip>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2025-26"
                  className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={filters[type.key].academicYear}
                  onChange={(e) => updateFilter(type.key, 'academicYear', e.target.value)}
                />
              </div>

              {type.hasClassId && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Class ID
                  </label>
                  <input
                    type="text"
                    placeholder="Class ObjectId"
                    className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={filters[type.key].classId}
                    onChange={(e) => updateFilter(type.key, 'classId', e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors disabled:opacity-50"
                disabled={exporting === `${type.key}-csv`}
                onClick={() => handleExport(type.key, 'csv')}
              >
                CSV
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors disabled:opacity-50"
                disabled={exporting === `${type.key}-excel`}
                onClick={() => handleExport(type.key, 'excel')}
              >
                Excel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors disabled:opacity-50"
                disabled={exporting === `${type.key}-pdf`}
                onClick={() => handleExport(type.key, 'pdf')}
              >
                PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
