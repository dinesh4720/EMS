import { useState } from "react";
import { Input, Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

export default function AcademicYearForm({ settings, onSave, onCancel, saving }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    academicYear: settings.academicYear || "",
    academicYearStart: settings.academicYearStart || "",
    academicYearEnd: settings.academicYearEnd || "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    if (!formData.academicYear.trim()) next.academicYear = "Session name is required";
    if (!formData.academicYearStart) next.academicYearStart = "Start date is required";
    if (!formData.academicYearEnd) next.academicYearEnd = "End date is required";
    if (formData.academicYearStart && formData.academicYearEnd) {
      if (formData.academicYearEnd <= formData.academicYearStart) {
        next.academicYearEnd = "End date must be after start date";
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
      <Input
        label={t('pages.sessionName')}
        labelPlacement="outside"
        placeholder={t('settings.academics.sessionPlaceholder')}
        value={formData.academicYear}
        onValueChange={(v) => {
          setFormData({ ...formData, academicYear: v });
          if (errors.academicYear) setErrors((prev) => ({ ...prev, academicYear: undefined }));
        }}
        variant="bordered"
        description="This label will appear on all reports and documents."
        isInvalid={!!errors.academicYear}
        errorMessage={errors.academicYear}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label={t('pages.startDate1')}
          labelPlacement="outside"
          value={formData.academicYearStart}
          onValueChange={(v) => {
            setFormData({ ...formData, academicYearStart: v });
            if (errors.academicYearStart) setErrors((prev) => ({ ...prev, academicYearStart: undefined }));
          }}
          variant="bordered"
          isInvalid={!!errors.academicYearStart}
          errorMessage={errors.academicYearStart}
        />
        <Input
          type="date"
          label={t('pages.endDate1')}
          labelPlacement="outside"
          value={formData.academicYearEnd}
          onValueChange={(v) => {
            setFormData({ ...formData, academicYearEnd: v });
            if (errors.academicYearEnd) setErrors((prev) => ({ ...prev, academicYearEnd: undefined }));
          }}
          variant="bordered"
          isInvalid={!!errors.academicYearEnd}
          errorMessage={errors.academicYearEnd}
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
