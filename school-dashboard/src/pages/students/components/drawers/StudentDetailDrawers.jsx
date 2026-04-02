import { useTranslation } from 'react-i18next';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, Button
} from "@heroui/react";
import { Phone } from "lucide-react";
import { formatDate } from '../../../../utils/dateFormatter';

const drawerClassNames = {
  wrapper: "!z-50",
  base: "m-2 rounded-xl shadow-xl dark:shadow-zinc-900/50 h-[calc(100%-1rem)]",
  backdrop: "!z-40"
};

export function AttendanceDetailDrawer({ isOpen, onOpenChange, attendanceStats }) {
  const { t } = useTranslation();

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="right"
      size="sm"
      classNames={drawerClassNames}
    >
      <DrawerContent>
        {() => (
          <>
            <DrawerHeader className="border-b border-default-100">
              <h3 className="text-lg font-semibold">{t('students.profile.overview.attendanceDetails', 'Attendance Details')}</h3>
            </DrawerHeader>
            <DrawerBody className="p-6">
              <div className="space-y-6">
                <div className="text-center p-6 bg-primary-50 rounded-2xl">
                  <div className="text-4xl font-bold text-primary">{attendanceStats?.percentage || 0}%</div>
                  <div className="text-sm text-primary-600">{t('students.profile.overview.overallAttendance', 'Overall Attendance')}</div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">{t('students.profile.overview.attendanceHistory', 'Attendance History')}</h4>
                  <p className="text-sm text-default-500">{t('students.profile.overview.attendanceHistoryDesc', 'Detailed calendar view and log will be here.')}</p>
                </div>
              </div>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export function FeeStatusDrawer({ isOpen, onOpenChange, onViewFees, studentFeeStructure }) {
  const { t } = useTranslation();
  const hasPending = studentFeeStructure?.totalBalance > 0;

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="right"
      size="sm"
      classNames={drawerClassNames}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="border-b border-default-100">
              <h3 className="text-lg font-semibold">{t('students.profile.overview.feeDetails', 'Fee Details')}</h3>
            </DrawerHeader>
            <DrawerBody className="p-6">
              <div className="space-y-6">
                <div className={`p-4 border rounded-xl ${hasPending ? 'border-warning-200 bg-warning-50' : 'border-success-200 bg-success-50'}`}>
                  <h4 className={`font-semibold mb-1 ${hasPending ? 'text-warning-700' : 'text-success-700'}`}>
                    {hasPending ? t('students.profile.overview.paymentDue', 'Payment Due') : t('students.profile.overview.allFeesPaid', 'All Fees Paid')}
                  </h4>
                  <p className={`text-2xl font-bold ${hasPending ? 'text-warning-800' : 'text-success-800'}`}>
                    ₹{(studentFeeStructure?.totalBalance || 0).toLocaleString()}
                  </p>
                  {studentFeeStructure?.nextDueDate && hasPending && (
                    <p className="text-xs text-warning-600">
                      {t('students.profile.overview.dueDateLabel', 'Due Date')}: {formatDate(studentFeeStructure.nextDueDate)}
                    </p>
                  )}
                </div>
                <Button color="primary" fullWidth onPress={() => { onClose(); onViewFees(); }}>
                  {t('students.profile.overview.viewFullFeeStructure', 'View Full Fee Structure')}
                </Button>
              </div>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export function ParentAppDrawer({ isOpen, onOpenChange, parentAppInfo }) {
  const { t } = useTranslation();
  const isConnected = parentAppInfo?.isConnected ?? false;

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="right"
      size="sm"
      classNames={drawerClassNames}
    >
      <DrawerContent>
        {() => (
          <>
            <DrawerHeader className="border-b border-default-100">
              <h3 className="text-lg font-semibold">{t('students.profile.overview.parentApp', 'Parent App')}</h3>
            </DrawerHeader>
            <DrawerBody className="p-6">
              {isConnected ? (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-success-50 rounded-full text-success"><Phone size={24} /></div>
                    <div>
                      <h4 className="font-bold">{t('students.profile.overview.connected', 'Connected')}</h4>
                      {parentAppInfo?.activeSince && <p className="text-sm text-default-500">{t('students.profile.overview.activeSince', 'Active since')} {parentAppInfo.activeSince}</p>}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {parentAppInfo?.lastLogin && (
                      <div className="flex justify-between border-b border-default-100 pb-2">
                        <span className="text-default-500">{t('students.profile.overview.lastLogin', 'Last Login')}</span>
                        <span>{parentAppInfo.lastLogin}</span>
                      </div>
                    )}
                    {parentAppInfo?.device && (
                      <div className="flex justify-between border-b border-default-100 pb-2">
                        <span className="text-default-500">{t('students.profile.overview.device', 'Device')}</span>
                        <span>{parentAppInfo.device}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Phone size={32} className="mx-auto text-default-300 mb-3" />
                  <p className="text-sm text-default-500">{t('students.profile.overview.parentAppNotConnected', 'Parent app not connected yet')}</p>
                </div>
              )}
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
