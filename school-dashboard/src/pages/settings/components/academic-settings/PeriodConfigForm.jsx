import { useState } from "react";
import { Input, Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

export default function PeriodConfigForm({ settings, onSave, onCancel, saving }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    periodDuration: settings.periodDuration || 45,
    periodsPerDay: settings.periodsPerDay || 8,
  });

  // Calculate instructional time
  const totalMinutes = (formData.periodsPerDay || 0) * (formData.periodDuration || 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          label={t('pages.periodDurationMinutes')}
          labelPlacement="outside"
          value={String(formData.periodDuration)}
          onValueChange={(v) => setFormData({ ...formData, periodDuration: parseInt(v) || 0 })}
          variant="bordered"
          min={1}
          max={120}
        />
        <Input
          type="number"
          label={t('pages.periodsPerDay1')}
          labelPlacement="outside"
          value={String(formData.periodsPerDay)}
          onValueChange={(v) => setFormData({ ...formData, periodsPerDay: parseInt(v) || 0 })}
          variant="bordered"
          min={1}
          max={15}
        />
      </div>
      <div className="p-4 bg-default-50 rounded-lg">
        <p className="text-sm text-default-600">
          <span className="font-medium">{t('pages.instructionalTime')}</span> {hours}h {minutes}m
          <span className="text-default-400 ml-2">({formData.periodsPerDay} periods × {formData.periodDuration} minutes)</span>
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="light" onPress={onCancel} isDisabled={saving}>{t('pages.cancel2')}</Button>
        <Button color="primary" onPress={() => onSave(formData)} isLoading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
