import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Spinner
} from "@heroui/react";
import { ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function ValidationResultsModal({
  isOpen,
  onOpenChange,
  validating,
  validationResults,
  preparingRecords,
  onConfirm,
  formatCurrency,
}) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex gap-3">
          <div className="p-2 bg-info-100 rounded-lg">
            <ShieldCheck className="text-info-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t('pages.payrollValidationResults')}</h3>
            <p className="text-sm text-default-500">{t('pages.reviewBeforeGeneratingRecords')}</p>
          </div>
        </ModalHeader>
        <ModalBody>
          {validating ? (
            <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 rounded-full border-2 border-gray-300 border-t-gray-900" /></div>
          ) : validationResults && (
            <div className="space-y-4">
              {/* Valid Employees */}
              <div className="bg-success-50 rounded-lg p-4 border border-success-200">
                <h4 className="font-semibold text-success-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  Ready to Process ({validationResults.valid?.length || 0})
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
                    Will Be Excluded ({validationResults.invalid.length})
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
                    Warnings ({validationResults.warnings.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                    {validationResults.warnings.map((warning, idx) => (
                      <div key={`warning-${idx}`} className="text-warning-700">
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
          <Button variant="light" onPress={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button color="primary" onPress={onConfirm} isDisabled={preparingRecords || !validationResults?.valid?.length}>
            {preparingRecords ? <Spinner size="sm" color="white" /> : `Generate Records (${validationResults?.valid?.length || 0})`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
