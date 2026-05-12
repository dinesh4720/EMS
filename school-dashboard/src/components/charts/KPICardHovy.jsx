import React, { memo } from 'react';

const KPICardHovy = memo(function KPICardHovy({ label, value, trend, trendUp, icon, color, className }) {
    return (
        <div className={`bg-surface border border-divider rounded-lg p-4 flex items-center justify-between ${className || ''}`}>
            <div>
                <p className="text-xs font-medium text-fg-muted mb-1">{label}</p>
                <h3 className="text-2xl font-semibold text-fg">
                    {value}
                </h3>
                {trend && (
                    <div className={`mt-1.5 flex items-center text-xs font-medium ${trendUp ? 'text-fg-muted' : 'text-red-600'}`}>
                        <span className="mr-1">{trendUp ? '↑' : '↓'}</span>
                        {trend}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-2 text-fg-muted">
                {React.cloneElement(icon, { size: 18, strokeWidth: 2 })}
            </div>
        </div>
    );
});

KPICardHovy.displayName = 'KPICardHovy';

export default KPICardHovy;
