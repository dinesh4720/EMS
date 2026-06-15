import { useEffect, useMemo, useState } from 'react';
import { Building2, RefreshCcw, Sparkles, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, ConfirmDialog, StatCard } from '../../components/ui';
import { superAdminApi } from '../../services/api';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import CreateSchoolForm from './components/CreateSchoolForm';
import SchoolRegistryTable from './components/SchoolRegistryTable';

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

const INITIAL_OVERVIEW = {
  totalSchools: 0,
  activeSchools: 0,
  trialingSchools: 0,
  attentionNeeded: 0,
};

export default function SchoolsPanel() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState(INITIAL_OVERVIEW);
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [createError, setCreateError] = useState('');
  const [tableError, setTableError] = useState('');
  const [rowSaving, setRowSaving] = useState({});
  const [provisioning, setProvisioning] = useState({});
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

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

  const dirtySchoolIds = useMemo(() => {
    return schools
      .filter(
        (school) =>
          (school.draftPlan !== undefined && school.draftPlan !== school.plan) ||
          (school.draftStatus !== undefined && school.draftStatus !== school.status) ||
          (school.draftPlanStatus !== undefined && school.draftPlanStatus !== school.planStatus)
      )
      .map((school) => school.id);
  }, [schools]);

  const loadData = async () => {
    setLoading(true);
    setCreateError('');
    setTableError('');
    try {
      const [overviewData, schoolData] = await Promise.all([
        superAdminApi.getOverview(),
        superAdminApi.getSchools(),
      ]);
      setOverview(overviewData);
      setSchools(schoolData);
    } catch (err) {
      setTableError(err.message || t('pages.failedToLoadSuperAdminDashboard'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Mount-only; `loadData` is recreated each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setCreateError(t('pages.adminPasswordMinLength'));
      return;
    }
    setSubmitting(true);
    setCreateError('');
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
      if (response.temporaryPassword) {
        setMessage(
          `${t('pages.schoolCreated')} ${t('pages.temporaryPassword', { password: response.temporaryPassword })}`
        );
      } else {
        setMessage(t('pages.schoolCreated'));
      }
      await loadData();
    } catch (err) {
      setCreateError(err.message || t('pages.failedToCreateSchool'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSchool = async (school) => {
    setRowSaving((current) => ({ ...current, [school.id]: true }));
    setCreateError('');
    setTableError('');
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
      setMessage(t('pages.updatedSchool', { name: response.school.name }));
      const overviewData = await superAdminApi.getOverview();
      setOverview(overviewData);
    } catch (err) {
      setTableError(err.message || t('pages.failedToUpdateSchool'));
    } finally {
      setRowSaving((current) => ({ ...current, [school.id]: false }));
    }
  };

  const handleProvisionSchool = (school) => {
    showConfirm({
      title: t('pages.confirmProvisionSchool'),
      message: t('pages.confirmProvisionSchoolMessage', { name: school.name }),
      variant: 'primary',
      confirmText: t('pages.provision'),
      onConfirm: async () => {
        setProvisioning((current) => ({ ...current, [school.id]: true }));
        setCreateError('');
        setTableError('');
        setMessage('');
        try {
          const response = await superAdminApi.provisionSchool(school.id, {
            adminName: school.admin?.name || `${school.name} Admin`,
            adminEmail: school.admin?.email || school.contactEmail,
          });
          setMessage(
            response.temporaryPassword
              ? `${t('pages.provisionedSchool', { name: school.name })} ${t('pages.temporaryPassword', { password: response.temporaryPassword })}`
              : t('pages.provisionedSchool', { name: school.name })
          );
          await loadData();
        } catch (err) {
          setTableError(err.message || t('pages.failedToProvisionSchool'));
        } finally {
          setProvisioning((current) => ({ ...current, [school.id]: false }));
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          color="blue"
          label={t('pages.totalSchools')}
          value={overview.totalSchools}
          isLoading={loading}
        />
        <StatCard
          icon={Sparkles}
          color="emerald"
          label={t('pages.activeSchools')}
          value={overview.activeSchools}
          isLoading={loading}
        />
        <StatCard
          icon={UserPlus}
          color="amber"
          label={t('pages.trialsRunning')}
          value={overview.trialingSchools}
          isLoading={loading}
        />
        <StatCard
          icon={RefreshCcw}
          color="rose"
          label={t('pages.attentionNeeded')}
          value={overview.attentionNeeded}
          isLoading={loading}
        />
      </div>

      {message && (
        <Alert variant="success" onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}
      {createError && (
        <Alert variant="danger" onClose={() => setCreateError('')}>
          {createError}
        </Alert>
      )}
      {tableError && (
        <Alert variant="danger" onClose={() => setTableError('')}>
          {tableError}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.7fr]">
        <CreateSchoolForm
          form={form}
          updateForm={updateForm}
          onSubmit={handleCreateSchool}
          submitting={submitting}
          disabled={loading}
        />
        <SchoolRegistryTable
          rows={tableRows}
          loading={loading}
          error={tableError && tableRows.length === 0 ? tableError : null}
          onRefresh={loadData}
          onUpdateDraft={updateSchoolDraft}
          onSave={handleSaveSchool}
          onProvision={handleProvisionSchool}
          rowSaving={rowSaving}
          provisioning={provisioning}
          dirtySchoolIds={dirtySchoolIds}
        />
      </div>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
