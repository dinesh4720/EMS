import { useId, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Button, Chip, PageShell } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import SchoolsPanel from './SchoolsPanel';
import SchoolHealthPanel from './SchoolHealthPanel';
import JobsDashboardPanel from './JobsDashboardPanel';
import FeatureFlagsPanel from './FeatureFlagsPanel';
import GrowthAnalyticsPanel from './GrowthAnalyticsPanel';
import ChangelogPanel from './ChangelogPanel';

const TAB_KEYS = ['schools', 'health', 'jobs', 'flags', 'growth', 'changelog'];

export default function SuperAdminDashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const baseId = useId();

  const activeTab = useMemo(() => {
    const raw = searchParams.get('tab');
    return TAB_KEYS.includes(raw) ? raw : 'schools';
  }, [searchParams]);

  const setActiveTab = (key) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (key === 'schools') {
          next.delete('tab');
        } else {
          next.set('tab', key);
        }
        return next;
      },
      { replace: true }
    );
  };

  const tabs = useMemo(
    () => [
      { key: 'schools', title: t('pages.schools') || 'Schools', icon: <Building2 size={14} aria-hidden="true" /> },
      { key: 'health', title: t('pages.health') || 'Health', icon: <Activity size={14} aria-hidden="true" /> },
      { key: 'jobs', title: t('pages.jobs') || 'Jobs', icon: <Wrench size={14} aria-hidden="true" /> },
      { key: 'flags', title: t('pages.flags') || 'Flags', icon: <Flag size={14} aria-hidden="true" /> },
      { key: 'growth', title: t('pages.growth') || 'Growth', icon: <TrendingUp size={14} aria-hidden="true" /> },
      { key: 'changelog', title: t('pages.changelog') || 'Changelog', icon: <BookOpen size={14} aria-hidden="true" /> },
    ],
    [t]
  );

  const panelId = (key) => `${baseId}-tabpanel-${key}`;
  const tabId = (key) => `${baseId}-tab-${key}`;

  const renderPanel = () => {
    const panels = {
      health: <SchoolHealthPanel />,
      jobs: <JobsDashboardPanel />,
      flags: <FeatureFlagsPanel />,
      growth: <GrowthAnalyticsPanel />,
      changelog: <ChangelogPanel />,
      schools: <SchoolsPanel />,
    };

    return (
      <div
        id={panelId(activeTab)}
        role="tabpanel"
        aria-labelledby={tabId(activeTab)}
        className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 rounded-md"
        tabIndex={0}
      >
        {panels[activeTab]}
      </div>
    );
  };

  const metaCard = (
    <div className="rounded-lg border border-divider bg-surface-2 px-4 py-3 text-right">
      <div className="text-xs uppercase tracking-wider text-fg-faint">
        {t('pages.signedInAs1')}
      </div>
      <div className="mt-1 text-sm font-medium text-fg">
        {user?.name || t('pages.superAdmin')}
      </div>
      <div className="text-xs text-fg-muted">{user?.email}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-2 text-fg">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <PageShell
          title={
            <span className="flex items-center gap-2">
              <Chip
                color="primary"
                size="sm"
                startContent={<ShieldCheck size={12} aria-hidden="true" />}
              >
                {t('pages.superAdmin')}
              </Chip>
              {t('pages.schoolOnboardingAndTenantControl')}
            </span>
          }
          description={t('pages.superAdminSubtitle')}
          actions={
            <div className="flex items-center gap-3">
              {metaCard}
              <Button variant="outline" onClick={logout}>
                {t('pages.signOut')}
              </Button>
            </div>
          }
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabsVariant="pills"
          tabsBaseId={baseId}
          bodyPadding="md"
          className="min-h-[calc(100vh-96px)]"
        >
          {renderPanel()}
        </PageShell>
      </div>
    </div>
  );
}
