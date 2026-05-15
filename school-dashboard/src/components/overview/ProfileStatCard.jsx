import React from 'react';
import { Card, CardBody, Chip } from '@heroui/react';

function ProfileStatCard({
  icon: Icon,
  iconColor = 'bg-surface-2 text-fg-muted',
  title,
  value,
  label,
  chip,
  chipColor,
  subStats = [],
  actionButton,
  onClick,
  className = ''
}) {
  return (
    <Card
      isPressable={!!onClick}
      onPress={onClick}
      shadow="sm"
      className={`border border-default-200 bg-background/60 backdrop-blur-md cursor-pointer hover:shadow-md transition-shadow ${className}`}
    >
      <CardBody className="p-6">
        <div className="flex items-start justify-between mb-4 w-full">
          <div className={`p-3 rounded-xl ${iconColor}`}>
            <Icon size={24} />
          </div>
          {chip && (
            <Chip
              size="sm"
              color={chipColor || 'primary'}
              variant="flat"
              className="text-xs font-semibold"
            >
              {chip}
            </Chip>
          )}
        </div>
        <div className="space-y-1 text-left">
          {title && <h4 className="text-2xl font-semibold text-default-900">{title}</h4>}
          {value !== undefined && <h4 className="text-2xl font-semibold text-default-900">{value}</h4>}
          <p className="text-sm font-medium text-default-500">{label}</p>
        </div>
        {subStats.length > 0 && (
          <div className="mt-4 pt-4 border-t border-default-100 space-y-2">
            {subStats.map((stat) => (
              <div key={stat.label} className={`flex items-center gap-3 text-xs ${stat.textColor || 'text-default-500'}`}>
                <span className="font-medium">{stat.label}:</span>
                <span className={`font-bold ${stat.valueColor || 'text-default-700'}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}
        {actionButton && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-default-400">{actionButton.hint || 'Click to view details'}</span>
            <span
              className="text-xs px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950 text-primary hover:bg-primary-100 dark:hover:bg-primary-900 cursor-pointer transition-colors flex items-center gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                actionButton.onClick?.();
              }}
            >
              {actionButton.icon && <actionButton.icon size={14} />}
              {actionButton.label}
            </span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default React.memo(ProfileStatCard);
