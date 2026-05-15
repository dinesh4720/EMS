import { useEffect, useMemo, useState } from 'react';
import { Building2, RefreshCcw, Sparkles, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, StatCard } from '../../components/ui';
import { superAdminApi } from '../../services/api';
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
      if (response.temporaryPassword) {
        window.alert(
          `School created successfully.\n\nTemporary admin password (copy now — it will not be shown again):\n\n${response.temporaryPassword}`
        );
      }
      setMessage('School created and provisioned successfully.');
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
      {error && (
        <Alert variant="danger" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.7fr]">
        <CreateSchoolForm
          form={form}
          updateForm={updateForm}
          onSubmit={handleCreateSchool}
          submitting={submitting}
        />
        <SchoolRegistryTable
          rows={tableRows}
          loading={loading}
          error={error && tableRows.length === 0 ? error : null}
          onRefresh={loadData}
          onUpdateDraft={updateSchoolDraft}
          onSave={handleSaveSchool}
          onProvision={handleProvisionSchool}
          rowSaving={rowSaving}
          provisioning={provisioning}
        />
      </div>
    </div>
  );
}
