import { useState } from 'react';
import {
  Activity,
  BookOpen,
  Building2,
  Flag,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Chip, MinimalTabs } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import SchoolsPanel from './SchoolsPanel';
import SchoolHealthPanel from './SchoolHealthPanel';
import JobsDashboardPanel from './JobsDashboardPanel';
import FeatureFlagsPanel from './FeatureFlagsPanel';
import GrowthAnalyticsPanel from './GrowthAnalyticsPanel';
import ChangelogPanel from './ChangelogPanel';

const TABS = [
  { key: 'schools', title: 'Schools', icon: <Building2 size={14} aria-hidden="true" /> },
  { key: 'health', title: 'Health', icon: <Activity size={14} aria-hidden="true" /> },
  { key: 'jobs', title: 'Jobs', icon: <Wrench size={14} aria-hidden="true" /> },
  { key: 'flags', title: 'Flags', icon: <Flag size={14} aria-hidden="true" /> },
  { key: 'growth', title: 'Growth', icon: <TrendingUp size={14} aria-hidden="true" /> },
  { key: 'changelog', title: 'Changelog', icon: <BookOpen size={14} aria-hidden="true" /> },
];

export default function SuperAdminDashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('schools');

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
      case 'schools':
      default:
        return <SchoolsPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-2 text-fg">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-divider bg-surface p-6 shadow-sm md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <Chip color="primary" size="sm" startContent={<ShieldCheck size={12} aria-hidden="true" />}>
              Super Admin
            </Chip>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg md:text-3xl">
              {t('pages.schoolOnboardingAndTenantControl')}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-fg-muted">
              Provision schools, assign plans, and re-run setup from one place instead of handling each launch manually.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-divider bg-surface-2 px-4 py-3 text-right">
              <div className="text-xs uppercase tracking-wider text-fg-faint">
                {t('pages.signedInAs1')}
              </div>
              <div className="mt-1 text-sm font-medium text-fg">
                {user?.name || 'Super Admin'}
              </div>
              <div className="text-xs text-fg-muted">{user?.email}</div>
            </div>
            <Button variant="outline" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>

        <div className="mb-6 overflow-x-auto">
          <MinimalTabs
            tabs={TABS}
            activeKey={activeTab}
            onChange={setActiveTab}
            variant="pills"
          />
        </div>

        {renderPanel()}
      </div>
    </div>
  );
}
