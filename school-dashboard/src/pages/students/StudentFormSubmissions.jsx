import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Edit,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import { intakeFormsApi } from "../../services/api";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';

export default function StudentFormSubmissions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    isOpen: isReviewOpen,
    onOpen: onReviewOpen,
    onClose: onReviewClose,
  } = useDisclosure();

  const {
    isOpen: isEditRequestOpen,
    onOpen: onEditRequestOpen,
    onClose: onEditRequestClose,
  } = useDisclosure();

  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [reviewNotes, setReviewNotes] = useState("");
  const [editRequestNotes, setEditRequestNotes] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, [filterStatus]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const status = filterStatus === "all" ? null : filterStatus;

      // Get all submissions and filter for student forms
      const data = await intakeFormsApi.getSubmissions(null, status);
      const studentSubmissions = data.filter(
        (s) => s.formType === "student" || s.form?.formType === "student"
      );
      setSubmissions(studentSubmissions);
    } catch (error) {
      toast.error(t('toast.error.failedToLoadSubmissions'));
      console.error(error);
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
      toast.error(t('toast.error.failedToLoadSubmissionDetails'));
    }
  };

  const handleReview = async (status) => {
    if (!selectedSubmission) return;

    if (status === "rejected" && !reviewNotes.trim()) {
      toast.error(t('toast.error.pleaseProvideAReasonForRejection'));
      return;
    }

    try {
      setLoading(true);
      await intakeFormsApi.reviewSubmission(selectedSubmission.id, {
        reviewStatus: status,
        reviewNotes: reviewNotes,
        reviewedBy: "admin", // TODO: Get from auth context
      });

      toast.success(
        status === "approved"
          ? "Submission approved! Student record created."
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

  const handleRequestEdit = async () => {
    if (!selectedSubmission) return;

    if (!editRequestNotes.trim()) {
      toast.error(t('toast.error.pleaseProvideNotesOnWhatNeedsToBeEdited'));
      return;
    }

    try {
      setLoading(true);
      // Request edit using dedicated endpoint
      await intakeFormsApi.requestEdit(selectedSubmission.id, {
        notes: editRequestNotes,
        requestedBy: "admin",
      });

      toast.success(t('toast.success.editRequestSentToParentTheyCanUpdateAndResubmit'));

      onEditRequestClose();
      onReviewClose();
      fetchSubmissions();
      setSelectedSubmission(null);
      setEditRequestNotes("");
    } catch (error) {
      toast.error(error.message || "Failed to request edit");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
      needs_revision: "secondary",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending Review",
      approved: "Approved",
      rejected: "Rejected",
      needs_revision: "Needs Revision",
    };
    return labels[status] || status;
  };

  const renderFieldValue = (field, value) => {
    if (!value) return <span className="text-gray-400 dark:text-zinc-500">{t('pages.notProvided1')}</span>;

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

  // Extract student name from submission data
  const getStudentName = (submission) => {
    const data = submission.submissionData;
    return data["Student Name"] || data["studentName"] || data["name"] || "N/A";
  };

  // Extract parent contact from submission data
  const getParentContact = (submission) => {
    const data = submission.submissionData;
    return (
      data["Parent Email"] ||
      data["parentEmail"] ||
      data["Email"] ||
      data["email"] ||
      "N/A"
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
            Student Admission Submissions
          </h2>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            Review and approve student admission form submissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["pending", "needs_revision", "approved", "rejected", "all"].map(
          (status) => (
            <Button
              key={status}
              size="sm"
              variant={filterStatus === status ? "solid" : "flat"}
              color={filterStatus === status ? "primary" : "default"}
              onPress={() => setFilterStatus(status)}
            >
              {status === "needs_revision"
                ? "Needs Revision"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          )
        )}
      </div>

      {/* Submissions Table */}
      <Card>
        <CardBody className="p-0">
          <Table
            aria-label={t('aria.tables.studentFormSubmissions')}
            removeWrapper
            classNames={{
              th: "bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold",
              td: "py-4",
            }}
          >
            <TableHeader>
              <TableColumn scope="col">{t('pages.fORMName')}</TableColumn>
              <TableColumn scope="col">{t('pages.sTUDENTName')}</TableColumn>
              <TableColumn scope="col">{t('pages.pARENTContact')}</TableColumn>
              <TableColumn scope="col">{t('pages.sUBMITTEDDate')}</TableColumn>
              <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
              <TableColumn scope="col">{t('pages.aCTIONS')}</TableColumn>
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
                    <div className="font-medium text-gray-900 dark:text-zinc-100">
                      {submission.formName || submission.form?.formName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400">
                      {submission.formType || submission.form?.formType}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <User size={16} className="text-primary-600" />
                      </div>
                      <div className="text-sm font-medium">
                        {getStudentName(submission)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{getParentContact(submission)}</div>
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
                      {getStatusLabel(submission.reviewStatus)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label={t('aria.menus.submissionActions')}>
                        <DropdownItem
                          key="view"
                          startContent={<Eye size={16} />}
                          onPress={() => handleViewSubmission(submission.id)}
                        >
                          Review Submission
                        </DropdownItem>
                        {submission.studentId && (
                          <DropdownItem
                            key="student"
                            startContent={<User size={16} />}
                            onPress={() =>
                              navigate(`/students/${submission.studentId}`)
                            }
                          >
                            View Student Record
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
              <h3 className="text-xl font-semibold">{t('pages.reviewAdmissionSubmission')}</h3>
              {selectedSubmission && (
                <p className="text-sm text-gray-600 dark:text-zinc-400 font-normal mt-1">
                  {selectedSubmission.formId?.formName || selectedSubmission.formName} -{" "}
                  {getStudentName(selectedSubmission)}
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
                    {selectedSubmission.formId?.fields?.map((field) => (
                      <div
                        key={field.id}
                        className={`${
                          field.type === "textarea" || field.type === "file"
                            ? "col-span-2"
                            : "col-span-1"
                        }`}
                      >
                        <label className="text-sm font-medium text-gray-600 dark:text-zinc-400 block mb-1">
                          {field.label}
                          {field.required && (
                            <span className="text-danger ml-1">*</span>
                          )}
                        </label>
                        <div className="text-sm text-gray-900 dark:text-zinc-100">
                          {renderFieldValue(
                            field,
                            selectedSubmission.submissionData[
                              field.mapTo || field.label
                            ]
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review Section - Only for pending submissions */}
                {selectedSubmission.reviewStatus === "pending" && (
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold mb-4">
                      Review Decision
                    </h4>
                    <Textarea
                      label={t('pages.reviewNotes')}
                      placeholder={t('pages.addNotesAboutThisSubmissionRequiredForRejection')}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      minRows={3}
                    />
                  </div>
                )}

                {/* Existing Review - For reviewed submissions */}
                {selectedSubmission.reviewStatus !== "pending" && (
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold mb-4">
                      Review Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
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
                            {getStatusLabel(selectedSubmission.reviewStatus)}
                          </Chip>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                          Reviewed By
                        </label>
                        <p className="text-sm">
                          {selectedSubmission.reviewedBy || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                          Reviewed At
                        </label>
                        <p className="text-sm">
                          {selectedSubmission.reviewedAt
                            ? format(
                                new Date(selectedSubmission.reviewedAt),
                                "MMM dd, yyyy HH:mm"
                              )
                            : "N/A"}
                        </p>
                      </div>
                      {selectedSubmission.reviewNotes && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
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
                  color="secondary"
                  variant="flat"
                  startContent={<Edit size={16} />}
                  onPress={() => {
                    onReviewClose();
                    onEditRequestOpen();
                  }}
                >
                  Request Edit
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
                  Approve & Create Student
                </Button>
              </>
            ) : (
              <Button onPress={onReviewClose}>{t('pages.close2')}</Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Request Edit Modal */}
      <Modal
        isOpen={isEditRequestOpen}
        onClose={onEditRequestClose}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary-100 rounded-xl">
                <Send size={20} className="text-secondary-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t('pages.requestEditReSubmit')}</h3>
                <p className="text-sm text-gray-600 dark:text-zinc-400 font-normal mt-1">
                  Send the form back to parent for corrections
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>{t('pages.note1')}</strong> The parent will receive a notification
                  with your notes. They can use the same link to edit and
                  re-submit the form.
                </p>
              </div>

              <Textarea
                label={t('pages.requiredChanges')}
                placeholder={t('pages.describeWhatNeedsToBeCorrectedOrUpdated')}
                value={editRequestNotes}
                onChange={(e) => setEditRequestNotes(e.target.value)}
                minRows={5}
                isRequired
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                onEditRequestClose();
                setEditRequestNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleRequestEdit}
              isLoading={loading}
              isDisabled={!editRequestNotes.trim()}
              startContent={!loading && <Send size={16} />}
            >
              Send Edit Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
