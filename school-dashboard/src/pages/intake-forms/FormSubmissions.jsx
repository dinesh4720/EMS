import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
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
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(t('formSubmissions.loadFailed'));
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
      toast.error(t('formSubmissions.loadDetailsFailed'));
    }
  };

  const handleReview = async (status) => {
    if (!selectedSubmission) return;

    if (status === "rejected" && !reviewNotes.trim()) {
      toast.error(t('formSubmissions.rejectionReasonRequired'));
      return;
    }

    try {
      setLoading(true);
      await intakeFormsApi.reviewSubmission(selectedSubmission._id || selectedSubmission.id, {
        reviewStatus: status,
        reviewNotes: reviewNotes,
        reviewedBy: user?.id || user?.name || user?.email,
      });

      toast.success(
        status === "approved"
          ? t('formSubmissions.approvedSuccess')
          : t('formSubmissions.rejectedSuccess')
      );

      onReviewClose();
      fetchSubmissions();
      setSelectedSubmission(null);
      setReviewNotes("");
    } catch (error) {
      toast.error(error.message || t('formSubmissions.reviewFailed'));
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

  const renderFieldValue = (field, value) => {
    if (!value) return <span className="text-gray-400 dark:text-zinc-500">{t('formSubmissions.notProvided')}</span>;

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
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
            {t('formSubmissions.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            {t('formSubmissions.subtitle')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["pending", "approved", "rejected", "needs_revision", "all"].map((status) => (
          <Button
            key={status}
            size="sm"
            variant={filterStatus === status ? "solid" : "flat"}
            color={filterStatus === status ? "primary" : "default"}
            onPress={() => setFilterStatus(status)}
          >
            {t(`formSubmissions.status.${status}`)}
          </Button>
        ))}
      </div>

      {/* Submissions Table */}
      <Card>
        <CardBody className="p-0">
          <Table
            aria-label={t('aria.tables.formSubmissions')}
            removeWrapper
            classNames={{
              th: "bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 font-semibold",
              td: "py-4",
            }}
          >
            <TableHeader>
              <TableColumn scope="col">{t('formSubmissions.colFormName')}</TableColumn>
              <TableColumn scope="col">{t('formSubmissions.colSubmittedBy')}</TableColumn>
              <TableColumn scope="col">{t('formSubmissions.colSubmittedDate')}</TableColumn>
              <TableColumn scope="col">{t('formSubmissions.colStatus')}</TableColumn>
              <TableColumn scope="col">{t('formSubmissions.colReviewedBy')}</TableColumn>
              <TableColumn scope="col">{t('formSubmissions.colActions')}</TableColumn>
            </TableHeader>
            <TableBody
              items={submissions}
              emptyContent={t('formSubmissions.noSubmissions')}
              loadingContent={<Spinner />}
              isLoading={loading}
            >
              {(submission) => (
                <TableRow key={submission._id || submission.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900 dark:text-zinc-100">
                      {submission.formId?.formName || submission.formName || '-'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-500">
                      {submission.formId?.formType || submission.formType || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{submission.submittedByEmail || submission.submittedByPhone || submission.submittedBy || '-'}</div>
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
                      <DropdownMenu aria-label={t('aria.menus.submissionActions')}>
                        <DropdownItem
                          key="view"
                          startContent={<Eye size={16} />}
                          onPress={() => handleViewSubmission(submission._id || submission.id)}
                        >
                          {t('formSubmissions.reviewSubmission')}
                        </DropdownItem>
                        {submission.staffId && (
                          <DropdownItem
                            key="staff"
                            startContent={<User size={16} />}
                            onPress={() =>
                              navigate(`/staff/${submission.staffId}`)
                            }
                          >
                            {t('formSubmissions.viewStaffRecord')}
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
              <h3 className="text-xl font-semibold">{t('formSubmissions.modalTitle')}</h3>
              {selectedSubmission && (
                <p className="text-sm text-gray-600 dark:text-zinc-400 font-normal mt-1">
                  {selectedSubmission.formId?.formName || '-'} - Submitted by{" "}
                  {selectedSubmission.submittedByEmail || selectedSubmission.submittedByPhone || '-'}
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
                    {t('formSubmissions.submittedInfo')}
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
                      {t('formSubmissions.reviewDecision')}
                    </h4>
                    <Textarea
                      label={t('formSubmissions.reviewNotesLabel')}
                      placeholder={t('formSubmissions.reviewNotesPlaceholder')}
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
                      {t('formSubmissions.reviewInfo')}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                          {t('formSubmissions.colStatus')}
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
                        <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                          {t('formSubmissions.colReviewedBy')}
                        </label>
                        <p className="text-sm">
                          {selectedSubmission.reviewedBy}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                          {t('formSubmissions.reviewedAt')}
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
                          <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                            {t('formSubmissions.reviewNotesLabel')}
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
                  {t('common.cancel')}
                </Button>
                <Button
                  color="danger"
                  variant="flat"
                  startContent={<XCircle size={16} />}
                  onPress={() => handleReview("rejected")}
                  isLoading={loading}
                >
                  {t('formSubmissions.reject')}
                </Button>
                <Button
                  color="success"
                  startContent={<CheckCircle size={16} />}
                  onPress={() => handleReview("approved")}
                  isLoading={loading}
                >
                  {t('formSubmissions.approveAndCreate')}
                </Button>
              </>
            ) : (
              <Button onPress={onReviewClose}>{t('common.close')}</Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
