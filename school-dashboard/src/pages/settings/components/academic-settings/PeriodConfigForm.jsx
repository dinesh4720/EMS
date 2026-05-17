import { useState } from "react";
import { Input, Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

export default function PeriodConfigForm({ settings, onSave, onCancel, saving }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    periodDuration: settings.periodDuration || 45,
    periodsPerDay: settings.periodsPerDay || 8,
  });
  const [errors, setErrors] = useState({});

  // Calculate instructional time
  const totalMinutes = (formData.periodsPerDay || 0) * (formData.periodDuration || 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const validate = () => {
    const next = {};
    const duration = Number(formData.periodDuration);
    const periods = Number(formData.periodsPerDay);
    if (!Number.isFinite(duration) || duration < 10) next.periodDuration = "Duration must be at least 10 minutes";
    else if (duration > 120) next.periodDuration = "Duration cannot exceed 120 minutes";
    if (!Number.isFinite(periods) || periods < 1) next.periodsPerDay = "Must have at least 1 period per day";
    else if (periods > 15) next.periodsPerDay = "Cannot exceed 15 periods per day";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          label={t('pages.periodDurationMinutes')}
          labelPlacement="outside"
          value={String(formData.periodDuration)}
          onValueChange={(v) => {
            setFormData({ ...formData, periodDuration: parseInt(v) || 0 });
            if (errors.periodDuration) setErrors((prev) => ({ ...prev, periodDuration: undefined }));
          }}
          variant="bordered"
          min={1}
          max={120}
          isInvalid={!!errors.periodDuration}
          errorMessage={errors.periodDuration}
        />
        <Input
          type="number"
          label={t('pages.periodsPerDay1')}
          labelPlacement="outside"
          value={String(formData.periodsPerDay)}
          onValueChange={(v) => {
            setFormData({ ...formData, periodsPerDay: parseInt(v) || 0 });
            if (errors.periodsPerDay) setErrors((prev) => ({ ...prev, periodsPerDay: undefined }));
          }}
          variant="bordered"
          min={1}
          max={15}
          isInvalid={!!errors.periodsPerDay}
          errorMessage={errors.periodsPerDay}
        />
      </div>
      <div className="p-4 bg-surface-2 rounded-lg">
        <p className="text-sm text-fg-muted">
          <span className="font-medium">{t('pages.instructionalTime')}</span> {hours}h {minutes}m
          <span className="text-fg-faint ml-2">({formData.periodsPerDay} periods × {formData.periodDuration} minutes)</span>
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="light" onPress={onCancel} isDisabled={saving}>{t('pages.cancel2')}</Button>
        <Button color="primary" onPress={handleSave} isLoading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
