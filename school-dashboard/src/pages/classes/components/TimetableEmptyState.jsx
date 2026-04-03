import { Button } from "@heroui/react";
import { Clock, Wand2 } from "lucide-react";
import { useTranslation } from 'react-i18next';

/**
 * Empty state shown when no timetable exists for the selected class.
 */
export function TimetableEmptyState({ onWizardClick, onPeriodsOpen }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 dark:bg-zinc-900 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-lg">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
          <Clock size={40} className="text-gray-400 dark:text-zinc-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-zinc-300 mb-2">{t('pages.noTimetableSet')}</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
            Timetable has not been created for this class yet.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              size="sm"
              color="primary"
              variant="solid"
              startContent={<Wand2 size={14} />}
              onPress={onWizardClick}
            >
              Generate Timetable
            </Button>
            <Button
              size="sm"
              variant="flat"
              onPress={onPeriodsOpen}
            >
              Manage Periods
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
