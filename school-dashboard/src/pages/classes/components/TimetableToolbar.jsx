import { Button, Select, SelectItem, Chip, Spinner } from "@heroui/react";
import { Settings, Save, Wand2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from 'react-i18next';

/**
 * Toolbar for the Timetable page — class selector, sync status, and action buttons.
 */
export function TimetableToolbar({
  classId,
  selectedClass,
  setSelectedClass,
  classesWithTeachers,
  selectedClassData,
  currentAcademicYear,
  syncStatus,
  hasChanges,
  loading,
  onWizardClick,
  onPeriodsOpen,
  onSaveTimetable,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 items-center border-b border-gray-200 dark:border-zinc-800 py-4 px-4 mb-4">
      {/* Left Side - Filters & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          {!classId && (
            <Select
              size="sm"
              selectedKeys={selectedClass ? [selectedClass] : []}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-[160px]"
              aria-label={t('aria.inputs.selectClass')}
              variant="flat"
            >
              {classesWithTeachers.map(c => (
                <SelectItem key={c.id} textValue={`Class ${c.name}-${c.section}`}>
                  Class {c.name}-{c.section}
                </SelectItem>
              ))}
            </Select>
          )}
          {selectedClassData && (
            <Chip size="sm" variant="flat" color="primary">
              {currentAcademicYear}
            </Chip>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sync Status Indicator */}
          {syncStatus === 'syncing' && (
            <Chip size="sm" variant="flat" color="default" className="h-8" startContent={<Spinner size="sm" />}>
              Syncing...
            </Chip>
          )}
          {syncStatus === 'success' && (
            <Chip size="sm" variant="flat" color="success" className="h-8" startContent={<CheckCircle2 size={14} />}>
              Synced
            </Chip>
          )}
          {syncStatus === 'error' && (
            <Chip size="sm" variant="flat" color="danger" className="h-8" startContent={<AlertTriangle size={14} />}>
              Sync Failed
            </Chip>
          )}
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="flex gap-2 w-full sm:w-auto justify-end">
        <Button
          size="sm"
          color="primary"
          variant="flat"
          startContent={<Wand2 size={14} />}
          onPress={onWizardClick}
        >
          <span className="hidden sm:inline">{t('pages.timetableWizard')}</span>
          <span className="sm:hidden">{t('pages.wizard')}</span>
        </Button>
        <Button
          size="sm"
          variant="flat"
          startContent={<Settings size={14} />}
          onPress={onPeriodsOpen}
        >
          <span className="hidden sm:inline">{t('pages.periods')}</span>
          <span className="sm:hidden">{t('pages.settings2')}</span>
        </Button>
        {hasChanges && (
          <Button
            size="sm"
            color="primary"
            startContent={<Save size={14} />}
            onPress={onSaveTimetable}
            isLoading={loading}
          >
            Save Changes
          </Button>
        )}
      </div>
    </div>
  );
}
