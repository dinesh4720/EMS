import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { Clock, Trash2, Plus } from "lucide-react";
import { useTranslation } from 'react-i18next';

/**
 * Modal for managing period definitions (name, start/end times, break flag).
 */
export function PeriodsModal({
  isOpen,
  onClose,
  periods,
  onAddPeriod,
  onRemovePeriod,
  onUpdatePeriod,
  onSavePeriods,
}) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Clock size={20} className="text-primary" />
          <span>{t('pages.managePeriods')}</span>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            {periods.map((period, i) => (
              <div key={`period-edit-${i}`} className="flex gap-2 items-end">
                <Input
                  size="sm"
                  value={period.name}
                  onValueChange={(v) => onUpdatePeriod(i, 'name', v)}
                  label={t('pages.periodName')}
                  className="flex-1"
                  variant="bordered"
                />
                <Input
                  size="sm"
                  type="time"
                  value={period.startTime}
                  onValueChange={(v) => onUpdatePeriod(i, 'startTime', v)}
                  label={t('pages.startTime1')}
                  className="w-32"
                  variant="bordered"
                />
                <Input
                  size="sm"
                  type="time"
                  value={period.endTime}
                  onValueChange={(v) => onUpdatePeriod(i, 'endTime', v)}
                  label={t('pages.endTime1')}
                  className="w-32"
                  variant="bordered"
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={period.isBreak}
                      onChange={(e) => onUpdatePeriod(i, 'isBreak', e.target.checked)}
                      className="rounded"
                    />
                    <span>{t('pages.break')}</span>
                  </label>
                  <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    variant="flat"
                    radius="md"
                    onPress={() => onRemovePeriod(i)}
                    isDisabled={periods.length <= 1}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              size="sm"
              variant="flat"
              radius="md"
              startContent={<Plus size={14} />}
              onPress={onAddPeriod}
              className="w-full"
            >
              Add Period
            </Button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>{t('pages.cancel2')}</Button>
          <Button color="primary" onPress={onSavePeriods}>{t('pages.applyChanges')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
