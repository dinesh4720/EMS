import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Select } from '../../../components/ui';

const PLAN_STATUS_OPTIONS = [
  { value: 'trialing', label: 'Trialing' },
  { value: 'active', label: 'Active' },
  { value: 'past_due', label: 'Past due' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function CreateSchoolForm({ form, updateForm, onSubmit, submitting, disabled }) {
  const { t } = useTranslation();

  const planOptions = [
    { value: 'starter', label: t('plans.starter') },
    { value: 'growth', label: t('plans.growth') },
    { value: 'enterprise', label: t('plans.enterprise') },
  ];

  return (
    <Card padding="md" radius="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-fg">
            {t('pages.onboardANewSchool')}
          </h2>
          <p className="mt-1 text-xs text-fg-muted">
            {t('pages.createSchoolDescription')}
          </p>
        </div>

        <Input
          label={t('pages.schoolName2')}
          placeholder={t('pages.schoolName2')}
          required
          value={form.schoolName}
          onChange={(e) => updateForm('schoolName', e.target.value)}
          disabled={disabled}
        />
        <Input
          label={t('pages.schoolCodeOptional')}
          placeholder={t('pages.schoolCodeOptional')}
          value={form.schoolCode}
          onChange={(e) => updateForm('schoolCode', e.target.value)}
          disabled={disabled}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={t('pages.contactEmail')}
            placeholder={t('pages.contactEmail')}
            type="email"
            value={form.contactEmail}
            onChange={(e) => updateForm('contactEmail', e.target.value)}
            disabled={disabled}
          />
          <Input
            label={t('pages.contactPhone')}
            placeholder={t('pages.contactPhone')}
            value={form.contactPhone}
            onChange={(e) => updateForm('contactPhone', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label={t('pages.plan')}
            value={form.plan}
            onChange={(e) => updateForm('plan', e.target.value)}
            options={planOptions}
            disabled={disabled}
          />
          <Select
            label={t('pages.planStatus')}
            value={form.planStatus}
            onChange={(e) => updateForm('planStatus', e.target.value)}
            options={PLAN_STATUS_OPTIONS}
            disabled={disabled}
          />
        </div>
        <Input
          label={t('pages.adminFullName')}
          placeholder={t('pages.adminFullName')}
          required
          value={form.adminName}
          onChange={(e) => updateForm('adminName', e.target.value)}
          disabled={disabled}
        />
        <Input
          label={t('pages.adminEmail')}
          placeholder={t('pages.adminEmail')}
          type="email"
          required
          value={form.adminEmail}
          onChange={(e) => updateForm('adminEmail', e.target.value)}
          disabled={disabled}
        />
        <Input
          label={t('pages.adminPasswordOptional')}
          placeholder={t('pages.adminPasswordOptional')}
          type="password"
          minLength={8}
          maxLength={50}
          value={form.adminPassword}
          onChange={(e) => updateForm('adminPassword', e.target.value)}
          disabled={disabled}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={t('pages.frontendUrl')}
            placeholder={t('pages.frontendUrl')}
            value={form.frontendUrl}
            onChange={(e) => updateForm('frontendUrl', e.target.value)}
            disabled={disabled}
          />
          <Input
            label={t('pages.backendUrl')}
            placeholder={t('pages.backendUrl')}
            value={form.backendUrl}
            onChange={(e) => updateForm('backendUrl', e.target.value)}
            disabled={disabled}
          />
        </div>

        <Button type="submit" variant="primary" fullWidth loading={submitting} disabled={disabled}>
          {submitting ? t('pages.provisioningSchool') : t('pages.createSchool')}
        </Button>
      </form>
    </Card>
  );
}

export { PLAN_STATUS_OPTIONS };
