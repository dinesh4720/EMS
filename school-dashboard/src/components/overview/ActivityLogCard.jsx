import React from 'react';
import { Card, CardBody } from '@heroui/react';

function ActivityLogCard({
  icon: Icon,
  iconColor = 'bg-surface-2 text-fg-muted',
  title,
  subtitle,
  activities = [],
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

        <div className="flex flex-col gap-2">
          {activities.length > 0 ? (
            activities.map((item, i) => (
              <div key={item.title || `activity-${i}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-default-50 transition-colors">
                <div className={`p-2 rounded-lg ${item.bgColor || 'bg-surface-2'}`}>
                  {item.icon && <item.icon size={16} className={item.color || 'text-fg-muted'} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-default-900">{item.title}</p>
                  <p className="text-xs text-default-400">{item.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-default-400 text-sm">
              No recent activity
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export default React.memo(ActivityLogCard);
