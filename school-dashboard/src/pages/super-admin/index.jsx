import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BookOpen,
  Building2,
  Flag,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Wrench,
} from 'lucide-react';
import { Input, Select, SelectItem } from '@heroui/react';
import { superAdminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SchoolHealthPanel from './SchoolHealthPanel';
import JobsDashboardPanel from './JobsDashboardPanel';
import FeatureFlagsPanel from './FeatureFlagsPanel';
import GrowthAnalyticsPanel from './GrowthAnalyticsPanel';
import ChangelogPanel from './ChangelogPanel';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../utils/dateFormatter';

const TABS = [
  { key: 'schools', label: 'Schools', icon: Building2 },
  { key: 'health', label: 'Health', icon: Activity },
  { key: 'jobs', label: 'Jobs', icon: Wrench },
  { key: 'flags', label: 'Flags', icon: Flag },
  { key: 'growth', label: 'Growth', icon: TrendingUp },
  { key: 'changelog', label: 'Changelog', icon: BookOpen },
];

const PLAN_OPTIONS = [
  { value: 'starter', label: 'Starter' },
  { value: 'growth', label: 'Growth' },
  { value: 'enterprise', label: 'Enterprise' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const PLAN_STATUS_OPTIONS = [
  { value: 'trialing', label: 'Trialing' },
  { value: 'active', label: 'Active' },
  { value: 'past_due', label: 'Past due' },
  { value: 'cancelled', label: 'Cancelled' },
];

const INITIAL_FORM = {
  schoolName: '',
  schoolCode: '',
  contactEmail: '',
  contactPhone: '',
  plan: 'starter',
  planStatus: 'trialing',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
  frontendUrl: '',
  backendUrl: '',
};

function SummaryCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
        <Icon size={20} />
      </div>
      <div className="text-sm text-slate-500 dark:text-zinc-400">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-zinc-100">{value}</div>
    </div>
  );
}

function SelectField({ value, onChange, options, label }) {
  return (
    <Select
      size="sm"
      variant="bordered"
      radius="lg"
      label={label}
      selectedKeys={value ? new Set([value]) : new Set()}
      onSelectionChange={(keys) => onChange(Array.from(keys)[0] || '')}
    >
      {options.map((option) => (
        <SelectItem key={option.value} textValue={option.label}>
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
}

function SchoolsPanel({ overview, loadData, loading, tableRows, updateSchoolDraft, handleSaveSchool, handleProvisionSchool, rowSaving, provisioning, form, updateForm, handleCreateSchool, submitting }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <SummaryCard icon={Building2} label={t('pages.totalSchools')} value={overview.totalSchools} accent="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" />
        <SummaryCard icon={Sparkles} label={t('pages.activeSchools')} value={overview.activeSchools} accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" />
        <SummaryCard icon={UserPlus} label={t('pages.trialsRunning')} value={overview.trialingSchools} accent="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" />
        <SummaryCard icon={RefreshCcw} label={t('pages.attentionNeeded')} value={overview.attentionNeeded} accent="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.7fr]">
        <form
          onSubmit={handleCreateSchool}
          className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90"
        >
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-zinc-100">{t('pages.onboardANewSchool')}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              This creates the school, provisions its settings, and sets up an initial admin account.
            </p>
          </div>

          <div className="grid gap-4">
            <Input
              label={t('pages.schoolName2')}
              value={form.schoolName}
              onValueChange={(value) => updateForm('schoolName', value)}
              isRequired
              variant="bordered"
              size="sm"
              radius="lg"
            />
            <Input
              label={t('pages.schoolCodeOptional')}
              value={form.schoolCode}
              onValueChange={(value) => updateForm('schoolCode', value)}
              variant="bordered"
              size="sm"
              radius="lg"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label={t('pages.contactEmail')}
                value={form.contactEmail}
                onValueChange={(value) => updateForm('contactEmail', value)}
                variant="bordered"
                size="sm"
                radius="lg"
              />
              <Input
                label={t('pages.contactPhone')}
                value={form.contactPhone}
                onValueChange={(value) => updateForm('contactPhone', value)}
                variant="bordered"
                size="sm"
                radius="lg"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField label={t('pages.plan')} value={form.plan} onChange={(value) => updateForm('plan', value)} options={PLAN_OPTIONS} />
              <SelectField label={t('pages.planStatus')} value={form.planStatus} onChange={(value) => updateForm('planStatus', value)} options={PLAN_STATUS_OPTIONS} />
            </div>
            <Input
              label={t('pages.adminFullName')}
              value={form.adminName}
              onValueChange={(value) => updateForm('adminName', value)}
              isRequired
              variant="bordered"
              size="sm"
              radius="lg"
            />
            <Input
              label={t('pages.adminEmail')}
              value={form.adminEmail}
              onValueChange={(value) => updateForm('adminEmail', value)}
              type="email"
              isRequired
              variant="bordered"
              size="sm"
              radius="lg"
            />
            <Input
              label={t('pages.adminPasswordOptional')}
              value={form.adminPassword}
              onValueChange={(value) => updateForm('adminPassword', value)}
              type="password"
              minLength={8}
              maxLength={50}
              variant="bordered"
              size="sm"
              radius="lg"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label={t('pages.frontendUrl')}
                value={form.frontendUrl}
                onValueChange={(value) => updateForm('frontendUrl', value)}
                variant="bordered"
                size="sm"
                radius="lg"
              />
              <Input
                label={t('pages.backendUrl')}
                value={form.backendUrl}
                onValueChange={(value) => updateForm('backendUrl', value)}
                variant="bordered"
                size="sm"
                radius="lg"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {submitting ? 'Provisioning school...' : 'Create school'}
          </button>
        </form>

        <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-zinc-100">{t('pages.schoolRegistry')}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Manage plan state and re-run provisioning without touching the database manually.</p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
              Loading school registry...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
                    <th className="pb-3 font-medium">{t('pages.school1')}</th>
                    <th className="pb-3 font-medium">{t('pages.admin2')}</th>
                    <th className="pb-3 font-medium">{t('pages.plan')}</th>
                    <th className="pb-3 font-medium">{t('pages.status2')}</th>
                    <th className="pb-3 font-medium">{t('pages.provisioning')}</th>
                    <th className="pb-3 font-medium text-right">{t('pages.actions1')}</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((school) => (
                    <tr key={school.id} className="border-b border-slate-100 align-top dark:border-zinc-800">
                      <td className="py-4 pr-4">
                        <div className="font-medium text-slate-900 dark:text-zinc-100">{school.name}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">{school.code}</div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-zinc-400">{school.counts?.staff || 0} staff</div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="font-medium text-slate-800 dark:text-zinc-200">{school.admin?.name || 'Not provisioned'}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{school.admin?.email || school.contactEmail || 'No admin email'}</div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="space-y-2">
                          <SelectField
                            label={t('pages.plan')}
                            value={school.draftPlan}
                            onChange={(value) => updateSchoolDraft(school.id, 'draftPlan', value)}
                            options={PLAN_OPTIONS}
                          />
                          <SelectField
                            label={t('pages.planStatus')}
                            value={school.draftPlanStatus}
                            onChange={(value) => updateSchoolDraft(school.id, 'draftPlanStatus', value)}
                            options={PLAN_STATUS_OPTIONS}
                          />
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <SelectField
                          label={t('pages.status2')}
                          value={school.draftStatus}
                          onChange={(value) => updateSchoolDraft(school.id, 'draftStatus', value)}
                          options={STATUS_OPTIONS}
                        />
                      </td>
                      <td className="py-4 pr-4">
                        <div className="font-medium capitalize text-slate-800 dark:text-zinc-200">{school.provisioning?.status || 'pending'}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                          {school.provisioning?.lastProvisionedAt
                            ? formatDateTime(school.provisioning.lastProvisionedAt)
                            : 'Not provisioned yet'}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveSchool(school)}
                            disabled={rowSaving[school.id]}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
                          >
                            {rowSaving[school.id] ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProvisionSchool(school)}
                            disabled={provisioning[school.id]}
                            className="rounded-2xl bg-sky-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {provisioning[school.id] ? 'Provisioning...' : 'Provision'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function SuperAdminDashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('schools');
  const [overview, setOverview] = useState({
    totalSchools: 0,
    activeSchools: 0,
    trialingSchools: 0,
    attentionNeeded: 0,
  });
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [rowSaving, setRowSaving] = useState({});
  const [provisioning, setProvisioning] = useState({});

  const tableRows = useMemo(
    () =>
      schools.map((school) => ({
        ...school,
        draftPlan: school.draftPlan || school.plan || 'starter',
        draftStatus: school.draftStatus || school.status || 'active',
        draftPlanStatus: school.draftPlanStatus || school.planStatus || 'trialing',
      })),
    [schools]
  );

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [overviewData, schoolData] = await Promise.all([
        superAdminApi.getOverview(),
        superAdminApi.getSchools(),
      ]);

      setOverview(overviewData);
      setSchools(schoolData);
    } catch (err) {
      setError(err.message || 'Failed to load super admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateSchoolDraft = (schoolId, field, value) => {
    setSchools((current) =>
      current.map((school) =>
        school.id === schoolId ? { ...school, [field]: value } : school
      )
    );
  };

  const handleCreateSchool = async (event) => {
    event.preventDefault();
    if (form.adminPassword && form.adminPassword.length < 8) {
      setError('Admin password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await superAdminApi.createSchool({
        ...form,
        schoolCode: form.schoolCode || null,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        adminPassword: form.adminPassword || null,
        frontendUrl: form.frontendUrl || null,
        backendUrl: form.backendUrl || null,
      });

      setForm(INITIAL_FORM);
      // [AUDIT-529] Show temp password in a one-time alert instead of persistent DOM
      if (response.temporaryPassword) {
        // Use window.prompt so user can copy, then clear from memory
        window.alert(
          `School created successfully.\n\nTemporary admin password (copy now — it will not be shown again):\n\n${response.temporaryPassword}`
        );
        setMessage('School created and provisioned successfully.');
      } else {
        setMessage('School created and provisioned successfully.');
      }
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create school');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSchool = async (school) => {
    setRowSaving((current) => ({ ...current, [school.id]: true }));
    setError('');
    setMessage('');

    try {
      const response = await superAdminApi.updateSchool(school.id, {
        plan: school.draftPlan,
        status: school.draftStatus,
        planStatus: school.draftPlanStatus,
      });

      setSchools((current) =>
        current.map((item) =>
          item.id === school.id
            ? {
                ...item,
                ...response.school,
                draftPlan: response.school.plan,
                draftStatus: response.school.status,
                draftPlanStatus: response.school.planStatus,
              }
            : item
        )
      );
      setMessage(`Updated ${response.school.name}.`);
      const overviewData = await superAdminApi.getOverview();
      setOverview(overviewData);
    } catch (err) {
      setError(err.message || 'Failed to update school');
    } finally {
      setRowSaving((current) => ({ ...current, [school.id]: false }));
    }
  };

  const handleProvisionSchool = async (school) => {
    setProvisioning((current) => ({ ...current, [school.id]: true }));
    setError('');
    setMessage('');

    try {
      const response = await superAdminApi.provisionSchool(school.id, {
        adminName: school.admin?.name || `${school.name} Admin`,
        adminEmail: school.admin?.email || school.contactEmail,
      });

      setMessage(
        response.temporaryPassword
          ? `Provisioned ${school.name}. Temporary admin password: ${response.temporaryPassword}`
          : `Provisioned ${school.name}.`
      );
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to provision school');
    } finally {
      setProvisioning((current) => ({ ...current, [school.id]: false }));
    }
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 'health':
        return <SchoolHealthPanel />;
      case 'jobs':
        return <JobsDashboardPanel />;
      case 'flags':
        return <FeatureFlagsPanel />;
      case 'growth':
        return <GrowthAnalyticsPanel />;
      case 'changelog':
        return <ChangelogPanel />;
      default:
        return (
          <SchoolsPanel
            overview={overview}
            loadData={loadData}
            loading={loading}
            tableRows={tableRows}
            updateSchoolDraft={updateSchoolDraft}
            handleSaveSchool={handleSaveSchool}
            handleProvisionSchool={handleProvisionSchool}
            rowSaving={rowSaving}
            provisioning={provisioning}
            form={form}
            updateForm={updateForm}
            handleCreateSchool={handleCreateSchool}
            submitting={submitting}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_48%,_#f8fafc_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.08),_transparent_28%),linear-gradient(180deg,_#09090b_0%,_#18181b_48%,_#09090b_100%)] dark:text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-8 flex flex-col gap-4 rounded-[32px] border border-white/70 bg-slate-950 px-6 py-6 text-white shadow-[0_30px_120px_rgba(15,23,42,0.22)] dark:border-zinc-800 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-sky-100">
              <ShieldCheck size={14} />
              Super Admin
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t('pages.schoolOnboardingAndTenantControl')}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300 md:text-base">
              Provision schools, assign plans, and re-run setup from one place instead of handling each launch manually.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{t('pages.signedInAs1')}</div>
              <div className="mt-1 text-sm font-medium">{user?.name || 'Super Admin'}</div>
              <div className="text-xs text-slate-400">{user?.email}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="mb-6 flex flex-wrap gap-1 rounded-2xl border border-white/70 bg-white/80 p-1.5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          {TABS.map(({ key, label, icon: TabIcon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === key
                  ? 'bg-slate-950 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <TabIcon size={14} />
              {label}
            </button>
          ))}
        </div>

        {message && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            {message}
          </div>
        )}

        {error && activeTab === 'schools' && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        {renderPanel()}
      </div>
    </div>
  );
}
