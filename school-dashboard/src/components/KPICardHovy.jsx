import React from 'react';
import { Card, CardBody } from "@heroui/react";

export default function KPICardHovy({ label, value, trend, trendUp, icon, color, className }) {
    return (
        <Card className={`group relative overflow-hidden bg-white/60 dark:bg-default-100/50 backdrop-blur-md border border-white/20 dark:border-default-200/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${className || ''}`}>
            <CardBody className="p-5 flex flex-row items-center justify-between gap-4 relative z-10">
                <div>
                    <p className="text-xs font-medium text-default-500 uppercase tracking-wider mb-1">{label}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-medium text-foreground tracking-tight group-hover:scale-105 transition-transform origin-left">
                            {value}
                        </h3>
                    </div>
                    {trend && (
                        <div className={`mt-2 flex items-center text-xs font-medium ${trendUp ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                            <span className={`inline-block mr-1 ${trendUp ? 'rotate-0' : 'rotate-180'} transition-transform`}>
                                ▲
                            </span>
                            {trend}
                        </div>
                    )}
                </div>

                <div className={`
            flex items-center justify-center w-12 h-12 rounded-md 
            ${color ? `bg-${color.split('-')[1] || 'primary'}-500/10 text-${color.split('-')[1] || 'primary'}-600` : 'bg-primary/10 text-primary'} 
            group-hover:scale-110 group-hover:rotate-3 transition-all duration-300
        `}>
                    {React.cloneElement(icon, { size: 24, strokeWidth: 2 })}
                </div>
            </CardBody>

            {/* Decorative gradient blob on hover */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </Card>
    );
}
