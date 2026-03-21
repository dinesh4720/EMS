import { useTranslation } from 'react-i18next';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  Button, Checkbox, Select, SelectItem
} from "@heroui/react";
import { AlertTriangle, CalendarCheck } from "lucide-react";

export default function RegularizeAttendanceDrawer({ isOpen, onOpenChange }) {
  const { t } = useTranslation();

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="right"
      size="md"
      classNames={{
        wrapper: "!z-50",
        base: "m-2 rounded-xl shadow-xl dark:shadow-zinc-900/50 h-[calc(100%-1rem)]",
        backdrop: "!z-40"
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="border-b border-default-100"><h3 className="text-lg font-semibold">{t('students.profile.overview.regularizeAttendance', 'Regularize Attendance')}</h3></DrawerHeader>
            <DrawerBody className="p-0">
              <div className="p-6 bg-warning-50/50 border-b border-warning-100">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-warning-600" size={24} />
                  <div>
                    <h4 className="font-semibold text-warning-900">{t('students.profile.overview.unaccountedAbsences', 'Unaccounted Absences')}</h4>
                    <p className="text-sm text-warning-700">{t('students.profile.overview.selectDaysInstruction', 'Select days to mark as present or add reason.')}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {["Oct 12, 2024", "Oct 15, 2024", "Oct 18, 2024"].map((date, i) => (
                  <div key={date} className="flex items-center justify-between p-4 border border-default-200 rounded-xl">
                    <div className="flex items-center gap-4">
                      <Checkbox size="sm" />
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-default-100 rounded-lg text-default-500"><CalendarCheck size={20} /></div>
                        <span className="font-medium text-default-900">{date}</span>
                      </div>
                    </div>
                    <Select
                      aria-label={t('students.profile.overview.absenceReason', 'Absence reason')}
                      size="sm"
                      placeholder={t('students.profile.overview.selectReason', 'Select Reason')}
                      className="w-40"
                      variant="bordered"
                    >
                      <SelectItem key="sick">{t('students.profile.overview.sickLeave', 'Sick Leave')}</SelectItem>
                      <SelectItem key="personal">{t('students.profile.overview.personal', 'Personal')}</SelectItem>
                      <SelectItem key="official">{t('students.profile.overview.officialDuty', 'Official Duty')}</SelectItem>
                    </Select>
                  </div>
                ))}
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button variant="flat" onPress={onClose}>{t('common.cancel', 'Cancel')}</Button>
              <Button color="primary" onPress={onClose}>{t('students.profile.overview.updateAttendance', 'Update Attendance')}</Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
