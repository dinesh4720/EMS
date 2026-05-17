import { useState } from "react";
import { Input, Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

export default function SchoolTimingsForm({ settings, onSave, onCancel, saving }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    schoolStartTime: settings.schoolStartTime || "",
    schoolEndTime: settings.schoolEndTime || "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    if (!formData.schoolStartTime) next.schoolStartTime = "Start time is required";
    if (!formData.schoolEndTime) next.schoolEndTime = "End time is required";
    if (formData.schoolStartTime && formData.schoolEndTime) {
      if (formData.schoolEndTime <= formData.schoolStartTime) {
        next.schoolEndTime = "End time must be after start time";
      }
    }
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
          type="time"
          label={t('pages.schoolStarts')}
          labelPlacement="outside"
          value={formData.schoolStartTime}
          onValueChange={(v) => {
            setFormData({ ...formData, schoolStartTime: v });
            if (errors.schoolStartTime) setErrors((prev) => ({ ...prev, schoolStartTime: undefined }));
          }}
          variant="bordered"
          isInvalid={!!errors.schoolStartTime}
          errorMessage={errors.schoolStartTime}
        />
        <Input
          type="time"
          label={t('pages.schoolEnds')}
          labelPlacement="outside"
          value={formData.schoolEndTime}
          onValueChange={(v) => {
            setFormData({ ...formData, schoolEndTime: v });
            if (errors.schoolEndTime) setErrors((prev) => ({ ...prev, schoolEndTime: undefined }));
          }}
          variant="bordered"
          isInvalid={!!errors.schoolEndTime}
          errorMessage={errors.schoolEndTime}
        />
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
