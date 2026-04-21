import { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Select, SelectItem, Textarea, Chip, Switch,
} from "@heroui/react";
import { libraryApi } from "../../services/api";
import toast from "react-hot-toast";
import { getDateLocale } from '../../i18n/index';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '../../utils/constants';


const CONDITIONS = [
  { key: "new", label: "New" },
  { key: "good", label: "Good" },
  { key: "fair", label: "Fair" },
  { key: "worn", label: "Worn" },
  { key: "damaged", label: "Damaged" },
  { key: "lost", label: "Lost" },
];

export default function ReturnBookModal({ isOpen, onClose, issue, onSaved }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ returnCondition: "good", finePaid: false, notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({ returnCondition: "good", finePaid: false, notes: "" });
    }
  }, [isOpen]);

  if (!issue) return null;

  const isOverdue = new Date(issue.dueDate) < new Date();
  const daysLate = isOverdue ? Math.ceil((new Date() - new Date(issue.dueDate)) / (1000 * 60 * 60 * 24)) : 0;
  // Clamp fine to non-negative and cap at configurable ceiling
  const MAX_FINE = APP_CONFIG.MAX_LIBRARY_FINE;
  const rawFine = issue.accruedFine || (daysLate * (issue.finePerDay || 0));
  const accruedFine = Math.min(Math.max(0, rawFine), MAX_FINE);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    try {
      setSaving(true);
      await libraryApi.returnBook(issue._id, {
        returnCondition: form.returnCondition,
        finePaid: form.finePaid,
        ...(form.notes.trim() && { notes: form.notes.trim() }),
      });
      toast.success(t('toast.success.bookReturnedSuccessfully'));
      onSaved?.();
    } catch (err) {
      toast.error(err?.message || "Failed to return book");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader>{t('pages.returnBook')}</ModalHeader>
        <ModalBody className="gap-4">
          {/* Book info */}
          <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-3 space-y-1">
            <p className="font-medium text-gray-900 dark:text-zinc-100">{issue.bookId?.title || issue.bookTitle}</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Issued to: {issue.studentId?.name || issue.studentName || "Unknown"}
            </p>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Due: {issue.dueDate ? new Date(issue.dueDate).toLocaleDateString(getDateLocale(), { day: "2-digit", month: "short", year: "numeric" }) : '—'}
            </p>
            {isOverdue && (
              <div className="flex items-center gap-2 pt-1">
                <Chip size="sm" color="danger" variant="flat">{daysLate} days overdue</Chip>
                {accruedFine > 0 && (
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">Fine: ₹{accruedFine}</span>
                )}
              </div>
            )}
          </div>

          <Select
            label={t('pages.returnCondition')}
            selectedKeys={[form.returnCondition]}
            onSelectionChange={(keys) => setForm((f) => ({ ...f, returnCondition: [...keys][0] }))}
          >
            {CONDITIONS.map((c) => <SelectItem key={c.key}>{c.label}</SelectItem>)}
          </Select>

          {accruedFine > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-zinc-300">Fine paid (₹{accruedFine})?</span>
              <Switch
                isSelected={form.finePaid}
                onValueChange={(v) => setForm((f) => ({ ...f, finePaid: v }))}
                size="sm"
              />
            </div>
          )}

          <Textarea
            label={t('pages.notes1')}
            value={form.notes}
            onValueChange={(v) => setForm((f) => ({ ...f, notes: v }))}
            minRows={2}
            placeholder={t('pages.optionalNotesAboutTheReturn')}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>{t('pages.cancel2')}</Button>
          <Button color="success" isLoading={saving} onPress={handleSubmit}>
            Confirm Return
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
