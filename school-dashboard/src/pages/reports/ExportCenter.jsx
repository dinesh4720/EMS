import { useState, useEffect, useMemo } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../../config/api';
import { clearStoredUser, getAuthHeaders } from '../../utils/authSession';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import SectionHeading from '../../components/ui/SectionHeading';

const MODULES = [
  { key: 'students', name: 'Student List', endpoint: '/export/students', requiredFilters: [] },
  { key: 'staff', name: 'Staff List', endpoint: '/export/staff', requiredFilters: [] },
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

const FORMAT_OPTIONS = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

function getFileExtension(format) {
  switch (format) {
    case 'excel':
      return 'xlsx';
    case 'pdf':
      return 'pdf';
    default:
      return 'csv';
  }
}

function getMimeType(format) {
  switch (format) {
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'text/csv';
  }
}

function ExportCard({ module }) {
  const [format, setFormat] = useState('csv');
  const [filters, setFilters] = useState({});
  const [errors, setErrors] = useState({});
  const [exporting, setExporting] = useState(false);
  const [selectOptions, setSelectOptions] = useState({});

  useEffect(() => {
    const selectFilters = module.requiredFilters.filter((filter) => filter.type === 'select');
    if (selectFilters.length === 0) return undefined;
    let cancelled = false;
    selectFilters.forEach(async (filter) => {
      try {
        const res = await fetch(`${API_URL}${filter.optionsEndpoint}`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setSelectOptions((prev) => ({ ...prev, [filter.key]: Array.isArray(data) ? data : [] }));
          }
        }
      } catch {
        // leave dropdown empty on error
      }
    });
    return () => {
      cancelled = true;
    };
  }, [module]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleDownload = async () => {
    const newErrors = {};
    for (const filter of module.requiredFilters) {
      const value = filters[filter.key];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        newErrors[filter.key] = `${filter.label} is required`;
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setExporting(true);
    setErrors({});

    try {
      const params = new URLSearchParams({ format });
      for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
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

      const blob = await response.blob();
      const ext = getFileExtension(format);
      const downloadUrl = URL.createObjectURL(
        new Blob([blob], { type: getMimeType(format) })
      );
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${module.key}-export.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      toast.success(`${module.name} exported successfully`);
    } catch (error) {
      console.error(`Failed to export ${module.name}:`, error);
      toast.error(`Failed to export ${module.name}. Check your connection and try again.`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card padding="md" radius="lg" className="space-y-4">
      <SectionHeading size="sm" as="h3">
        {module.name}
      </SectionHeading>

      {module.requiredFilters.length > 0 && (
        <div className="space-y-3">
          {module.requiredFilters.map((filter) => {
            if (filter.type === 'select') {
              return (
                <Select
                  key={filter.key}
                  label={filter.label}
                  size="sm"
                  value={filters[filter.key] || ''}
                  onChange={(event) => handleFilterChange(filter.key, event.target.value)}
                  error={errors[filter.key]}
                >
                  <option value="">Select {filter.label}</option>
                  {(selectOptions[filter.key] || []).map((opt) => (
                    <option key={opt._id} value={opt._id}>
                      {opt.name}
                      {opt.className ? ` — ${opt.className}` : ''}
                    </option>
                  ))}
                </Select>
              );
            }
            return (
              <Input
                key={filter.key}
                label={filter.label}
                size="sm"
                type={filter.type === 'date' ? 'date' : 'text'}
                value={filters[filter.key] || ''}
                onChange={(event) => handleFilterChange(filter.key, event.target.value)}
                placeholder={filter.label}
                error={errors[filter.key]}
              />
            );
          })}
        </div>
      )}

      <div className="flex items-end gap-2 pt-1">
        <Select
          label="Format"
          size="sm"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          options={FORMAT_OPTIONS}
          wrapperClassName="w-28"
        />
        <Button
          onClick={handleDownload}
          loading={exporting}
          icon={<Download size={14} aria-hidden="true" />}
          size="sm"
          className="ml-auto"
        >
          {exporting ? 'Exporting…' : 'Download'}
        </Button>
      </div>
    </Card>
  );
}

export default function ExportCenter() {
  const modules = useMemo(() => MODULES, []);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Export Center"
        description="Download school data in CSV, Excel, or PDF format"
        bordered={false}
        size="lg"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <ExportCard key={mod.key} module={mod} />
        ))}
      </div>
    </div>
  );
}
