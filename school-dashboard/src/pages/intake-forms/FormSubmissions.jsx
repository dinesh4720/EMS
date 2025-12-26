import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
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
  Eye,
  CheckCircle,
  XCircle,
  MoreVertical,
  Download,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { intakeFormsApi } from "../../services/api";
import { format } from "date-fns";

export default function FormSubmissions() {
  const {
    isOpen: isReviewOpen,
    onOpen: onReviewOpen,
    onClose: onReviewClose,
  } = useDisclosure();

  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, [filterStatus]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const status = filterStatus === "all" ? null : filterStatus;
      const data = await intakeFormsApi.getSubmissions(null, status);
      setSubmissions(data);
    } catch (error) {
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmission = async (submissionId) => {
    try {
      const data = await intakeFormsApi.getSubmission(submissionId);
      setSelectedSubmission(data);
      setReviewNotes(data.reviewNotes || "");
      onReviewOpen();
    } catch (error) {
      toast.error("Failed to load submission details");
    }
  };

  const handleReview = async (status) => {
    if (!selectedSubmission) return;

    if (status === "rejected" && !reviewNotes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setLoading(true);
      await intakeFormsApi.reviewSubmission(selectedSubmission.id, {
        status,
        notes: reviewNotes,
        reviewedBy: "admin", // TODO: Get from auth context
      });

      toast.success(
        status === "approved"
          ? "Submission approved! Staff record created."
          : "Submission rejected"
      );

      onReviewClose();
      fetchSubmissions();
      setSelectedSubmission(null);
      setReviewNotes("");
    } catch (error) {
      toast.error(error.message || "Failed to review submission");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
    };
    return colors[status] || "default";
  };

  const renderFieldValue = (field, value) => {
    if (!value) return <span className="text-gray-400">Not provided</span>;

    if (field.type === "file") {
      return (
        <Button
          size="sm"
          variant="flat"
          startContent={<Download size={14} />}
          as="a"
          href={value}
          target="_blank"
        >
          Download File
        </Button>
      );
    }

    if (typeof value === "object") {
      return <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>;
    }

    return <span>{value}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Form Submissions
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve staff onboarding submissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["pending", "approved", "rejected", "all"].map((status) => (
          <Button
            key={status}
            size="sm"
            variant={filterStatus === status ? "solid" : "flat"}
            color={filterStatus === status ? "primary" : "default"}
            onPress={() => setFilterStatus(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Submissions Table */}
      <Card>
        <CardBody className="p-0">
          <Table
            aria-label="Form submissions table"
            removeWrapper
            classNames={{
              th: "bg-gray-50 text-gray-700 font-semibold",
              td: "py-4",
            }}
          >
            <TableHeader>
              <TableColumn>FORM NAME</TableColumn>
              <TableColumn>SUBMITTED BY</TableColumn>
              <TableColumn>SUBMITTED DATE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>REVIEWED BY</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              items={submissions}
              emptyContent="No submissions found"
              loadingContent={<Spinner />}
              isLoading={loading}
            >
              {(submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {submission.formName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {submission.formType}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{submission.submittedBy}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(
                        new Date(submission.submittedAt),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="dot"
                      color={getStatusColor(submission.reviewStatus)}
                    >
                      {submission.reviewStatus}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {submission.reviewedBy || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Submission actions">
                        <DropdownItem
                          key="view"
                          startContent={<Eye size={16} />}
                          onPress={() => handleViewSubmission(submission.id)}
                        >
                          Review Submission
                        </DropdownItem>
                        {submission.staffId && (
                          <DropdownItem
                            key="staff"
                            startContent={<User size={16} />}
                            onPress={() =>
                              (window.location.href = `/staff/${submission.staffId}`)
                            }
                          >
                            View Staff Record
                          </DropdownItem>
                        )}
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Review Submission Modal */}
      <Modal
        isOpen={isReviewOpen}
        onClose={onReviewClose}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <div>
              <h3 className="text-xl font-semibold">Review Submission</h3>
              {selectedSubmission && (
                <p className="text-sm text-gray-600 font-normal mt-1">
                  {selectedSubmission.form?.formName} - Submitted by{" "}
                  {selectedSubmission.submittedBy}
                </p>
              )}
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedSubmission && (
              <div className="space-y-6">
                {/* Submission Data */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">
                    Submitted Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSubmission.form?.fields?.map((field) => (
                      <div
                        key={field.id}
                        className={`${
                          field.type === "textarea" || field.type === "file"
                            ? "col-span-2"
                            : "col-span-1"
                        }`}
                      >
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          {field.label}
                          {field.required && (
                            <span className="text-danger ml-1">*</span>
                          )}
                        </label>
                        <div className="text-sm text-gray-900">
                          {renderFieldValue(
                            field,
                            selectedSubmission.submissionData[field.mapTo || field.label]
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review Section */}
                {selectedSubmission.reviewStatus === "pending" && (
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold mb-4">
                      Review Decision
                    </h4>
                    <Textarea
                      label="Review Notes"
                      placeholder="Add notes about this submission (required for rejection)"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      minRows={3}
                    />
                  </div>
                )}

                {/* Existing Review */}
                {selectedSubmission.reviewStatus !== "pending" && (
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold mb-4">
                      Review Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Status
                        </label>
                        <div className="mt-1">
                          <Chip
                            size="sm"
                            variant="dot"
                            color={getStatusColor(
                              selectedSubmission.reviewStatus
                            )}
                          >
                            {selectedSubmission.reviewStatus}
                          </Chip>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Reviewed By
                        </label>
                        <p className="text-sm">
                          {selectedSubmission.reviewedBy}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Reviewed At
                        </label>
                        <p className="text-sm">
                          {format(
                            new Date(selectedSubmission.reviewedAt),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </p>
                      </div>
                      {selectedSubmission.reviewNotes && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Notes
                          </label>
                          <p className="text-sm">
                            {selectedSubmission.reviewNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedSubmission?.reviewStatus === "pending" ? (
              <>
                <Button variant="light" onPress={onReviewClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  variant="flat"
                  startContent={<XCircle size={16} />}
                  onPress={() => handleReview("rejected")}
                  isLoading={loading}
                >
                  Reject
                </Button>
                <Button
                  color="success"
                  startContent={<CheckCircle size={16} />}
                  onPress={() => handleReview("approved")}
                  isLoading={loading}
                >
                  Approve & Create Staff
                </Button>
              </>
            ) : (
              <Button onPress={onReviewClose}>Close</Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
