import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { TrendingUp, Users, Wallet } from 'lucide-react';
import { useChartTheme, CHART_COLORS } from '../../utils/chartTheme';
import { getDateLocale } from '../../i18n/index';
import { useTranslation } from 'react-i18next';


const compactNumber = new Intl.NumberFormat(getDateLocale(), {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const currencyFormatter = new Intl.NumberFormat(getDateLocale(), {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat(getDateLocale(), {
  maximumFractionDigits: 0,
});

function FeeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-zinc-950 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm">
      <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
        {currencyFormatter.format(payload[0].value || 0)}
      </p>
    </div>
  );
}

function ChartSection({ attendanceRows = [], feeCollectionData = [], loading = false, paymentsLoaded = true }) {
  const chart = useChartTheme();
  const { t } = useTranslation();
  const hasAttendanceData = attendanceRows.some((row) => Number.isFinite(row.value));
  const hasFeeData = feeCollectionData.some((row) => row.collected > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <Users size={16} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('components.attendanceSnapshot')}</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-500">Live rates from today&apos;s marked records</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {loading && !hasAttendanceData ? (
            <p className="text-sm text-gray-500 dark:text-zinc-500">{t('components.loadingAttendanceData')}</p>
          ) : hasAttendanceData ? (
            attendanceRows.map((row) => (
              <div key={row.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{row.label}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">{row.subtext}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                    {Number.isFinite(row.value) ? percentFormatter.format(row.value) : '0'}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gray-500 dark:bg-zinc-400 transition-[width] duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, row.value))}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('components.noAttendanceRecordedYet')}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">{t('components.thisSectionUpdatesOnceStaffOrClassAttendanceIsMarked')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <TrendingUp size={16} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('components.feeCollection')}</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-500">{t('components.actualReceiptsOverTheLast6Months')}</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {loading && !hasFeeData ? (
            <p className="text-sm text-gray-500 dark:text-zinc-500">{t('components.loadingPaymentData')}</p>
          ) : hasFeeData ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={feeCollectionData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: chart.tick, fontSize: 11 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: chart.tick, fontSize: 11 }}
                      tickFormatter={(value) => compactNumber.format(value)}
                    />
                    <Tooltip content={<FeeTooltip />} />
                    <Bar dataKey="collected" name="Collected" fill={CHART_COLORS.neutral} radius={[4, 4, 0, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                <Wallet size={14} />
                <span>Paid amounts only. Refunded or failed records are excluded when status is available.</span>
              </div>
            </>
          ) : paymentsLoaded ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('components.noFeePaymentsRecordedYet')}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">{t('components.monthlyCollectionTrendsWillAppearOnceReceiptsArePosted')}</p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('components.paymentDataUnavailable')}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">{t('components.theFeeCollectionChartWillReturnOnceThePaymentsApiResponds')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ChartSection);
