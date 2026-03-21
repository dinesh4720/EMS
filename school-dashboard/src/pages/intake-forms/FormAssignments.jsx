import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  Send,
  MoreVertical,
  Eye,
  RefreshCw,
  Trash2,
  Copy,
  QrCode,
} from "lucide-react";
import toast from "react-hot-toast";
import { intakeFormsApi } from "../../services/api";
import { format } from "date-fns";

export default function FormAssignments() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();

  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [forms, setForms] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const [assignmentData, setAssignmentData] = useState({
    formId: "",
    emails: "",
    phones: "",
    expiresInDays: 30,
  });

  useEffect(() => {
    fetchForms();
    fetchAssignments();
  }, [filterStatus]);

  const fetchForms = async () => {
    try {
      const data = await intakeFormsApi.getAll("staff", "active");
      setForms(data);
    } catch (error) {
      toast.error("Failed to load forms");
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const status = filterStatus === "all" ? null : filterStatus;
      const data = await intakeFormsApi.getAssignments(null, status);
      setAssignments(data);
    } catch (error) {
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignmentData.formId) {
      toast.error("Please select a form");
      return;
    }

    const emails = assignmentData.emails
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter(Boolean);
    const phones = assignmentData.phones
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (emails.length === 0 && phones.length === 0) {
      toast.error("Please provide at least one email or phone number");
      return;
    }

    try {
      setLoading(true);
      await intakeFormsApi.assign(assignmentData.formId, {
        emails,
        phones,
        expiresInDays: assignmentData.expiresInDays,
        assignedBy: "admin", // TODO: Get from auth context
      });

      toast.success(
        `Form assigned to ${emails.length + phones.length} recipient(s)`
      );
      onClose();
      fetchAssignments();
      setAssignmentData({
        formId: "",
        emails: "",
        phones: "",
        expiresInDays: 30,
      });
    } catch (error) {
      toast.error(error.message || "Failed to assign form");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (assignmentId) => {
    try {
      await intakeFormsApi.resendAssignment(assignmentId);
      toast.success("Notification resent successfully");
    } catch (error) {
      toast.error("Failed to resend notification");
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!confirm("Are you sure you want to cancel this assignment?")) return;

    try {
      await intakeFormsApi.deleteAssignment(assignmentId);
      toast.success("Assignment cancelled");
      fetchAssignments();
    } catch (error) {
      toast.error("Failed to cancel assignment");
    }
  };

  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    onDetailsOpen();
  };

  const copyAccessLink = (token) => {
    const link = `${window.location.origin}/form/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      in_progress: "primary",
      submitted: "success",
      approved: "success",
      rejected: "danger",
    };
    return colors[status] || "default";
  };

  const filteredAssignments = assignments;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
            Form Assignments
          </h2>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            Manage and track form assignments sent to teachers
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Send size={16} />}
          onPress={onOpen}
        >
          Assign Form
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "pending", "submitted", "approved", "rejected"].map(
          (status) => (
            <Button
              key={status}
              size="sm"
              variant={filterStatus === status ? "solid" : "flat"}
              color={filterStatus === status ? "primary" : "default"}
              onPress={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          )
        )}
      </div>

      {/* Assignments Table */}
      <Card>
        <CardBody className="p-0">
          <Table
            aria-label="Form assignments table"
            removeWrapper
            classNames={{
              th: "bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 font-semibold",
              td: "py-4",
            }}
          >
            <TableHeader>
              <TableColumn>FORM NAME</TableColumn>
              <TableColumn>ASSIGNED TO</TableColumn>
              <TableColumn>ASSIGNED BY</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ASSIGNED DATE</TableColumn>
              <TableColumn>EXPIRES</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              items={filteredAssignments}
              emptyContent="No assignments found"
              loadingContent={<Spinner />}
              isLoading={loading}
            >
              {(assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900 dark:text-zinc-100">
                      {assignment.formName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-500">
                      {assignment.formType}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{assignment.assignedTo}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{assignment.assignedBy}</div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="dot"
                      color={getStatusColor(assignment.status)}
                    >
                      {assignment.status}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(assignment.assignedAt), "MMM dd, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(assignment.expiresAt), "MMM dd, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Assignment actions">
                        <DropdownItem
                          key="view"
                          startContent={<Eye size={16} />}
                          onPress={() => handleViewDetails(assignment)}
                        >
                          View Details
                        </DropdownItem>
                        <DropdownItem
                          key="copy"
                          startContent={<Copy size={16} />}
                          onPress={() => copyAccessLink(assignment.accessToken)}
                        >
                          Copy Link
                        </DropdownItem>
                        <DropdownItem
                          key="resend"
                          startContent={<RefreshCw size={16} />}
                          onPress={() => handleResend(assignment.id)}
                        >
                          Resend Notification
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          startContent={<Trash2 size={16} />}
                          onPress={() => handleDelete(assignment.id)}
                        >
                          Cancel Assignment
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Assign Form Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Assign Form</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block dark:text-zinc-300">
                  Select Form
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 dark:text-zinc-100"
                  value={assignmentData.formId}
                  onChange={(e) =>
                    setAssignmentData({
                      ...assignmentData,
                      formId: e.target.value,
                    })
                  }
                >
                  <option value="">Choose a form...</option>
                  {forms.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.formName}
                    </option>
                  ))}
                </select>
              </div>

              <Textarea
                label="Email Addresses"
                placeholder="Enter email addresses (one per line or comma-separated)"
                value={assignmentData.emails}
                onChange={(e) =>
                  setAssignmentData({
                    ...assignmentData,
                    emails: e.target.value,
                  })
                }
                minRows={3}
                description="Example: teacher1@school.com, teacher2@school.com"
              />

              <Textarea
                label="Phone Numbers"
                placeholder="Enter phone numbers (one per line or comma-separated)"
                value={assignmentData.phones}
                onChange={(e) =>
                  setAssignmentData({
                    ...assignmentData,
                    phones: e.target.value,
                  })
                }
                minRows={3}
                description="Example: +919876543210, +919876543211"
              />

              <Input
                type="number"
                label="Expires In (Days)"
                value={assignmentData.expiresInDays}
                onChange={(e) =>
                  setAssignmentData({
                    ...assignmentData,
                    expiresInDays: parseInt(e.target.value),
                  })
                }
                min={1}
                max={365}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAssign}
              isLoading={loading}
            >
              Assign Form
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Assignment Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="lg">
        <ModalContent>
          <ModalHeader>Assignment Details</ModalHeader>
          <ModalBody>
            {selectedAssignment && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                    Form Name
                  </label>
                  <p className="text-base font-semibold">
                    {selectedAssignment.formName}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                    Assigned To
                  </label>
                  <p className="text-base">{selectedAssignment.assignedTo}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                    Access Link
                  </label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={`${window.location.origin}/form/${selectedAssignment.accessToken}`}
                      readOnly
                      size="sm"
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      onPress={() =>
                        copyAccessLink(selectedAssignment.accessToken)
                      }
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                    Status
                  </label>
                  <div className="mt-1">
                    <Chip
                      size="sm"
                      variant="dot"
                      color={getStatusColor(selectedAssignment.status)}
                    >
                      {selectedAssignment.status}
                    </Chip>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Assigned Date
                    </label>
                    <p className="text-sm">
                      {format(
                        new Date(selectedAssignment.assignedAt),
                        "MMM dd, yyyy"
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Expires On
                    </label>
                    <p className="text-sm">
                      {format(
                        new Date(selectedAssignment.expiresAt),
                        "MMM dd, yyyy"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={onDetailsClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
