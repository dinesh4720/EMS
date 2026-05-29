import { useState, useEffect } from 'react';
import {
  Card, CardBody, Button, Checkbox,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, useDisclosure,
} from '@heroui/react';
import {
  AlertTriangle, ArrowUpCircle, ArrowRight,
} from 'lucide-react';
import { promotionApi } from '../../../services/api/extensions';
import toast from 'react-hot-toast';

export default function StepConfirm({ onNext, onBack, wizardState, setWizardState }) {
  const [executing, setExecuting] = useState(false);
  const [generateRolls, setGenerateRolls] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const CONFIRM_PHRASE = 'CONFIRM';

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!executing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [executing]);

  const { classMappings, summary, fromYear, toYear } = wizardState;

  const total =
    (summary?.totalPromoting || 0) +
    (summary?.totalDetained || 0) +
    (summary?.totalGraduating || 0) +
    (summary?.totalTransferred || 0);

  const openConfirmModal = () => {
    setConfirmText('');
    onOpen();
  };

  const handleExecute = async () => {
    onClose();
    setExecuting(true);
    try {
      const payload = {
        fromAcademicYear: fromYear,
        toAcademicYear: toYear,
        classMappings: classMappings.map((m) => ({
          fromClassId: m.fromClassId,
          toClassId: m.graduate ? undefined : m.toClassId,
          graduate: m.graduate || false,
          studentDecisions: (m.studentDecisions || []).map((sd) => ({
            studentId: sd.studentId,
            decision: m.graduate && sd.decision === 'promoted' ? 'graduated' : sd.decision,
          })),
        })),
        generateRollNumbers: generateRolls,
      };

      const res = await promotionApi.executeAll(payload);

      setWizardState((prev) => ({
        ...prev,
        result: res,
      }));

      toast.success(
        `Promotion complete! ${res.summary?.promoted || 0} promoted, ${res.summary?.graduated || 0} graduated`
      );
      onNext();
    } catch (e) {
      toast.error(e?.message || 'Promotion failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      <Card shadow="sm" className="bg-warn-bg border-warn">
        <CardBody className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-warn mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-warn">
                Confirm Year-End Promotion
              </p>
              <p className="text-xs text-warn mt-1">
                This will move students from <span className="mono tnum">{fromYear}</span> to{' '}
                <span className="mono tnum">{toYear}</span>. Fee structures will be reset and new ones created.
                You can rollback this operation from the History tab if needed.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Metrics */}
      <div className="promo-metrics">
        <div className="promo-metric promo-metric--ok">
          <span className="promo-metric__label">Promoting</span>
          <span className="promo-metric__value">{summary?.totalPromoting || 0}</span>
        </div>
        <div className="promo-metric promo-metric--warn">
          <span className="promo-metric__label">Detained</span>
          <span className="promo-metric__value">{summary?.totalDetained || 0}</span>
        </div>
        <div className="promo-metric promo-metric--accent">
          <span className="promo-metric__label">Graduating</span>
          <span className="promo-metric__value">{summary?.totalGraduating || 0}</span>
        </div>
        <div className="promo-metric">
          <span className="promo-metric__label">Total</span>
          <span className="promo-metric__value">{total}</span>
        </div>
      </div>

      {/* Class-wise breakdown */}
      <Card shadow="sm" className="bg-surface border border-border-token">
        <CardBody className="p-4">
          <p className="text-sm font-semibold text-fg mb-3">Class-wise breakdown</p>
          <div className="space-y-1.5">
            {classMappings.map((m) => {
              const decisions = m.studentDecisions || [];
              const promoting = decisions.filter((d) => d.decision === 'promoted').length;
              const detained = decisions.filter((d) => d.decision === 'detained').length;
              const graduating = decisions.filter((d) => d.decision === 'graduated').length;
              const transferred = decisions.filter((d) => d.decision === 'transferred').length;

              return (
                <div key={m.fromClassId} className="cmap-row">
                  <div className="cmap-row__from">
                    <span className="cmap-row__class-name">
                      {m.fromClassName}{m.fromSection ? ` (${m.fromSection})` : ''}
                    </span>
                  </div>
                  <ArrowRight size={13} className="cmap-row__arrow" />
                  <span className="cmap-row__class-name flex-1">
                    {m.graduate ? 'Graduate' : m.toClassName}
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    {promoting > 0 && <span className="chip chip--ok mono tnum">{promoting}</span>}
                    {detained > 0 && <span className="chip chip--warn mono tnum">{detained}</span>}
                    {graduating > 0 && <span className="chip chip--accent mono tnum">{graduating}</span>}
                    {transferred > 0 && <span className="chip chip--info mono tnum">{transferred}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Options */}
      <Card shadow="sm" className="bg-surface border border-border-token">
        <CardBody className="p-4">
          <Checkbox
            isSelected={generateRolls}
            onChange={(e) => setGenerateRolls(e.target.checked)}
            size="sm"
          >
            <span className="text-sm text-fg">
              Auto-generate roll numbers for promoted students
            </span>
          </Checkbox>
        </CardBody>
      </Card>

      {/* Sticky foot */}
      <div className="promo-foot">
        <div className="promo-foot__progress">
          <span className="num">{total}</span>
          <span>students will be processed</span>
        </div>
        <div style={{ flex: 1 }} />
        <Button variant="flat" onPress={onBack}>
          Back
        </Button>
        <Button
          color="primary"
          onPress={openConfirmModal}
          isLoading={executing}
          startContent={!executing && <ArrowUpCircle size={16} />}
        >
          Execute Year-End Promotion
        </Button>
      </div>

      {/* Type-to-confirm modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="sm"
        classNames={{ backdrop: 'bg-black/40', base: 'bg-surface' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-divider py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-danger-bg rounded-lg">
                <AlertTriangle size={18} className="text-danger-token" />
              </div>
              <h3 className="text-base font-medium text-fg">
                Confirm Year-End Promotion
              </h3>
            </div>
          </ModalHeader>
          <ModalBody className="py-4 space-y-3">
            <p className="text-sm text-fg">
              This will permanently move all students from{' '}
              <strong className="mono tnum">{fromYear}</strong> to{' '}
              <strong className="mono tnum">{toYear}</strong> and reset
              current-year fee structures. This action cannot be undone without a rollback.
            </p>
            <p className="text-sm text-fg-muted">
              Type <strong className="text-danger-token">{CONFIRM_PHRASE}</strong> to proceed:
            </p>
            <Input
              autoFocus
              placeholder={CONFIRM_PHRASE}
              value={confirmText}
              onValueChange={setConfirmText}
              variant="bordered"
              size="sm"
              classNames={{ input: 'font-mono tracking-widest' }}
            />
          </ModalBody>
          <ModalFooter className="border-t border-divider">
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleExecute}
              isDisabled={confirmText !== CONFIRM_PHRASE}
              startContent={<ArrowUpCircle size={15} />}
            >
              Execute Promotion
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
