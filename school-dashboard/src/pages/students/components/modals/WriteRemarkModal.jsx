import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Select, SelectItem, Input, Textarea } from "@heroui/react";
import toast from "react-hot-toast";

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
  const [form, setForm] = useState({
    type: "",
    title: "",
    description: "",
    sendToParent: false
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading("Saving remark...");

    try {
      const { request } = await import("../../../../services/api");
      const token = sessionStorage.getItem('app_user') ? JSON.parse(sessionStorage.getItem('app_user')).token : null;

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await request(`/students/${student.id}/remarks`, {
        method: 'POST',
        headers,
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
        <ModalHeader>Write a Remark</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Select
              label="Remark Type"
              placeholder="Select type"
              selectedKeys={form.type ? [form.type] : []}
              onSelectionChange={(keys) => setForm({ ...form, type: Array.from(keys)[0] })}
              variant="bordered"
            >
              <SelectItem key="academic">Academic</SelectItem>
              <SelectItem key="behavioral">Behavioral</SelectItem>
              <SelectItem key="achievement">Achievement</SelectItem>
              <SelectItem key="attendance">Attendance</SelectItem>
              <SelectItem key="general">General</SelectItem>
            </Select>

            <Input
              label="Title"
              placeholder="e.g. Excellent performance"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              variant="bordered"
              isRequired
            />

            <Textarea
              label="Description"
              placeholder="Enter detailed remark..."
              minRows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              variant="bordered"
              isRequired
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" className="border-gray-200 text-gray-700" onPress={onClose}>Cancel</Button>
          <Button className="bg-gray-900 hover:bg-gray-800 text-white" onPress={handleSave} isLoading={isSaving}>Save Remark</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
