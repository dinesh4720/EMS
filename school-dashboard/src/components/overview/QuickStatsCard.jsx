import React from 'react';
import { Card, CardBody } from '@heroui/react';

function QuickStatsCard({
  icon: Icon,
  iconColor = 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400',
  title,
  subtitle,
  stats = [],
  className = ''
}) {
  return (
    <Card shadow="sm" className={`border border-default-200 bg-background/60 backdrop-blur-md ${className}`}>
      <CardBody className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl ${iconColor}`}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-default-900">{title}</h3>
            <p className="text-sm text-default-500">{subtitle}</p>
          </div>
        </div>

        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
              <span className="text-sm text-default-500">{stat.label}</span>
              <span className={`font-bold ${stat.valueColor || 'text-default-900'}`}>{stat.value}</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export default React.memo(QuickStatsCard);
