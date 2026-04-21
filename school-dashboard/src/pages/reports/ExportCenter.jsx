import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { API_URL } from '../../config/api';
import { clearStoredUser, getAuthHeaders } from '../../utils/authSession';

/* ──────────────────────────────────────────────────────
   Module definitions
   ────────────────────────────────────────────────────── */
const MODULES = [
  {
    key: 'students',
    name: 'Student List',
    endpoint: '/export/students',
    requiredFilters: [],
  },
  {
    key: 'staff',
    name: 'Staff List',
    endpoint: '/export/staff',
    requiredFilters: [],
  },
  {
    key: 'fee-collection',
    name: 'Fee Collection',
    endpoint: '/export/fee-collection',
    requiredFilters: [],
  },
  {
    key: 'defaulters',
    name: 'Fee Defaulters',
    endpoint: '/export/defaulters',
    requiredFilters: [],
  },
  {
    key: 'attendance',
    name: 'Attendance Summary',
    endpoint: '/export/attendance',
    requiredFilters: [
      { key: 'startDate', label: 'Start date', type: 'date' },
      { key: 'endDate', label: 'End date', type: 'date' },
    ],
  },
  {
    key: 'exam-results',
    name: 'Exam Results',
    endpoint: '/export/exam-results',
    requiredFilters: [
      { key: 'examId', label: 'Exam', type: 'select', optionsEndpoint: '/exams?limit=200' },
    ],
  },
  {
    key: 'payroll',
    name: 'Payroll Summary',
    endpoint: '/export/payroll',
    requiredFilters: [],
  },
  {
    key: 'staff-attendance',
    name: 'Staff Attendance',
    endpoint: '/export/staff-attendance',
    requiredFilters: [],
  },
  {
    key: 'class-results',
    name: 'Class Results Summary',
    endpoint: '/export/class-results',
    requiredFilters: [],
  },
  {
    key: 'student-strength',
    name: 'Student Strength',
    endpoint: '/export/student-strength',
    requiredFilters: [],
  },
];

/* ──────────────────────────────────────────────────────
   Format extensions helper
   ────────────────────────────────────────────────────── */
function getFileExtension(format) {
  switch (format) {
    case 'excel': return 'xlsx';
    case 'pdf': return 'pdf';
    default: return 'csv';
  }
}

function getMimeType(format) {
  switch (format) {
    case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'pdf': return 'application/pdf';
    default: return 'text/csv';
  }
}

/* ──────────────────────────────────────────────────────
   Export Card Component
   ────────────────────────────────────────────────────── */
function ExportCard({ module }) {
  const [format, setFormat] = useState('csv');
  const [filters, setFilters] = useState({});
  const [errors, setErrors] = useState({});
  const [exporting, setExporting] = useState(false);
  const [selectOptions, setSelectOptions] = useState({});

  useEffect(() => {
    const selectFilters = module.requiredFilters.filter((f) => f.type === 'select');
    if (selectFilters.length === 0) return;

    selectFilters.forEach(async (f) => {
      try {
        const res = await fetch(`${API_URL}${f.optionsEndpoint}`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setSelectOptions((prev) => ({ ...prev, [f.key]: data }));
        }
      } catch {
        // leave dropdown empty on error
      }
    });
  }, [module]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field when user types
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleDownload = async () => {
    // Validate required filters
    const newErrors = {};
    for (const f of module.requiredFilters) {
      if (!filters[f.key] || filters[f.key].trim() === '') {
        newErrors[f.key] = `${f.label} is required`;
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setExporting(true);
    setErrors({});

    try {
      // Build query params
      const params = new URLSearchParams({ format });
      for (const [k, v] of Object.entries(filters)) {
        if (v) params.set(k, v);
      }

      const url = `${API_URL}${module.endpoint}?${params.toString()}`;
      const response = await fetch(url, {
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
      });

      if (response.status === 401) {
        clearStoredUser();
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get data as blob
      const blob = await response.blob();
      const ext = getFileExtension(format);
      const downloadUrl = URL.createObjectURL(
        new Blob([blob], { type: getMimeType(format) })
      );
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${module.key}-export.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      toast.success(`${module.name} exported successfully`);
    } catch (error) {
      console.error(`Failed to export ${module.name}:`, error);
      toast.error(`Failed to export ${module.name}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{module.name}</h3>

      {/* Required filter inputs */}
      {module.requiredFilters.map((f) => (
        <div key={f.key}>
          <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">{f.label}</label>
          {f.type === 'select' ? (
            <select
              value={filters[f.key] || ''}
              onChange={(e) => handleFilterChange(f.key, e.target.value)}
              className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
            >
              <option value="">Select {f.label}</option>
              {(selectOptions[f.key] || []).map((opt) => (
                <option key={opt._id} value={opt._id}>
                  {opt.name}{opt.className ? ` — ${opt.className}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.type === 'date' ? 'date' : 'text'}
              value={filters[f.key] || ''}
              onChange={(e) => handleFilterChange(f.key, e.target.value)}
              placeholder={f.label}
              className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
            />
          )}
          {errors[f.key] && (
            <p className="text-xs text-red-500 mt-1">{errors[f.key]}</p>
          )}
        </div>
      ))}

      {/* Format selector + Download button */}
      <div className="flex items-center gap-2">
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
        >
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
          <option value="pdf">PDF</option>
        </select>

        <button
          onClick={handleDownload}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-200 disabled:opacity-60 transition-colors"
        >
          {exporting && (
            <span className="w-4 h-4 border-2 border-white dark:border-zinc-900 border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
          )}
          {exporting ? 'Exporting...' : 'Download'}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   EXPORT CENTER PAGE
   ══════════════════════════════════════════════════════ */
export default function ExportCenter() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Export Center</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Download school data in CSV, Excel, or PDF format
        </p>
      </div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((mod) => (
          <ExportCard key={mod.key} module={mod} />
        ))}
      </div>
    </div>
  );
}
