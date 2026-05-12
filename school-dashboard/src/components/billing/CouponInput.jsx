import { useState } from 'react';
import { Tag, CheckCircle2 } from 'lucide-react';
import { billingApi } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { Button, Chip, Input } from '../ui';

/**
 * Coupon / promo-code input with inline validation.
 * Calls onApply(coupon) once a valid code is confirmed.
 */
export default function CouponInput({ onApply }) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const coupon = await billingApi.validateCoupon(code.trim().toUpperCase());
      setApplied(coupon);
      if (onApply) onApply(coupon);
    } catch (err) {
      setError(err.message || t('billing.couponInvalid', 'Invalid or expired coupon code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setApplied(null);
    setCode('');
    setError('');
    if (onApply) onApply(null);
  };

  if (applied) {
    return (
      <Chip
        color="success"
        startContent={<CheckCircle2 size={14} aria-hidden="true" />}
        onRemove={handleRemove}
      >
        {applied.code} — {applied.discountLabel || `${applied.percentOff ?? applied.amountOff}% off`}
      </Chip>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <Input
        size="sm"
        placeholder={t('billing.couponPlaceholder', 'Enter promo code')}
        value={code}
        onChange={(e) => { setCode(e.target.value); setError(''); }}
        startContent={<Tag size={14} aria-hidden="true" />}
        wrapperClassName="max-w-xs"
        error={error || undefined}
        onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
        aria-label={t('billing.couponCode', 'Coupon code')}
      />
      <Button
        size="sm"
        variant="outline"
        loading={loading}
        disabled={!code.trim() || loading}
        onClick={handleApply}
      >
        {t('billing.applyCode', 'Apply')}
      </Button>
    </div>
  );
}
