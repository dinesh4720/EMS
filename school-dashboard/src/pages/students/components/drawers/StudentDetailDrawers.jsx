import { useTranslation } from 'react-i18next';
import {
  Drawer, Button
} from "../../../../components/ui";
import { Phone } from "lucide-react";
import { formatDate } from '../../../../utils/dateFormatter';
import { formatCurrency } from '../../../../utils/numberFormatter';

export function AttendanceDetailDrawer({ isOpen, onOpenChange, attendanceStats }) {
  const { t } = useTranslation();

  return (
    <Drawer
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      size="sm"
      title={t('students.profile.overview.attendanceDetails', 'Attendance Details')}
    >
      <div className="space-y-6">
        <div className="text-center p-6 bg-[var(--accent-bg)] rounded-2xl">
          <div className="text-4xl font-bold text-primary">{attendanceStats?.percentage || 0}%</div>
          <div className="text-sm text-[var(--accent)]">{t('students.profile.overview.overallAttendance', 'Overall Attendance')}</div>
        </div>
        <div>
          <h4 className="font-medium mb-3">{t('students.profile.overview.attendanceHistory', 'Attendance History')}</h4>
          <p className="text-sm text-fg-muted">{t('students.profile.overview.attendanceHistoryDesc', 'Detailed calendar view and log will be here.')}</p>
        </div>
      </div>
    </Drawer>
  );
}

export function FeeStatusDrawer({ isOpen, onOpenChange, onViewFees, studentFeeStructure }) {
  const { t } = useTranslation();
  const hasPending = studentFeeStructure?.totalBalance > 0;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      size="sm"
      title={t('students.profile.overview.feeDetails', 'Fee Details')}
    >
      {(onClose) => (
        <>
          <div className="space-y-6">
            <div className={`p-4 border rounded-xl ${hasPending ? 'border-[var(--warn)]/20 bg-[var(--warn-bg)]' : 'border-[var(--ok)]/20 bg-[var(--ok-bg)]'}`}>
              <h4 className={`font-semibold mb-1 ${hasPending ? 'text-[var(--warn)]' : 'text-[var(--ok)]'}`}>
                {hasPending ? t('students.profile.overview.paymentDue', 'Payment Due') : t('students.profile.overview.allFeesPaid', 'All Fees Paid')}
              </h4>
              <p className={`text-2xl font-bold ${hasPending ? 'text-warn' : 'text-ok'}`}>
                {formatCurrency(studentFeeStructure?.totalBalance || 0)}
              </p>
              {studentFeeStructure?.nextDueDate && hasPending && (
                <p className="text-xs text-[var(--warn)]">
                  {t('students.profile.overview.dueDateLabel', 'Due Date')}: {formatDate(studentFeeStructure.nextDueDate)}
                </p>
              )}
            </div>
            <Button variant="primary" fullWidth onClick={() => { onClose(); onViewFees(); }}>
              {t('students.profile.overview.viewFullFeeStructure', 'View Full Fee Structure')}
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}

export function ParentAppDrawer({ isOpen, onOpenChange, parentAppInfo }) {
  const { t } = useTranslation();
  const isConnected = parentAppInfo?.isConnected ?? false;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      size="sm"
      title={t('students.profile.overview.parentApp', 'Parent App')}
    >
      <div className="space-y-4">
        {isConnected ? (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-[var(--ok-bg)] rounded-full text-ok"><Phone size={24} /></div>
              <div>
                <h4 className="font-bold">{t('students.profile.overview.connected', 'Connected')}</h4>
                {parentAppInfo?.activeSince && <p className="text-sm text-fg-muted">{t('students.profile.overview.activeSince', 'Active since')} {parentAppInfo.activeSince}</p>}
              </div>
            </div>
            <div className="space-y-4">
              {parentAppInfo?.lastLogin && (
                <div className="flex justify-between border-b border-divider pb-2">
                  <span className="text-fg-muted">{t('students.profile.overview.lastLogin', 'Last Login')}</span>
                  <span>{parentAppInfo.lastLogin}</span>
                </div>
              )}
              {parentAppInfo?.device && (
                <div className="flex justify-between border-b border-divider pb-2">
                  <span className="text-fg-muted">{t('students.profile.overview.device', 'Device')}</span>
                  <span>{parentAppInfo.device}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Phone size={32} className="mx-auto text-fg-faint mb-3" />
            <p className="text-sm text-fg-muted">{t('students.profile.overview.parentAppNotConnected', 'Parent app not connected yet')}</p>
          </div>
        )}
      </div>
    </Drawer>
  );
}
