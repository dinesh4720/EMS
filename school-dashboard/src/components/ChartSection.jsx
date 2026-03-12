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

const compactNumber = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

function FeeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900">
        {currencyFormatter.format(payload[0].value || 0)}
      </p>
    </div>
  );
}

function ChartSection({ attendanceRows = [], feeCollectionData = [], loading = false, paymentsLoaded = true }) {
  const hasAttendanceData = attendanceRows.some((row) => typeof row.value === 'number');
  const hasFeeData = feeCollectionData.some((row) => row.collected > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Users size={16} className="text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 text-sm">Attendance Snapshot</h3>
              <p className="text-xs text-gray-500">Live rates from today&apos;s marked records</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {loading && !hasAttendanceData ? (
            <p className="text-sm text-gray-500">Loading attendance data...</p>
          ) : hasAttendanceData ? (
            attendanceRows.map((row) => (
              <div key={row.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{row.label}</p>
                    <p className="text-xs text-gray-500">{row.subtext}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {percentFormatter.format(row.value)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gray-500 transition-[width] duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, row.value))}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-gray-700">No attendance recorded yet</p>
              <p className="mt-1 text-xs text-gray-500">This section updates once staff or class attendance is marked.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <TrendingUp size={16} className="text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 text-sm">Fee Collection</h3>
              <p className="text-xs text-gray-500">Actual receipts over the last 6 months</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {loading && !hasFeeData ? (
            <p className="text-sm text-gray-500">Loading payment data...</p>
          ) : hasFeeData ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={feeCollectionData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
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
                      tickFormatter={(value) => compactNumber.format(value)}
                    />
                    <Tooltip content={<FeeTooltip />} />
                    <Bar dataKey="collected" name="Collected" fill="#6b7280" radius={[4, 4, 0, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <Wallet size={14} />
                <span>Paid amounts only. Refunded or failed records are excluded when status is available.</span>
              </div>
            </>
          ) : paymentsLoaded ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-gray-700">No fee payments recorded yet</p>
              <p className="mt-1 text-xs text-gray-500">Monthly collection trends will appear once receipts are posted.</p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-gray-700">Payment data unavailable</p>
              <p className="mt-1 text-xs text-gray-500">The fee collection chart will return once the payments API responds.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ChartSection);
