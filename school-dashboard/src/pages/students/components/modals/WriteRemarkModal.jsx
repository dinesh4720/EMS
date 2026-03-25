import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Select, SelectItem, Input, Textarea } from "@heroui/react";
import toast from "react-hot-toast";
import { getAuthHeaders } from "../../../../utils/authSession";
import { useTranslation } from 'react-i18next';

/**
 * WriteRemarkModal - Modal for writing a remark for a student
 *
 * Props:
 * - isOpen: boolean - Whether modal is open
 * - onClose: function - Called when modal is closed
 * - student: object - The student to write remark for
 * - onSave: function - Called after successful save
 */
export default function WriteRemarkModal({ isOpen, onClose, student, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    type: "",
    title: "",
    description: "",
    sendToParent: false
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    const loadingToast = toast.loading(t('toast.loading.savingRemark'));

    try {
      const { request } = await import("../../../../services/api");

      await request(`/students/${student.id}/remarks`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.type || "general",
          sentToParent: form.sendToParent
        })
      });

      toast.success("Remark saved successfully", { id: loadingToast });

      if (onSave) {
        onSave();
      }
      onClose();
      setForm({ type: "", title: "", description: "", sendToParent: false });
      setErrors({});
    } catch (error) {
      console.error("Error saving remark:", error);
      toast.error("Failed to save remark: " + (error.message || "Unknown error"), { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader>{t('pages.writeARemark')}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Select
              label={t('pages.remarkType1')}
              placeholder={t('pages.selectType1')}
              selectedKeys={form.type ? [form.type] : []}
              onSelectionChange={(keys) => setForm({ ...form, type: Array.from(keys)[0] })}
              variant="bordered"
            >
              <SelectItem key="academic">{t('pages.academic1')}</SelectItem>
              <SelectItem key="behavioral">{t('pages.behavioral1')}</SelectItem>
              <SelectItem key="achievement">{t('pages.achievement1')}</SelectItem>
              <SelectItem key="attendance">{t('pages.attendance2')}</SelectItem>
              <SelectItem key="general">{t('pages.general1')}</SelectItem>
            </Select>

            <Input
              label={t('pages.title1')}
              placeholder="e.g. Excellent performance"
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                if (errors.title) setErrors((p) => ({ ...p, title: "" }));
              }}
              variant="bordered"
              isRequired
              isInvalid={!!errors.title}
              errorMessage={errors.title}
            />

            <Textarea
              label={t('pages.description1')}
              placeholder={t('pages.enterDetailedRemark')}
              minRows={4}
              value={form.description}
              onChange={(e) => {
                setForm({ ...form, description: e.target.value });
                if (errors.description) setErrors((p) => ({ ...p, description: "" }));
              }}
              variant="bordered"
              isRequired
              isInvalid={!!errors.description}
              errorMessage={errors.description}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" className="border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300" onPress={onClose}>{t('pages.cancel2')}</Button>
          <Button className="bg-gray-900 hover:bg-gray-800 text-white" onPress={handleSave} isLoading={isSaving}>{t('pages.saveRemark1')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
