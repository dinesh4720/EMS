import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Spinner
} from "@heroui/react";
import { ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';

/**
 * REVAMP-17: Validation results render as three stacked groups
 * (valid / invalid / warnings). Each row is a `.payroll-modal__list-item`
 * with a chip on the right summarising the issue or the amount.
 */
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
  const valid = validationResults?.valid || [];
  const invalid = validationResults?.invalid || [];
  const warnings = validationResults?.warnings || [];

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
      className="payroll-modal"
    >
      <ModalContent>
        <ModalHeader>
          <div className="payroll-modal__head">
            <div className="payroll-modal__icon payroll-modal__icon--info">
              <ShieldCheck size={18} aria-hidden />
            </div>
            <div>
              <h3 className="payroll-modal__title">{t('pages.payrollValidationResults')}</h3>
              <p className="payroll-modal__sub">{t('pages.reviewBeforeGeneratingRecords')}</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          {validating ? (
            <div className="row" style={{ justifyContent: 'center', padding: 32 }}>
              <Spinner size="md" />
            </div>
          ) : validationResults && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Valid */}
              <section>
                <div className="row gap-2" style={{ marginBottom: 8 }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--ok)' }} aria-hidden />
                  <span className="card__title" style={{ color: 'var(--fg)' }}>
                    Ready to process
                  </span>
                  <span className="chip chip--ok mono tnum">{valid.length}</span>
                </div>
                {valid.length === 0 ? (
                  <div className="subtle" style={{ fontSize: 12 }}>No employees ready.</div>
                ) : (
                  <div className="payroll-modal__list">
                    {valid.slice(0, 8).map((emp) => (
                      <div key={emp.employeeId} className="payroll-modal__list-item">
                        <span>{emp.name}</span>
                        <span className="mono tnum">{formatCurrency(emp.salary)}</span>
                      </div>
                    ))}
                    {valid.length > 8 && (
                      <div className="subtle" style={{ fontSize: 11.5, padding: '4px 8px' }}>
                        …and <span className="mono tnum">{valid.length - 8}</span> more
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Invalid — excluded with field-level reason */}
              {invalid.length > 0 && (
                <section>
                  <div className="row gap-2" style={{ marginBottom: 8 }}>
                    <AlertTriangle size={14} style={{ color: 'var(--danger)' }} aria-hidden />
                    <span className="card__title" style={{ color: 'var(--fg)' }}>
                      Will be excluded
                    </span>
                    <span className="chip chip--danger mono tnum">{invalid.length}</span>
                  </div>
                  <div className="payroll-modal__list">
                    {invalid.map((emp) => (
                      <div key={emp.employeeId} className="payroll-modal__list-item">
                        <span>{emp.name}</span>
                        <span
                          className="chip chip--danger"
                          title={emp.reason}
                          style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {emp.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <section>
                  <div className="row gap-2" style={{ marginBottom: 8 }}>
                    <AlertCircle size={14} style={{ color: 'var(--warn)' }} aria-hidden />
                    <span className="card__title" style={{ color: 'var(--fg)' }}>
                      Warnings
                    </span>
                    <span className="chip chip--warn mono tnum">{warnings.length}</span>
                  </div>
                  <div className="payroll-modal__list">
                    {warnings.map((w, idx) => (
                      <div key={w.message || `warning-${idx}`} className="payroll-modal__list-item">
                        <span>{w.name || w.message || 'Warning'}</span>
                        {w.reason && (
                          <span
                            className="chip chip--warn"
                            style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {w.reason}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={onConfirm}
            disabled={preparingRecords || !valid.length}
          >
            {preparingRecords ? (
              <Spinner size="sm" color="white" />
            ) : (
              <>Generate records (<span className="mono tnum">{valid.length}</span>)</>
            )}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
