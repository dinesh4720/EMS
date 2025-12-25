import React from 'react';
import { Card, CardBody, CardHeader } from "@heroui/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

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
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Attendance Trends */}
            <Card className="shadow-sm border border-default-200 bg-content1/50 backdrop-blur-sm rounded-2xl">
                <CardHeader className="px-5 py-4 border-b border-default-100/50">
                    <div className="flex flex-col">
                        <h3 className="text-base font-medium text-default-900">Attendance Trends</h3>
                        <p className="text-tiny text-default-500">Weekly student & staff presence</p>
                    </div>
                </CardHeader>
                <CardBody className="p-4 overflow-hidden">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={attendanceData}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorStaff" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--heroui-default-200)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--heroui-content1)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: 'var(--heroui-foreground)' }}
                                />
                                <Area type="monotone" dataKey="students" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
                                <Area type="monotone" dataKey="staff" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorStaff)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardBody>
            </Card>

            {/* Chart 2: Financial Overview */}
            <Card className="shadow-sm border border-default-200 bg-content1/50 backdrop-blur-sm rounded-2xl">
                <CardHeader className="px-5 py-4 border-b border-default-100/50">
                    <div className="flex flex-col">
                        <h3 className="text-base font-medium text-default-900">Financial Overview</h3>
                        <p className="text-tiny text-default-500">Fee collection vs pending per term</p>
                    </div>
                </CardHeader>
                <CardBody className="p-4 overflow-hidden">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financeData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--heroui-default-200)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'var(--heroui-default-100)', opacity: 0.5 }}
                                    contentStyle={{ backgroundColor: 'var(--heroui-content1)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: 'var(--heroui-foreground)' }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="collected" name="Collected (Lakhs)" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="pending" name="Pending (Lakhs)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
