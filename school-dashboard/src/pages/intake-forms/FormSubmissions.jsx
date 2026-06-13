import { useState, useEffect, useMemo } from "react";
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
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import IconButton from '../../components/ui/IconButton';
import DropdownMenu from '../../components/ui/DropdownMenu';

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
    if (!value) return <span className="text-fg-faint">{t('formSubmissions.notProvided')}</span>;

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

  const columns = useMemo(() => [
    {
      key: 'formName',
      label: t('formSubmissions.colFormName'),
      render: (row) => (
        <div>
          <div className="font-medium text-fg">
            {row.formId?.formName || row.formName || '-'}
          </div>
          <div className="text-xs text-fg-faint">
            {row.formId?.formType || row.formType || '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'submittedBy',
      label: t('formSubmissions.colSubmittedBy'),
      render: (row) => (
        <div className="text-sm">{row.submittedByEmail || row.submittedByPhone || row.submittedBy || '-'}</div>
      ),
    },
    {
      key: 'submittedDate',
      label: t('formSubmissions.colSubmittedDate'),
      render: (row) => (
        <div className="text-sm">
          {format(
            new Date(row.submittedAt),
            "MMM dd, yyyy HH:mm"
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: t('formSubmissions.colStatus'),
      render: (row) => (
        <Chip
          size="sm"
          variant="dot"
          color={getStatusColor(row.reviewStatus)}
        >
          {row.reviewStatus}
        </Chip>
      ),
    },
    {
      key: 'reviewedBy',
      label: t('formSubmissions.colReviewedBy'),
      render: (row) => (
        <div className="text-sm">
          {row.reviewedBy || "-"}
        </div>
      ),
    },
  ], [t]);

  const rowActions = (row) => (
    <DropdownMenu
      trigger={
        <IconButton
          aria-label={t('aria.menus.submissionActions')}
          icon={<MoreVertical size={16} />}
          size="sm"
        />
      }
      items={[
        {
          key: 'view',
          label: t('formSubmissions.reviewSubmission'),
          icon: <Eye size={16} />,
          onClick: () => handleViewSubmission(row._id || row.id),
        },
        ...(row.staffId ? [{
          key: 'staff',
          label: t('formSubmissions.viewStaffRecord'),
          icon: <User size={16} />,
          onClick: () => navigate(`/staff/${row.staffId}`),
        }] : []),
      ]}
      ariaLabel={t('aria.menus.submissionActions')}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('formSubmissions.title')}
        description={t('formSubmissions.subtitle')}
        bordered={false}
        size="lg"
      />

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
            {t(`formSubmissions.status.${status.replace(/_(.)/g, (_, c) => c.toUpperCase())}`)}
          </Button>
        ))}
      </div>

      {/* Submissions Table */}
      <DataTable
        ariaLabel={t('aria.tables.formSubmissions')}
        columns={columns}
        data={submissions}
        keyField="_id"
        loading={loading}
        emptyState={{
          title: t('formSubmissions.noSubmissions'),
          description: 'Submissions will appear here.',
        }}
        rowActions={rowActions}
        pagination
        defaultPageSize={10}
      />

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
                <p className="text-sm text-fg-muted font-normal mt-1">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedSubmission.formId?.fields?.map((field) => (
                      <div
                        key={field.id}
                        className={
                          field.type === "textarea" || field.type === "file"
                            ? "sm:col-span-2"
                            : ""
                        }
                      >
                        <label className="text-sm font-medium text-fg-muted block mb-1">
                          {field.label}
                          {field.required && (
                            <span className="text-danger ml-1">*</span>
                          )}
                        </label>
                        <div className="text-sm text-fg">
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
                        <label className="text-sm font-medium text-fg-muted">
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
                        <label className="text-sm font-medium text-fg-muted">
                          {t('formSubmissions.colReviewedBy')}
                        </label>
                        <p className="text-sm">
                          {selectedSubmission.reviewedBy}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-fg-muted">
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
                          <label className="text-sm font-medium text-fg-muted">
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
