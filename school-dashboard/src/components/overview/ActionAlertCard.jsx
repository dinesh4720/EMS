import React from 'react';
import { Card, CardBody } from '@heroui/react';
import { ChevronRight } from 'lucide-react';

function ActionAlertCard({
  icon: Icon,
  iconColor = 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400',
  title,
  description,
  variant = 'default',
  onClick
}) {
  const variantStyles = {
    default: {
      card: 'border border-default-200 bg-background/60',
      icon: iconColor
    },
    warning: {
      card: 'border border-warning-200 bg-warning-50/50 hover:bg-warning-50',
      icon: 'bg-warning-100 text-warning-600'
    },
    danger: {
      card: 'border border-danger-200 bg-danger-50/50 hover:bg-danger-50',
      icon: 'bg-danger-100 text-danger-600'
    },
    success: {
      card: 'border border-success-200 bg-success-50/50',
      icon: 'bg-success-100 text-success-600'
    }
  };

  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <Card
      isPressable={!!onClick}
      onPress={onClick}
      className={`${styles.card} cursor-pointer transition-colors`}
    >
      <CardBody className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${styles.icon}`}>
            <Icon size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-default-900">{title}</p>
            <p className="text-xs text-default-500">{description}</p>
          </div>
          {onClick && <ChevronRight size={16} className="text-default-400" />}
        </div>
      </CardBody>
    </Card>
  );
}

export default React.memo(ActionAlertCard);
