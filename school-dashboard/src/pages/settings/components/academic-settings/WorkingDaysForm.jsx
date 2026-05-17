import { useState } from "react";
import { Button } from "@heroui/react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function WorkingDaysForm({ settings, onSave, onCancel, saving }) {
  const { t } = useTranslation();
  const [workingDays, setWorkingDays] = useState(settings.workingDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  const [error, setError] = useState(null);

  const days = [
    { key: "Mon", label: "Monday" },
    { key: "Tue", label: "Tuesday" },
    { key: "Wed", label: "Wednesday" },
    { key: "Thu", label: "Thursday" },
    { key: "Fri", label: "Friday" },
    { key: "Sat", label: "Saturday" },
    { key: "Sun", label: "Sunday" },
  ];

  const toggleDay = (dayKey) => {
    const newDays = workingDays.includes(dayKey)
      ? workingDays.filter(d => d !== dayKey)
      : [...workingDays, dayKey];
    setWorkingDays(newDays);
    if (error) setError(null);
  };

  const handleSave = () => {
    if (workingDays.length === 0) {
      setError("At least one working day must be selected");
      return;
    }
    onSave({ workingDays });
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-3">
        {days.map((day) => {
          const isActive = workingDays.includes(day.key);
          return (
            <div
              key={day.key}
              className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                isActive ? 'bg-primary/5 border-primary' : 'bg-surface border-border-token hover:border-border-token'
              }`}
              onClick={() => toggleDay(day.key)}
            >
              <span className={`font-medium ${isActive ? 'text-primary' : 'text-fg'}`}>{day.label}</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                isActive ? 'bg-primary border-primary' : 'border-border-token'
              }`}>
                {isActive && <Check size={12} className="text-white" />}
              </div>
            </div>
          );
        })}
      </div>
      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="light" onPress={onCancel} isDisabled={saving}>{t('pages.cancel2')}</Button>
        <Button color="primary" onPress={handleSave} isLoading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
