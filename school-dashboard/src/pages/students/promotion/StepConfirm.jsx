import { useState, useEffect } from 'react';
import {
  Card, CardBody, Button, Checkbox, Chip,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, useDisclosure,
} from '@heroui/react';
import {
  AlertTriangle, ArrowUpCircle, GraduationCap, Minus, ArrowRight,
} from 'lucide-react';
import { promotionApi } from '../../../services/api/extensions';
import toast from 'react-hot-toast';

export default function StepConfirm({ onNext, onBack, wizardState, setWizardState }) {
  const [executing, setExecuting] = useState(false);
  const [generateRolls, setGenerateRolls] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const CONFIRM_PHRASE = 'CONFIRM';

  // AUDIT-111: Nav guard -- warn on browser close/refresh before promotion is executed
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

  const openConfirmModal = () => {
    setConfirmText('');
    onOpen();
  };

  const handleExecute = async () => {
    onClose();
    setExecuting(true);
    try {
      // Build the execute-all payload
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
    <div className="space-y-5">
      {/* Warning banner */}
      <Card shadow="sm" className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
        <CardBody className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Confirm Year-End Promotion
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                This will move students from {fromYear} to {toYear}. Fee structures will be reset
                and new ones created. You can rollback this operation from the History tab if needed.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Summary totals */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-lg p-3 text-center">
          <ArrowUpCircle size={20} className="text-green-600 dark:text-green-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{summary?.totalPromoting || 0}</p>
          <p className="text-xs text-green-600 dark:text-green-400">Promoting</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900 rounded-lg p-3 text-center">
          <Minus size={20} className="text-yellow-600 dark:text-yellow-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{summary?.totalDetained || 0}</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400">Detained</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 rounded-lg p-3 text-center">
          <GraduationCap size={20} className="text-purple-600 dark:text-purple-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{summary?.totalGraduating || 0}</p>
          <p className="text-xs text-purple-600 dark:text-purple-400">Graduating</p>
        </div>
        <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-700 dark:text-zinc-300 mt-5">
            {(summary?.totalPromoting || 0) + (summary?.totalDetained || 0) + (summary?.totalGraduating || 0) + (summary?.totalTransferred || 0)}
          </p>
          <p className="text-xs text-gray-500 dark:text-zinc-400">Total Students</p>
        </div>
      </div>

      {/* Class-wise breakdown */}
      <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
        <CardBody className="p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">Class-wise Breakdown</p>
          <div className="space-y-2">
            {classMappings.map((m) => {
              const decisions = m.studentDecisions || [];
              const promoting = decisions.filter((d) => d.decision === 'promoted').length;
              const detained = decisions.filter((d) => d.decision === 'detained').length;
              const graduating = decisions.filter((d) => d.decision === 'graduated').length;
              const transferred = decisions.filter((d) => d.decision === 'transferred').length;

              return (
                <div
                  key={m.fromClassId}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                        {m.fromClassName}{m.fromSection ? ` (${m.fromSection})` : ''}
                      </span>
                      <ArrowRight size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-zinc-400">
                        {m.graduate ? 'Graduate' : m.toClassName}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {promoting > 0 && (
                      <Chip size="sm" variant="flat" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        {promoting}
                      </Chip>
                    )}
                    {detained > 0 && (
                      <Chip size="sm" variant="flat" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                        {detained}
                      </Chip>
                    )}
                    {graduating > 0 && (
                      <Chip size="sm" variant="flat" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {graduating}
                      </Chip>
                    )}
                    {transferred > 0 && (
                      <Chip size="sm" variant="flat" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {transferred}
                      </Chip>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Options */}
      <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
        <CardBody className="p-4">
          <Checkbox
            isSelected={generateRolls}
            onChange={(e) => setGenerateRolls(e.target.checked)}
            size="sm"
          >
            <span className="text-sm text-gray-700 dark:text-zinc-300">
              Auto-generate roll numbers for promoted students
            </span>
          </Checkbox>
        </CardBody>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="flat" onPress={onBack}>
          Back
        </Button>
        <Button
          color="primary"
          className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
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
        classNames={{ backdrop: 'bg-black/40', base: 'bg-white dark:bg-zinc-950' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-950 rounded-lg">
                <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 dark:text-zinc-100">
                Confirm Year-End Promotion
              </h3>
            </div>
          </ModalHeader>
          <ModalBody className="py-4 space-y-3">
            <p className="text-sm text-gray-700 dark:text-zinc-300">
              This will permanently move all students from{' '}
              <strong>{fromYear}</strong> to <strong>{toYear}</strong> and reset
              current-year fee structures. This action cannot be undone without a rollback.
            </p>
            <p className="text-sm text-gray-600 dark:text-zinc-400">
              Type <strong className="text-red-600 dark:text-red-400">{CONFIRM_PHRASE}</strong> to proceed:
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
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
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
