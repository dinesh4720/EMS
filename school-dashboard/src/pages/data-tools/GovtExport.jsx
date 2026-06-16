import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import { API_URL } from '../../config/api';
import { clearStoredUser, getAuthHeaders } from '../../utils/authSession';

const EXPORT_TYPES = [
  { key: 'udise', title: 'UDISE+ Enrollment', titleKey: 'udise', badge: 'UDISE+', badgeColor: 'info', hasClassId: false },
  { key: 'cbse', title: 'CBSE Affiliation Data', titleKey: 'cbse', badge: 'CBSE', badgeColor: 'success', hasClassId: true },
  { key: 'icse', title: 'ICSE Portal Format', titleKey: 'icse', badge: 'ICSE', badgeColor: 'warning', hasClassId: true },
  { key: 'state-board', title: 'State Board Format', titleKey: 'stateBoard', badge: 'State Board', badgeColor: 'primary', hasClassId: true },
  { key: 'annual-report', title: 'Annual Report Summary', titleKey: 'annualReport', badge: 'Annual', badgeColor: 'neutral', hasClassId: false },
  { key: 'compliance-checklist', title: 'Compliance Checklist', titleKey: 'complianceChecklist', badge: 'Checklist', badgeColor: 'neutral', hasClassId: false },
];

const FORMATS = [
  { id: 'csv', label: 'CSV' },
  { id: 'excel', label: 'Excel' },
  { id: 'pdf', label: 'PDF' },
];

export default function GovtExport() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState(() =>
    Object.fromEntries(EXPORT_TYPES.map((type) => [type.key, { academicYear: '', classId: '' }]))
  );
  const [exporting, setExporting] = useState(null);

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

      const response = await fetch(`${API_URL}/export/govt/${type}?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.status === 401) {
        clearStoredUser();
        throw new Error(t('dataTools.sessionExpired', 'Session expired. Please log in again.'));
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: t('dataTools.govt.exportFailed', 'Export failed') }));
        throw new Error(err.error || t('dataTools.govt.exportFailed', 'Export failed'));
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || `${type}_export.${format}`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(t('dataTools.govt.exportDownloaded', 'Export downloaded'));
    } catch (err) {
      toast.error(err.message || t('dataTools.govt.exportFailed', 'Export failed'));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title={t('dataTools.govt.title', 'Government Portal Exports')}
        description={t('dataTools.govt.description', 'Export data in formats required by government portals and regulatory bodies.')}
        bordered={false}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {EXPORT_TYPES.map((type) => (
          <Card key={type.key} radius="lg" padding="md" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-fg">{t('dataTools.govt.types.' + type.titleKey, type.title)}</h2>
              <Badge color={type.badgeColor}>{type.badge}</Badge>
            </div>

            <div className="space-y-3">
              <Input
                label={t('dataTools.govt.academicYear', 'Academic Year')}
                size="sm"
                placeholder={t('dataTools.govt.academicYearPlaceholder', 'e.g. 2025-26')}
                value={filters[type.key].academicYear}
                onChange={(e) => updateFilter(type.key, 'academicYear', e.target.value)}
              />

              {type.hasClassId && (
                <Input
                  label={t('dataTools.govt.classId', 'Class ID')}
                  size="sm"
                  placeholder={t('dataTools.govt.classIdPlaceholder', 'Class ObjectId')}
                  value={filters[type.key].classId}
                  onChange={(e) => updateFilter(type.key, 'classId', e.target.value)}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {FORMATS.map((fmt) => {
                const key = `${type.key}-${fmt.id}`;
                return (
                  <Button
                    key={fmt.id}
                    variant="outline"
                    size="sm"
                    icon={<Download size={14} />}
                    loading={exporting === key}
                    disabled={exporting !== null && exporting !== key}
                    onClick={() => handleExport(type.key, fmt.id)}
                  >
                    {fmt.label}
                  </Button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
