import { useState } from 'react';
import { Input, Button, Chip } from '@heroui/react';
import { Tag, CheckCircle2, X } from 'lucide-react';
import { billingApi } from '../../services/api';
import { useTranslation } from 'react-i18next';

/**
 * Coupon / promo-code input with inline validation.
 * Calls onApply(coupon) once a valid code is confirmed.
 *
 * @param {function} onApply - Receives the validated coupon object from the API
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
      <div className="flex items-center gap-2">
        <Chip
          color="success"
          variant="flat"
          startContent={<CheckCircle2 size={14} />}
          onClose={handleRemove}
        >
          {applied.code} — {applied.discountLabel || `${applied.percentOff ?? applied.amountOff}% off`}
        </Chip>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Input
          size="sm"
          placeholder={t('billing.couponPlaceholder', 'Enter promo code')}
          value={code}
          onValueChange={(v) => { setCode(v); setError(''); }}
          startContent={<Tag size={14} className="text-gray-400" />}
          className="max-w-xs"
          isInvalid={Boolean(error)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
          aria-label={t('billing.couponCode', 'Coupon code')}
        />
        <Button
          size="sm"
          variant="flat"
          color="primary"
          isLoading={loading}
          isDisabled={!code.trim() || loading}
          onPress={handleApply}
        >
          {t('billing.applyCode', 'Apply')}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-danger flex items-center gap-1">
          <X size={12} /> {error}
        </p>
      )}
    </div>
  );
}
