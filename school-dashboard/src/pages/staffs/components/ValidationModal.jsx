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
          <div className="p-2 bg-info-100 rounded-lg">
            <ShieldCheck className="text-info-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t('staff.payroll.validationResults')}</h3>
            <p className="text-sm text-default-500">{t('staff.payroll.reviewBeforeGenerating')}</p>
          </div>
        </ModalHeader>
        <ModalBody>
          {validating ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg p-4 border border-border-token space-y-2">
                  <div className="h-4 w-32 bg-surface-2 rounded animate-pulse" />
                  <div className="h-3 w-full bg-surface-2 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-surface-2 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : validationResults && (
            <div className="space-y-4">
              {/* Valid Employees */}
              <div className="bg-success-50 rounded-lg p-4 border border-success-200">
                <h4 className="font-semibold text-success-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  {t('staff.payroll.readyToProcess', { count: validationResults.valid?.length || 0 })}
                </h4>
                {validationResults.valid?.length > 0 && (
                  <div className="max-h-40 overflow-y-auto text-sm">
                    {validationResults.valid.slice(0, 5).map(emp => (
                      <div key={emp.employeeId} className="py-1">{emp.name} - {formatCurrency(emp.salary)}</div>
                    ))}
                    {validationResults.valid.length > 5 && (
                      <div className="text-success-700 italic">...and {validationResults.valid.length - 5} more</div>
                    )}
                  </div>
                )}
              </div>

              {/* Invalid Employees */}
              {validationResults.invalid?.length > 0 && (
                <div className="bg-danger-50 rounded-lg p-4 border border-danger-200">
                  <h4 className="font-semibold text-danger-900 mb-2 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    {t('staff.payroll.willBeExcluded', { count: validationResults.invalid.length })}
                  </h4>
                  <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                    {validationResults.invalid.map(emp => (
                      <div key={emp.employeeId} className="text-danger-700">
                        {emp.name}: {emp.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationResults.warnings?.length > 0 && (
                <div className="bg-warning-50 rounded-lg p-4 border border-warning-200">
                  <h4 className="font-semibold text-warning-900 mb-2 flex items-center gap-2">
                    <AlertCircle size={18} />
                    {t('staff.payroll.warnings', { count: validationResults.warnings.length })}
                  </h4>
                  <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                    {validationResults.warnings.map((warning, idx) => (
                      <div key={warning.message || `error-${idx}`} className="text-warning-700">
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
