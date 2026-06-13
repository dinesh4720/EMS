import { useTranslation } from "react-i18next";
import {
  Button, Spinner,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
} from "@heroui/react";
import { ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { formatCurrency } from "../../../utils/numberFormatter";

export default function ValidationModal({
  isOpen,
  onClose,
  validating,
  validationResults,
  preparingRecords,
  onConfirm,
}) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex gap-3">
          <div className="p-2 bg-info-bg rounded-lg">
            <ShieldCheck className="text-info" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t('staff.payroll.validationResults')}</h3>
            <p className="text-sm text-fg-muted">{t('staff.payroll.reviewBeforeGenerating')}</p>
          </div>
        </ModalHeader>
        <ModalBody>
          {validating ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={`validation-skeleton-${i}`} className="rounded-lg p-4 border border-border-token space-y-2">
                  <div className="h-4 w-32 animate-shimmer rounded" />
                  <div className="h-3 w-full animate-shimmer rounded" />
                  <div className="h-3 w-2/3 animate-shimmer rounded" />
                </div>
              ))}
            </div>
          ) : validationResults && (
            <div className="space-y-4">
              {/* Valid Employees */}
              <div className="bg-ok-bg rounded-lg p-4 border border-ok/20">
                <h4 className="font-semibold text-ok mb-2 flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  {t('staff.payroll.readyToProcess', { count: validationResults.valid?.length || 0 })}
                </h4>
                {validationResults.valid?.length > 0 && (
                  <div className="max-h-40 overflow-y-auto text-sm">
                    {validationResults.valid.slice(0, 5).map(emp => (
                      <div key={emp.employeeId} className="py-1">{emp.name} - {formatCurrency(emp.salary)}</div>
                    ))}
                    {validationResults.valid.length > 5 && (
                      <div className="text-ok italic">...and {validationResults.valid.length - 5} more</div>
                    )}
                  </div>
                )}
              </div>

              {/* Invalid Employees */}
              {validationResults.invalid?.length > 0 && (
                <div className="bg-danger-bg rounded-lg p-4 border border-danger-token/20">
                  <h4 className="font-semibold text-danger-token mb-2 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    {t('staff.payroll.willBeExcluded', { count: validationResults.invalid.length })}
                  </h4>
                  <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                    {validationResults.invalid.map(emp => (
                      <div key={emp.employeeId} className="text-danger-token">
                        {emp.name}: {emp.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationResults.warnings?.length > 0 && (
                <div className="bg-warn-bg rounded-lg p-4 border border-warn/20">
                  <h4 className="font-semibold text-warn mb-2 flex items-center gap-2">
                    <AlertCircle size={18} />
                    {t('staff.payroll.warnings', { count: validationResults.warnings.length })}
                  </h4>
                  <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                    {validationResults.warnings.map((warning, idx) => (
                      <div key={warning.message || `error-${idx}`} className="text-warn">
                        {warning.name || warning.message || `Warning: ${warning.reason}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={() => onClose(false)}>
            {t('common.cancel')}
          </Button>
          <Button color="primary" onPress={onConfirm} isDisabled={preparingRecords || !validationResults?.valid?.length}>
            {preparingRecords ? <Spinner size="sm" color="white" /> : t('staff.payroll.generateRecords', { count: validationResults?.valid?.length || 0 })}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
