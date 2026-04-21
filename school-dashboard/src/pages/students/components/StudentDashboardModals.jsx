import { Suspense } from "react";
import {
  Button,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Drawer, DrawerContent, DrawerHeader, DrawerBody,
  Input, Select, SelectItem, Textarea,
} from "@heroui/react";
import { GraduationCap, Edit, BarChart3, Download, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import TCGeneratorModal from "../TCGeneratorModal";
import CertificateModal from "./modals/CertificateModal";
import MoveClassModal from "./modals/MoveClassModal";
import InvoicePrintModal from "./InvoicePrintModal";
import PhotoEditorModal from "../../../components/PhotoEditorModal";
import CameraCaptureModal from "../../../components/CameraCaptureModal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { formatShortDate } from "../../../utils/dateFormatter";
import { useCurrency } from '../../../context/hooks/useCurrency';
import { getNextClass } from "./StudentDashboardHelpers";

// ============================================================================
// STUDENT DASHBOARD MODALS
// All modal/drawer overlays: Edit, Payment, TC, Certificates, Promote, etc.
// ============================================================================

// Lazy-loaded AddStudent to keep initial bundle small
import lazyWithRetry from "../../../utils/lazyWithRetry";
const AddStudent = lazyWithRetry(() => import("../AddStudent"));

export default function StudentDashboardModals({
  // student data
  student,
  id,
  availableClasses,
  classesWithTeachers,
  studentFeeStructure,
  feeHistory,
  currentAcademicYear,
  results,
  attendanceStats,
  // edit drawer
  isEditOpen,
  onEditClose,
  editStudentRef,
  updateStudent,
  // payment modal
  isPaymentOpen,
  onPaymentClose,
  paymentForm,
  setPaymentForm,
  showPaymentConfirm,
  setShowPaymentConfirm,
  isRecordingPayment,
  onRecordPayment,
  // TC
  isTcOpen,
  onTcClose,
  // bonafide
  isBonafideOpen,
  onBonafideClose,
  // character
  isCharacterOpen,
  onCharacterClose,
  // move class
  isMoveClassOpen,
  setIsMoveClassOpen,
  refetchStudent,
  // invoice
  isInvoiceOpen,
  setIsInvoiceOpen,
  // promote
  isPromoteOpen,
  onPromoteClose,
  onPromoteStudent,
  // progress card
  isProgressOpen,
  onProgressClose,
  onProgressCardDownload,
  // reminder
  isReminderOpen,
  setIsReminderOpen,
  reminderMessage,
  setReminderMessage,
  onSendReminderMessage,
  // photo
  selectedImageForEdit,
  setSelectedImageForEdit,
  isPhotoEditorOpen,
  setIsPhotoEditorOpen,
  isCameraCaptureOpen,
  setIsCameraCaptureOpen,
  onPhotoSave,
  // delete
  isDeleteConfirmOpen,
  setIsDeleteConfirmOpen,
  isDeleting,
  onConfirmDelete,
}) {
  const { t } = useTranslation();
  const { fmt, currencySymbol } = useCurrency();

  return (
    <>
      {/* Edit Drawer */}
      {isEditOpen && (
        <Drawer
          isOpen={isEditOpen}
          onOpenChange={(open) => {
            if (!open) {
              if (editStudentRef.current) editStudentRef.current.attemptClose();
              else onEditClose();
            }
          }}
          placement="right"
          size="5xl"
          hideCloseButton
          classNames={{ wrapper: "!z-50", base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]" }}
        >
          <DrawerContent>
            {(onClose) => (
              <>
                <DrawerHeader className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-700 p-4">
                  <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg"><Edit size={18} className="text-gray-600 dark:text-zinc-400" /></div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{t('pages.editStudent1')}</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.updateStudentInformation1')}</p>
                  </div>
                </DrawerHeader>
                <DrawerBody className="p-0 overflow-auto">
                  <Suspense fallback={<div className="flex items-center justify-center h-40"><span className="text-sm text-gray-400 dark:text-zinc-500">{t('pages.loading')}</span></div>}>
                    <AddStudent
                      ref={editStudentRef}
                      onClose={onClose}
                      onSave={async (data) => { await updateStudent(id, data); onClose(); }}
                      classesWithTeachers={classesWithTeachers || []}
                      classOptions={availableClasses}
                      initialData={student}
                    />
                  </Suspense>
                </DrawerBody>
              </>
            )}
          </DrawerContent>
        </Drawer>
      )}

      {/* Payment Modal */}
      <Modal isOpen={isPaymentOpen} onClose={() => { onPaymentClose(); setShowPaymentConfirm(false); }} size="md">
        <ModalContent>
          <ModalHeader>{showPaymentConfirm ? t('pages.confirmPayment', 'Confirm Payment') : t('pages.recordFeePayment1')}</ModalHeader>
          <ModalBody>
            {showPaymentConfirm ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">{t('pages.reviewPaymentDetails', 'Please review the payment details before submitting:')}</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('pages.studentName', 'Student')}</span>
                    <span className="text-sm font-medium">{student?.firstName} {student?.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('pages.amount1')}</span>
                    <span className="text-lg font-semibold">{fmt(paymentForm.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('pages.paymentMethod1')}</span>
                    <span className="text-sm font-medium capitalize">{paymentForm.paymentMode === 'online' ? 'Online/UPI' : paymentForm.paymentMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('pages.paymentDate1')}</span>
                    <span className="text-sm font-medium">{formatShortDate(paymentForm.date)}</span>
                  </div>
                  <hr className="my-1" />
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('pages.balanceAfterPayment', 'Balance after payment')}</span>
                    <span className="text-sm font-medium">{fmt((studentFeeStructure?.totalBalance || 0) - parseFloat(paymentForm.amount))}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label={t('pages.amount1')}
                  type="number"
                  value={paymentForm.amount}
                  onValueChange={(val) => setPaymentForm({ ...paymentForm, amount: val })}
                  startContent={currencySymbol}
                  variant="bordered"
                  min={1}
                  max={studentFeeStructure?.totalBalance || 0}
                  description={`Outstanding: ${fmt(studentFeeStructure?.totalBalance)}`}
                  isInvalid={!!paymentForm.amount && parseInt(paymentForm.amount, 10) > (studentFeeStructure?.totalBalance || 0)}
                  errorMessage={`Max payable: ${fmt(studentFeeStructure?.totalBalance)}`}
                  isRequired
                />
                <Select
                  label={t('pages.paymentMethod1')}
                  placeholder={t('pages.selectMethod')}
                  selectedKeys={[paymentForm.paymentMode]}
                  onSelectionChange={(keys) => setPaymentForm({ ...paymentForm, paymentMode: Array.from(keys)[0] })}
                  variant="bordered"
                  isRequired
                >
                  <SelectItem key="cash">{t('pages.cash1')}</SelectItem>
                  <SelectItem key="online">Online/UPI</SelectItem>
                  <SelectItem key="card">{t('pages.card1')}</SelectItem>
                  <SelectItem key="cheque">{t('pages.cheque1')}</SelectItem>
                </Select>
                <Input
                  label={t('pages.paymentDate1')}
                  type="date"
                  value={paymentForm.date}
                  onValueChange={(val) => setPaymentForm({ ...paymentForm, date: val })}
                  variant="bordered"
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {showPaymentConfirm ? (
              <>
                <Button variant="light" onPress={() => setShowPaymentConfirm(false)}>{t('common.back', 'Back')}</Button>
                <Button className="bg-gray-900 text-white" onPress={onRecordPayment} isLoading={isRecordingPayment}>
                  {t('pages.confirmAndPay', 'Confirm & Pay')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="light" onPress={() => { onPaymentClose(); setShowPaymentConfirm(false); }}>{t('pages.cancel2')}</Button>
                <Button
                  className="bg-gray-900 text-white"
                  onPress={() => setShowPaymentConfirm(true)}
                  isDisabled={
                    !paymentForm.amount ||
                    !paymentForm.paymentMode ||
                    parseInt(paymentForm.amount, 10) <= 0 ||
                    parseInt(paymentForm.amount, 10) > (studentFeeStructure?.totalBalance || 0)
                  }
                >
                  {t('pages.reviewPayment', 'Review Payment')}
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* TC Modal */}
      <TCGeneratorModal isOpen={isTcOpen} onClose={onTcClose} students={[student]} />

      {/* Bonafide Certificate Modal */}
      <CertificateModal isOpen={isBonafideOpen} onClose={onBonafideClose} student={student} type="bonafide" />

      {/* Character Certificate Modal */}
      <CertificateModal isOpen={isCharacterOpen} onClose={onCharacterClose} student={student} type="character" />

      {/* Move Class Modal */}
      <MoveClassModal
        isOpen={isMoveClassOpen}
        onClose={() => setIsMoveClassOpen(false)}
        student={student}
        availableClasses={availableClasses}
        classObjects={classesWithTeachers || []}
        onMove={async () => { refetchStudent(); setIsMoveClassOpen(false); }}
      />

      {/* Invoice Modal */}
      <InvoicePrintModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        student={student}
        studentFeeStructure={studentFeeStructure}
        feeHistory={feeHistory}
      />

      {/* Promote Modal */}
      <Modal isOpen={isPromoteOpen} onClose={onPromoteClose} size="md">
        <ModalContent>
          <ModalHeader>{t('pages.promoteStudent')}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                <GraduationCap size={24} className="text-gray-600 dark:text-zinc-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">Student: <span className="font-semibold text-gray-900 dark:text-zinc-100">{student.name}</span></p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">Current Class: <span className="font-semibold text-gray-900 dark:text-zinc-100">{student.class}</span></p>
                </div>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">{t('pages.autoCalculatedNextClass')}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-zinc-100">{getNextClass(student.class, availableClasses) || "Unable to calculate"}</p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onPromoteClose}>{t('pages.cancel2')}</Button>
            <Button className="bg-gray-900 text-white" startContent={<GraduationCap size={16} />} onPress={onPromoteStudent}>{t('pages.promote')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Progress Card Modal */}
      <Modal isOpen={isProgressOpen} onClose={onProgressClose} size="md">
        <ModalContent>
          <ModalHeader>{t('pages.studentProgressCard1')}</ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-full">
                <BarChart3 size={48} className="text-gray-600 dark:text-zinc-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{student.name}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Class {student.class} • Roll {student.rollNo}</p>
              </div>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.generateAndDownloadTheDetailedAcademicPerformanceReportCard')}</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onProgressClose}>{t('pages.cancel2')}</Button>
            <Button className="bg-gray-900 text-white" startContent={<Download size={16} />} onPress={() => { onProgressCardDownload(); onProgressClose(); }}>
              {t('pages.download')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reminder Modal */}
      <Modal isOpen={isReminderOpen} onClose={() => setIsReminderOpen(false)} size="md">
        <ModalContent>
          <ModalHeader>{t('pages.sendFeeReminder1')}</ModalHeader>
          <ModalBody>
            <Textarea
              label={t('pages.message1')}
              value={reminderMessage}
              onValueChange={setReminderMessage}
              minRows={4}
              variant="bordered"
              placeholder={t('pages.enterReminderMessage')}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsReminderOpen(false)}>{t('pages.cancel2')}</Button>
            <Button className="bg-gray-900 text-white" startContent={<Send size={16} />} onPress={onSendReminderMessage}>{t('pages.sendReminder1')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Photo Editor */}
      {selectedImageForEdit && (
        <PhotoEditorModal
          isOpen={isPhotoEditorOpen}
          onClose={() => setIsPhotoEditorOpen(false)}
          imageSrc={selectedImageForEdit}
          onSave={onPhotoSave}
        />
      )}

      {/* Camera Capture */}
      <CameraCaptureModal
        isOpen={isCameraCaptureOpen}
        onClose={() => setIsCameraCaptureOpen(false)}
        onPhotoCaptured={(image) => {
          setSelectedImageForEdit(image);
          setIsCameraCaptureOpen(false);
          setIsPhotoEditorOpen(true);
        }}
      />

      {/* Delete Student Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={onConfirmDelete}
        title={t('confirm.deleteStudentTitle', 'Delete Student')}
        message={t('confirm.permanentDeleteStudent', { name: student?.name, defaultValue: `Are you sure you want to permanently delete ${student?.name}? This action cannot be undone.` })}
        confirmText={t('common.delete', 'Delete')}
        cancelText={t('common.cancel', 'Cancel')}
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
