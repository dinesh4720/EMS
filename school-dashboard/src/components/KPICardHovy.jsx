import React from 'react';

export default function KPICardHovy({ label, value, trend, trendUp, icon, color, className }) {
    return (
        <div className={`bg-white border border-gray-100 rounded-lg p-4 flex items-center justify-between ${className || ''}`}>
            <div>
                <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                <h3 className="text-2xl font-semibold text-gray-900">
                    {value}
                </h3>
                {trend && (
                    <div className={`mt-1.5 flex items-center text-xs font-medium ${trendUp ? 'text-gray-600' : 'text-red-600'}`}>
                        <span className="mr-1">{trendUp ? '↑' : '↓'}</span>
                        {trend}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-600">
                {React.cloneElement(icon, { size: 18, strokeWidth: 2 })}
            </div>
        </div>
    );
}
