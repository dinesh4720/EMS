/**
 * @deprecated This component uses hardcoded fake data and is not imported
 * by any page. The dashboard now uses ChartSection (components/ChartSection.jsx)
 * with real API data. Safe to remove once all barrel re-exports are cleaned up.
 */
import React from 'react';
import { Card, CardBody, CardHeader } from "@heroui/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useChartTheme, CHART_COLORS } from '../../utils/chartTheme';
import { useTranslation } from 'react-i18next';
import { useChartAnimation } from '../../hooks/useChartAnimation';

const attendanceData = [
    { name: 'Mon', staff: 95, students: 88 },
    { name: 'Tue', staff: 92, students: 90 },
    { name: 'Wed', staff: 96, students: 92 },
    { name: 'Thu', staff: 94, students: 85 },
    { name: 'Fri', staff: 90, students: 82 },
    { name: 'Sat', staff: 85, students: 75 },
];

const financeData = [
    { name: 'Term 1', collected: 45, pending: 10 },
    { name: 'Term 2', collected: 30, pending: 25 },
    { name: 'Term 3', collected: 10, pending: 40 },
];

export default function DashboardCharts() {
  const { t } = useTranslation();
    const chart = useChartTheme();
    const animation = useChartAnimation();
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Attendance Trends */}
            <Card className="shadow-sm border border-default-200 bg-content1/50 backdrop-blur-sm rounded-2xl">
                <CardHeader className="px-5 py-4 border-b border-default-100/50">
                    <div className="flex flex-col">
                        <h3 className="text-base font-medium text-default-900">{t('components.attendanceTrends')}</h3>
                        <p className="text-tiny text-default-500">{t('components.weeklyStudentStaffPresence')}</p>
                    </div>
                </CardHeader>
                <CardBody className="p-4 overflow-hidden">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={attendanceData}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.chart1} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={CHART_COLORS.chart1} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorStaff" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.chart2} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={CHART_COLORS.chart2} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={chart.tooltipStyle}
                                    itemStyle={chart.tooltipItemStyle}
                                />
                                <Area type="monotone" dataKey="students" stroke={CHART_COLORS.chart1} strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" {...animation} />
                                <Area type="monotone" dataKey="staff" stroke={CHART_COLORS.chart2} strokeWidth={3} fillOpacity={1} fill="url(#colorStaff)" {...animation} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardBody>
            </Card>

            {/* Chart 2: Financial Overview */}
            <Card className="shadow-sm border border-default-200 bg-content1/50 backdrop-blur-sm rounded-2xl">
                <CardHeader className="px-5 py-4 border-b border-default-100/50">
                    <div className="flex flex-col">
                        <h3 className="text-base font-medium text-default-900">{t('components.financialOverview')}</h3>
                        <p className="text-tiny text-default-500">{t('components.feeCollectionVsPendingPerTerm')}</p>
                    </div>
                </CardHeader>
                <CardBody className="p-4 overflow-hidden">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financeData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: chart.cursorFill }}
                                    contentStyle={chart.tooltipStyle}
                                    itemStyle={chart.tooltipItemStyle}
                                />
                                <Legend iconType="circle" wrapperStyle={{ color: chart.legendColor }} />
                                <Bar dataKey="collected" name="Collected (Lakhs)" fill={CHART_COLORS.chart3} radius={[4, 4, 0, 0]} {...animation} />
                                <Bar dataKey="pending" name="Pending (Lakhs)" fill={CHART_COLORS.chart4} radius={[4, 4, 0, 0]} {...animation} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
