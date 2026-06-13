import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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
  Chip,
} from "@heroui/react";
import {
  Eye,
  CheckCircle,
  XCircle,
  MoreVertical,
  Download,
  User,
  FileCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { intakeFormsApi } from "../../services/api";
import { format } from "date-fns";
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Textarea from '../../components/ui/Textarea';
import IconButton from '../../components/ui/IconButton';
import DropdownMenu from '../../components/ui/DropdownMenu';
import EmptyState from '../../components/ui/EmptyState';
import FormField from '../../components/ui/FormField';
import FormSection from '../../components/ui/FormSection';

const STATUS_FILTERS = ["pending", "approved", "rejected", "needs_revision", "all"];

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
      toast.error(t('intakeForms.submissions.loadFailed'));
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
      toast.error(t('intakeForms.submissions.loadDetailsFailed'));
    }
  };

  const handleReview = async (status) => {
    if (!selectedSubmission) return;

    if (status === "rejected" && !reviewNotes.trim()) {
      toast.error(t('intakeForms.submissions.rejectionReasonRequired'));
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
          ? t('intakeForms.submissions.approvedSuccess')
          : t('intakeForms.submissions.rejectedSuccess')
      );

      onReviewClose();
      fetchSubmissions();
      setSelectedSubmission(null);
      setReviewNotes("");
    } catch (error) {
      toast.error(error.message || t('intakeForms.submissions.reviewFailed'));
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
    if (!value) return <span className="text-fg-faint">{t('intakeForms.submissions.notProvided')}</span>;

    if (field.type === "file") {
      return (
        <Button
          size="sm"
          variant="flat"
          startContent={<Download size={14} />}
          as="a"
          href={value}
          target="_blank"
          aria-label={t('pages.downloadFileOpensInNewTab')}
        >
          {t('pages.downloadFile')}
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
      label: t('intakeForms.submissions.columns.formName'),
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
      label: t('intakeForms.submissions.columns.submittedBy'),
      render: (row) => (
        <div className="text-sm">{row.submittedByEmail || row.submittedByPhone || row.submittedBy || '-'}</div>
      ),
    },
    {
      key: 'submittedDate',
      label: t('intakeForms.submissions.columns.submittedDate'),
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
      label: t('intakeForms.submissions.columns.status'),
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
      label: t('intakeForms.submissions.columns.reviewedBy'),
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
          label: t('intakeForms.submissions.reviewSubmission'),
          icon: <Eye size={16} />,
          onClick: () => handleViewSubmission(row._id || row.id),
        },
        ...(row.staffId ? [{
          key: 'staff',
          label: t('intakeForms.submissions.viewStaffRecord'),
          icon: <User size={16} />,
          onClick: () => navigate(`/staff/${row.staffId}`),
        }] : []),
      ]}
      ariaLabel={t('aria.menus.submissionActions')}
    />
  );

  const isFiltered = filterStatus !== "pending";
  const showEmptyState = !loading && submissions.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('intakeForms.submissions.title')}
        description={t('intakeForms.submissions.description')}
        bordered={false}
        size="lg"
      />

      {/* Filters */}
      <div className="flex gap-2">
        {STATUS_FILTERS.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={filterStatus === status ? "solid" : "flat"}
            color={filterStatus === status ? "primary" : "default"}
            onPress={() => setFilterStatus(status)}
            aria-pressed={filterStatus === status}
          >
            {t(`intakeForms.submissions.status.${status.replace(/_(.)/g, (_, c) => c.toUpperCase())}`)}
          </Button>
        ))}
      </div>

      {/* Submissions Table / Empty State */}
      {showEmptyState ? (
        <Card className="bg-surface border border-divider">
          <CardBody>
            <EmptyState
              icon={FileCheck}
              title={isFiltered ? t('intakeForms.submissions.empty.filteredTitle') : t('intakeForms.submissions.empty.title')}
              description={isFiltered ? t('intakeForms.submissions.empty.filteredDescription') : t('intakeForms.submissions.empty.description')}
              size="md"
            />
          </CardBody>
        </Card>
      ) : (
        <DataTable
          ariaLabel={t('aria.tables.formSubmissions') || 'Form submissions table'}
          columns={columns}
          data={submissions}
          keyField="_id"
          loading={loading}
          rowActions={rowActions}
          pagination
          defaultPageSize={10}
        />
      )}

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
              <h3 className="text-xl font-semibold">{t('intakeForms.submissions.modalTitle')}</h3>
              {selectedSubmission && (
                <p className="text-sm text-fg-muted font-normal mt-1">
                  {selectedSubmission.formId?.formName || '-'} - {t('intakeForms.submissions.submittedBy')}{" "}
                  {selectedSubmission.submittedByEmail || selectedSubmission.submittedByPhone || '-'}
                </p>
              )}
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedSubmission && (
              <div className="space-y-6">
                {/* Submission Data */}
                <FormSection title={t('intakeForms.submissions.submittedInfo')}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedSubmission.formId?.fields?.map((field) => (
                      <dl
                        key={field.id}
                        className={
                          field.type === "textarea" || field.type === "file"
                            ? "sm:col-span-2"
                            : ""
                        }
                      >
                        <dt className="text-sm font-medium text-fg-muted block mb-1">
                          {field.label}
                          {field.required && (
                            <span className="text-danger ml-1" aria-hidden="true">*</span>
                          )}
                        </dt>
                        <dd className="text-sm text-fg">
                          {renderFieldValue(
                            field,
                            selectedSubmission.submissionData[field.mapTo || field.label]
                          )}
                        </dd>
                      </dl>
                    ))}
                  </div>
                </FormSection>

                {/* Review Section */}
                {selectedSubmission.reviewStatus === "pending" && (
                  <FormSection title={t('intakeForms.submissions.reviewDecision')}>
                    <FormField
                      label={t('intakeForms.submissions.reviewNotesLabel')}
                      className="sm:col-span-2"
                    >
                      <Textarea
                        placeholder={t('intakeForms.submissions.reviewNotesPlaceholder')}
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={3}
                      />
                    </FormField>
                  </FormSection>
                )}

                {/* Existing Review */}
                {selectedSubmission.reviewStatus !== "pending" && (
                  <FormSection title={t('intakeForms.submissions.reviewInfo')}>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-fg-muted">
                          {t('intakeForms.submissions.columns.status')}
                        </dt>
                        <dd className="mt-1">
                          <Chip
                            size="sm"
                            variant="dot"
                            color={getStatusColor(
                              selectedSubmission.reviewStatus
                            )}
                          >
                            {selectedSubmission.reviewStatus}
                          </Chip>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-fg-muted">
                          {t('intakeForms.submissions.columns.reviewedBy')}
                        </dt>
                        <dd className="text-sm">
                          {selectedSubmission.reviewedBy}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-fg-muted">
                          {t('intakeForms.submissions.reviewedAt')}
                        </dt>
                        <dd className="text-sm">
                          {format(
                            new Date(selectedSubmission.reviewedAt),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </dd>
                      </div>
                      {selectedSubmission.reviewNotes && (
                        <div>
                          <dt className="text-sm font-medium text-fg-muted">
                            {t('intakeForms.submissions.reviewNotesLabel')}
                          </dt>
                          <dd className="text-sm">
                            {selectedSubmission.reviewNotes}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </FormSection>
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
                  {t('intakeForms.submissions.reject')}
                </Button>
                <Button
                  color="success"
                  startContent={<CheckCircle size={16} />}
                  onPress={() => handleReview("approved")}
                  isLoading={loading}
                >
                  {t('intakeForms.submissions.approveAndCreate')}
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
