import { useState } from "react";
import { Input, Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

export default function SchoolTimingsForm({ settings, onSave, onCancel, saving }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    schoolStartTime: settings.schoolStartTime || "",
    schoolEndTime: settings.schoolEndTime || "",
  });

  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="time"
          label={t('pages.schoolStarts')}
          labelPlacement="outside"
          value={formData.schoolStartTime}
          onValueChange={(v) => setFormData({ ...formData, schoolStartTime: v })}
          variant="bordered"
        />
        <Input
          type="time"
          label={t('pages.schoolEnds')}
          labelPlacement="outside"
          value={formData.schoolEndTime}
          onValueChange={(v) => setFormData({ ...formData, schoolEndTime: v })}
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
