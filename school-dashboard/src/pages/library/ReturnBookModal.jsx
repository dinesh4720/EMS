import { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Select, SelectItem, Textarea, Chip, Switch,
} from "@heroui/react";
import { libraryApi } from "../../services/api";
import toast from "react-hot-toast";

const CONDITIONS = [
  { key: "new", label: "New" },
  { key: "good", label: "Good" },
  { key: "fair", label: "Fair" },
  { key: "worn", label: "Worn" },
  { key: "damaged", label: "Damaged" },
  { key: "lost", label: "Lost" },
];

export default function ReturnBookModal({ isOpen, onClose, issue, onSaved }) {
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
  const accruedFine = issue.accruedFine || (daysLate * (issue.finePerDay || 0));

  const handleSubmit = async () => {
    try {
      setSaving(true);
      await libraryApi.returnBook(issue._id, {
        returnCondition: form.returnCondition,
        finePaid: form.finePaid,
        ...(form.notes.trim() && { notes: form.notes.trim() }),
      });
      toast.success("Book returned successfully");
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
        <ModalHeader>Return Book</ModalHeader>
        <ModalBody className="gap-4">
          {/* Book info */}
          <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-3 space-y-1">
            <p className="font-medium text-gray-900 dark:text-zinc-100">{issue.bookId?.title || issue.bookTitle}</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Issued to: {issue.studentId?.name || "Unknown"}
            </p>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Due: {new Date(issue.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
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
            label="Return Condition"
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
            label="Notes"
            value={form.notes}
            onValueChange={(v) => setForm((f) => ({ ...f, notes: v }))}
            minRows={2}
            placeholder="Optional notes about the return..."
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>Cancel</Button>
          <Button color="success" isLoading={saving} onPress={handleSubmit}>
            Confirm Return
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
