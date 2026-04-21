import { memo, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { TrendingUp, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard from "../../components/ui/ChartCard";
import { useChartTheme, CHART_COLORS } from "../../utils/chartTheme";
import { getCurrencyFormatter } from "./dashboardHelpers";
import { getDateLocale } from "../../i18n/index";

const compactNumber = new Intl.NumberFormat(getDateLocale(), {
  notation: "compact",
  maximumFractionDigits: 1,
});

function FeeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-950 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm">
      <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 tabular-nums">
        {getCurrencyFormatter().format(payload[0].value || 0)}
      </p>
    </div>
  );
}

FeeTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

function FeeCollectionChart({
  data = [],
  isLoading = false,
  paymentsLoaded = true,
}) {
  const chart = useChartTheme();
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const hasData = data.some((row) => row.collected > 0);
  const isEmpty = !isLoading && !hasData;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasData, isLoading]);

  const emptyTitle = paymentsLoaded
    ? t("components.noFeePaymentsRecordedYet")
    : t("components.paymentDataUnavailable");
  const emptyDescription = paymentsLoaded
    ? t("components.monthlyCollectionTrendsWillAppearOnceReceiptsArePosted")
    : t("components.theFeeCollectionChartWillReturnOnceThePaymentsApiResponds");

  return (
    <ChartCard
      title={
        <span className="inline-flex items-center gap-2">
          <TrendingUp
            size={14}
            className="text-gray-500 dark:text-zinc-400"
            aria-hidden="true"
          />
          {t("components.feeCollection")}
        </span>
      }
      description={t("components.actualReceiptsOverTheLast6Months")}
      height={220}
      isLoading={isLoading && !hasData}
      isEmpty={isEmpty}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      footer={
        hasData ? (
          <span className="inline-flex items-center gap-1.5">
            <Wallet size={12} aria-hidden="true" />
            Paid amounts only. Refunded or failed records are excluded when
            status is available.
          </span>
        ) : null
      }
    >
      <div ref={containerRef} className="h-full w-full">
        {width > 0 ? (
          <BarChart
            data={data}
            width={width}
            height={200}
            margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={chart.grid}
            />
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
            <Tooltip content={<FeeTooltip />} cursor={{ fill: chart.grid }} />
            <Bar
              dataKey="collected"
              name="Collected"
              fill={CHART_COLORS.neutral}
              radius={[4, 4, 0, 0]}
              barSize={22}
            />
          </BarChart>
        ) : null}
      </div>
    </ChartCard>
  );
}

FeeCollectionChart.propTypes = {
  data: PropTypes.array,
  isLoading: PropTypes.bool,
  paymentsLoaded: PropTypes.bool,
};

export default memo(FeeCollectionChart);
