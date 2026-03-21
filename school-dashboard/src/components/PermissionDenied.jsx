import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
  Checkbox,
  CheckboxGroup,
} from "@heroui/react";
import { ShieldAlert, ArrowLeft, Send, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { usePermissions } from "../context/PermissionContext";

const MODULE_LABELS = {
  dashboard: "Dashboard",
  staff: "Staff Management",
  students: "Students Management",
  classes: "Classes Management",
  academics: "Academics & Exams",
  attendance: "Attendance",
  timetable: "Timetable",
  fees: "Fee Management",
  payroll: "Payroll",
  messaging: "Messaging",
  reports: "Reports",
  settings: "Settings",
  "front-desk": "Front Desk"
};

const ACTION_LABELS = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete"
};

export default function PermissionDenied({ module, action, onRequestSubmitted }) {
  const navigate = useNavigate();
  const { requestPermission } = usePermissions();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    permissions: action ? [action] : [],
    reason: ""
  });

  const handleSubmitRequest = async () => {
    if (!formData.reason.trim()) {
      toast.error("Please provide a reason for your request");
      return;
    }

    if (formData.permissions.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    setLoading(true);

    try {
      const success = await requestPermission(module, formData.permissions, formData.reason);

      if (success) {
        setSubmitted(true);

        if (onRequestSubmitted) {
          onRequestSubmitted();
        }

        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setFormData({ permissions: action ? [action] : [], reason: "" });
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting permission request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardBody className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-4 bg-danger-100 dark:bg-danger-900/30 rounded-full">
              <ShieldAlert size={48} className="text-danger-600 dark:text-danger-400" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-zinc-400">
              You don't have permission to {action ? `${ACTION_LABELS[action].toLowerCase()}` : 'access'} the{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {MODULE_LABELS[module] || module}
              </span>{" "}
              module
            </p>
          </div>

          {/* Message */}
          <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-zinc-300">
              If you believe you should have access to this module, you can request permission from your administrator.
              Your request will be reviewed and you'll be notified once it's processed.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="bordered"
              startContent={<ArrowLeft size={16} />}
              onPress={() => navigate(-1)}
              className="transition-all duration-200"
            >
              Go Back
            </Button>
            <Button
              color="primary"
              startContent={<Send size={16} />}
              onPress={onOpen}
              className="transition-all duration-200"
            >
              Request Permission
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Request Permission Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            Request Permission for {MODULE_LABELS[module]}
          </ModalHeader>
          <ModalBody>
            {submitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-full">
                    <CheckCircle size={48} className="text-success-600 dark:text-success-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Request Submitted!
                  </h3>
                  <p className="text-gray-600 dark:text-zinc-400">
                    Your permission request has been sent to the administrator.
                    You'll be notified once it's reviewed.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Module Info */}
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-zinc-300">
                    <span className="font-semibold">Module:</span> {MODULE_LABELS[module]}
                  </p>
                </div>

                {/* Permissions Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
                    Select Permissions Needed
                  </label>
                  <CheckboxGroup
                    value={formData.permissions}
                    onValueChange={(value) => setFormData({ ...formData, permissions: value })}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(ACTION_LABELS).map(([key, label]) => (
                        <Checkbox size="sm" key={key} value={key}>
                          {label}
                        </Checkbox>
                      ))}
                    </div>
                  </CheckboxGroup>
                </div>

                {/* Reason */}
                <div>
                  <Textarea
                    label="Reason for Request"
                    placeholder="Please explain why you need this permission..."
                    value={formData.reason}
                    onValueChange={(value) => setFormData({ ...formData, reason: value })}
                    variant="bordered"
                    minRows={4}
                    isRequired
                  />
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
                    Provide a clear explanation to help the administrator review your request
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          {!submitted && (
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSubmitRequest}
                isLoading={loading}
                startContent={!loading && <Send size={16} />}
                className="transition-all duration-200"
              >
                Submit Request
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
