import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Select,
  SkeletonTable,
} from '../../../components/ui';
import { formatDateTime } from '../../../utils/dateFormatter';
import { PLAN_STATUS_OPTIONS } from './CreateSchoolForm';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function SchoolRegistryTable({
  rows,
  loading,
  error,
  onRefresh,
  onUpdateDraft,
  onSave,
  onProvision,
  rowSaving,
  provisioning,
  dirtySchoolIds = [],
}) {
  const { t } = useTranslation();

  const planOptions = [
    { value: 'starter', label: t('plans.starter') },
    { value: 'growth', label: t('plans.growth') },
    { value: 'enterprise', label: t('plans.enterprise') },
  ];

  const isDirty = (schoolId) => dirtySchoolIds.includes(schoolId);

  return (
    <Card padding="md" radius="lg">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-fg">
            {t('pages.schoolRegistry')}
          </h2>
          <p className="mt-1 text-xs text-fg-muted">
            {t('pages.schoolRegistryDescription')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          {t('common.refresh')}
        </Button>
      </div>

      {loading ? (
        <SkeletonTable rows={4} columns={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={onRefresh} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t('pages.noSchoolsFound')}
          description={t('pages.schoolsEmptyDescription')}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-fg-muted">
                <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.school1')}</th>
                <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.admin2')}</th>
                <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.plan')}</th>
                <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.status2')}</th>
                <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.provisioning')}</th>
                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wide">{t('pages.actions1')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((school) => (
                <tr
                  key={school.id}
                  className="border-b border-divider align-top last:border-0"
                >
                  <td className="py-4 pr-4">
                    <div className="font-medium text-fg">{school.name}</div>
                    <div className="mt-1 text-xs uppercase tracking-wider text-fg-faint">
                      {school.code}
                    </div>
                    <div className="mt-2 text-xs text-fg-muted">
                      {t('pages.staffCount', { count: school.counts?.staff || 0 })}
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="font-medium text-fg">
                      {school.admin?.name || t('pages.notProvisioned')}
                    </div>
                    <div className="mt-1 text-xs text-fg-muted">
                      {school.admin?.email || school.contactEmail || t('pages.noAdminEmail')}
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="space-y-2">
                      <Select
                        size="sm"
                        aria-label={t('pages.plan')}
                        value={school.draftPlan}
                        onChange={(e) => onUpdateDraft(school.id, 'draftPlan', e.target.value)}
                        options={planOptions}
                      />
                      <Select
                        size="sm"
                        aria-label={t('pages.planStatus')}
                        value={school.draftPlanStatus}
                        onChange={(e) => onUpdateDraft(school.id, 'draftPlanStatus', e.target.value)}
                        options={PLAN_STATUS_OPTIONS}
                      />
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <Select
                      size="sm"
                      aria-label={t('pages.status2')}
                      value={school.draftStatus}
                      onChange={(e) => onUpdateDraft(school.id, 'draftStatus', e.target.value)}
                      options={STATUS_OPTIONS}
                    />
                  </td>
                  <td className="py-4 pr-4">
                    <div className="font-medium capitalize text-fg">
                      {school.provisioning?.status || t('pages.pendingProvisioning')}
                    </div>
                    <div className="mt-1 text-xs text-fg-muted">
                      {school.provisioning?.lastProvisionedAt
                        ? formatDateTime(school.provisioning.lastProvisionedAt)
                        : t('pages.notProvisionedYet')}
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant={isDirty(school.id) ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => onSave(school)}
                        loading={rowSaving[school.id]}
                      >
                        {t('common.save')}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onProvision(school)}
                        loading={provisioning[school.id]}
                      >
                        {t('pages.provision')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
