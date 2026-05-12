import { Card } from '../ui';
import { cn } from '../../utils/cn';

const TONE = {
  success: {
    iconWrap: 'bg-[var(--color-success)]/10',
    icon: 'text-[var(--color-success)]',
  },
  error: {
    iconWrap: 'bg-[var(--color-error)]/10',
    icon: 'text-[var(--color-error)]',
  },
  info: {
    iconWrap: 'bg-[var(--color-primary)]/10',
    icon: 'text-[var(--color-primary)]',
  },
};

export default function StatusCard({
  icon: Icon,
  iconBounce = false,
  title,
  description,
  tone = 'info',
  children,
  footer,
}) {
  const toneStyles = TONE[tone] || TONE.info;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg-secondary)]">
      <Card className="max-w-md w-full text-center" padding="lg" radius="lg" elevation="elevated">
        {Icon && (
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
              toneStyles.iconWrap,
              iconBounce && 'animate-bounce',
            )}
            aria-hidden="true"
          >
            <Icon className={cn('w-8 h-8', toneStyles.icon)} />
          </div>
        )}
        {title && (
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            {title}
          </h2>
        )}
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
        {footer && <div className="mt-4">{footer}</div>}
      </Card>
    </div>
  );
}
