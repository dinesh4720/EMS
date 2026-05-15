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

  return (
    <div className="space-y-6 py-4">
      <Input
        label={t('pages.sessionName')}
        labelPlacement="outside"
        placeholder={t('settings.academics.sessionPlaceholder')}
        value={formData.academicYear}
        onValueChange={(v) => setFormData({ ...formData, academicYear: v })}
        variant="bordered"
        description="This label will appear on all reports and documents."
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label={t('pages.startDate1')}
          labelPlacement="outside"
          value={formData.academicYearStart}
          onValueChange={(v) => setFormData({ ...formData, academicYearStart: v })}
          variant="bordered"
        />
        <Input
          type="date"
          label={t('pages.endDate1')}
          labelPlacement="outside"
          value={formData.academicYearEnd}
          onValueChange={(v) => setFormData({ ...formData, academicYearEnd: v })}
          variant="bordered"
        />
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
