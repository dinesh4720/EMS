import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

/**
 * MarkAlumniModal - Modal for marking a student as alumni
 *
 * Props:
 * - isOpen: boolean - Whether modal is open
 * - onClose: function - Called when modal is closed
 * - student: object - The student to mark as alumni
 * - onMark: function - Called after successful mark
 */
export default function MarkAlumniModal({ isOpen, onClose, student, onMark }) {
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkAsAlumni = async () => {
    setIsMarking(true);
    const loadingToast = toast.loading("Marking student as alumni...");

    try {
      const { request } = await import("../../../../services/api");
      const token = sessionStorage.getItem('app_user') ? JSON.parse(sessionStorage.getItem('app_user')).token : null;

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await request(`/students/${student.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          ...student,
          status: "alumni",
          class: "Alumni"
        })
      });

      toast.success(`${student.name} marked as alumni`, { id: loadingToast });

      if (onMark) {
        onMark();
      }
      onClose();
    } catch (error) {
      console.error("Error marking as alumni:", error);
      toast.error("Failed to mark as alumni: " + (error.message || "Unknown error"), { id: loadingToast });
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>Mark as Alumni</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-gray-600 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-gray-900">Confirm Action</p>
                <p className="text-sm text-gray-600 mt-1">
                  This will change {student?.name}'s status to "Alumni". The student will no longer appear in active student lists.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="bordered" className="border-gray-200 text-gray-700" onPress={onClose}>Cancel</Button>
        <Button className="bg-gray-900 hover:bg-gray-800 text-white" onPress={handleMarkAsAlumni} isLoading={isMarking}>Confirm</Button>
      </ModalFooter>
    </Modal>
  );
}
