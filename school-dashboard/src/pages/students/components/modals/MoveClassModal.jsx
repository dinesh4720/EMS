import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Select, SelectItem } from "@heroui/react";
import toast from "react-hot-toast";

/**
 * MoveClassModal - Modal for moving a student to another class/section
 *
 * Props:
 * - isOpen: boolean - Whether modal is open
 * - onClose: function - Called when modal is closed
 * - student: object - The student to move
 * - availableClasses: array - List of available classes
 * - onMove: function - Called after successful move with new class
 */
export default function MoveClassModal({ isOpen, onClose, student, availableClasses = [], onMove }) {
  const [newClass, setNewClass] = useState("");
  const [isMoving, setIsMoving] = useState(false);

  const handleMove = async () => {
    if (!newClass) {
      toast.error("Please select a new class");
      return;
    }

    setIsMoving(true);
    const loadingToast = toast.loading("Moving student to new class...");

    try {
      const { request } = await import("../../../../services/api");
      const token = sessionStorage.getItem('app_user') ? JSON.parse(sessionStorage.getItem('app_user')).token : null;

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await request(`/students/${student.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ classId: newClass })
      });

      toast.success(`Student moved to ${newClass}`, { id: loadingToast });

      if (onMove) {
        onMove(newClass);
      }
      onClose();
    } catch (error) {
      console.error("Error moving student:", error);
      toast.error("Failed to move student: " + (error.message || "Unknown error"), { id: loadingToast });
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader>Move to Another Class/Section</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Current Class: <span className="font-semibold text-gray-900">{student?.class || "N/A"}</span></p>
            </div>

            <Select
              label="Select New Class"
              placeholder="Choose a class"
              selectedKeys={newClass ? [newClass] : []}
              onSelectionChange={(keys) => setNewClass(Array.from(keys)[0])}
              variant="bordered"
            >
              {availableClasses.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  {cls}
                </SelectItem>
              ))}
            </Select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" className="border-gray-200 text-gray-700" onPress={onClose}>Cancel</Button>
          <Button className="bg-gray-900 hover:bg-gray-800 text-white" onPress={handleMove} isLoading={isMoving}>Move Student</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
