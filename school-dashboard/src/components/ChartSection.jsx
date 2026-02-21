import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { TrendingUp, Users } from 'lucide-react';

const attendanceData = [
  { day: 'Mon', students: 92, staff: 96 },
  { day: 'Tue', students: 88, staff: 94 },
  { day: 'Wed', students: 95, staff: 98 },
  { day: 'Thu', students: 90, staff: 95 },
  { day: 'Fri', students: 85, staff: 92 },
  { day: 'Sat', students: 78, staff: 88 },
];

const feeData = [
  { month: 'Apr', collected: 12, pending: 3 },
  { month: 'May', collected: 15, pending: 4 },
  { month: 'Jun', collected: 18, pending: 2 },
  { month: 'Jul', collected: 14, pending: 5 },
  { month: 'Aug', collected: 16, pending: 3 },
  { month: 'Sep', collected: 20, pending: 2 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-200">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 capitalize">{entry.name}:</span>
            <span className="font-medium text-gray-900">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function ChartSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Attendance Chart */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <Users size={16} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Attendance</h3>
                <p className="text-xs text-gray-500">This week</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="students"
                  name="students"
                  stroke="#6b7280"
                  strokeWidth={2}
                  fill="#e5e7eb"
                />
                <Area
                  type="monotone"
                  dataKey="staff"
                  name="staff"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  fill="#f3f4f6"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
              <span className="text-xs text-gray-500">Students</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span className="text-xs text-gray-500">Staff</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Collection Chart */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <TrendingUp size={16} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Fee Collection</h3>
                <p className="text-xs text-gray-500">Last 6 months (Lakhs)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                />
                <Bar dataKey="collected" name="Collected" fill="#6b7280" radius={[3, 3, 0, 0]} barSize={20} />
                <Bar dataKey="pending" name="Pending" fill="#d1d5db" radius={[3, 3, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
              <span className="text-xs text-gray-500">Collected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span className="text-xs text-gray-500">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ChartSection);
