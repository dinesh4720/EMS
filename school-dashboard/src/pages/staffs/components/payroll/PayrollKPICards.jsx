import { Wallet, Clock, TrendingUp, Users } from "lucide-react";
import { useTranslation } from 'react-i18next';

/**
 * REVAMP-17: KPI strip styled like detail-pane__metrics. The four
 * tiles share a single 1px-divider grid so the strip reads as one
 * panel instead of four loose cards. Money values use mono tnum.
 */
export default function PayrollKPICards({ dashboardData, formatCurrency }) {
  const { t } = useTranslation();

  if (!dashboardData) return null;

  const tiles = [
    {
      key: 'recorded',
      icon: Wallet,
      tone: 'ok',
      label: t('pages.totalRecorded'),
      value: formatCurrency(dashboardData.totalPayout),
      sub: `${dashboardData.paidCount || 0} records logged`,
    },
    {
      key: 'unrecorded',
      icon: Clock,
      tone: 'info',
      label: t('pages.unrecorded'),
      value: formatCurrency(dashboardData.pendingAmount),
      sub: `${dashboardData.pendingCount || 0} records pending`,
    },
    {
      key: 'estimated',
      icon: TrendingUp,
      tone: 'warn',
      label: t('pages.estimated'),
      value: formatCurrency(dashboardData.projectedPayout),
      sub: 'Next month estimate',
    },
    {
      key: 'totalStaff',
      icon: Users,
      tone: 'default',
      label: t('pages.totalStaff'),
      value: String(dashboardData.totalEmployees ?? 0),
      sub: 'Active in payroll',
    },
  ];

  return (
    <div className="payroll-kpi" aria-label="Payroll summary">
      {tiles.map(({ key, icon: Icon, tone, label, value, sub }) => (
        <div className="dp-metric" key={key}>
          <span className="dp-metric__label">
            <Icon
              size={12}
              aria-hidden
              style={{
                color:
                  tone === 'ok'
                    ? 'var(--ok)'
                    : tone === 'warn'
                    ? 'var(--warn)'
                    : tone === 'info'
                    ? 'var(--info)'
                    : 'var(--fg-faint)',
              }}
            />
            {label}
          </span>
          <span className="dp-metric__value mono tnum">{value}</span>
          <span className="dp-metric__sub">{sub}</span>
        </div>
      ))}
    </div>
  );
}
