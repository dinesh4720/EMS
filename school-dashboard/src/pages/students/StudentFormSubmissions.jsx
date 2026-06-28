import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, CheckCircle, XCircle, MoreVertical,
  Download, User, Edit, Send,
} from "lucide-react";
import toast from "react-hot-toast";
import { intakeFormsApi } from "../../services/api";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../../context/AuthContext";
import logger from "../../utils/logger";
import {
  Button, Chip, Modal, Textarea, ErrorState,
  DataTable, DropdownMenu,
} from "../../components/ui";
import { sanitizeUrl } from "../../utils/sanitizeUrl";
import "../../styles/student.css";

export default function StudentFormSubmissions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const onReviewOpen = () => setIsReviewOpen(true);
  const onReviewClose = () => setIsReviewOpen(false);

  const [isEditRequestOpen, setIsEditRequestOpen] = useState(false);
  const onEditRequestOpen = () => setIsEditRequestOpen(true);
  const onEditRequestClose = () => setIsEditRequestOpen(false);

  const [fetchLoading, setFetchLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const loading = fetchLoading || reviewLoading;
  const [submissions, setSubmissions] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [reviewNotes, setReviewNotes] = useState("");
  const [editRequestNotes, setEditRequestNotes] = useState("");
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, [filterStatus]);

  const fetchSubmissions = async () => {
    try {
      setFetchLoading(true);
      setFetchError(null);
      const status = filterStatus === "all" ? null : filterStatus;

      // Get all submissions and filter for student forms
      const data = await intakeFormsApi.getSubmissions(null, status);
      const studentSubmissions = data.filter(
        (s) => s.formType === "student" || s.form?.formType === "student"
      );
      setSubmissions(studentSubmissions);

      // Pre-fetch all-status counts on first load so the segmented tabs show
      // accurate tnum counts without re-fetching for every tab switch.
      if (filterStatus === "pending" && allSubmissions.length === 0) {
        try {
          const allData = await intakeFormsApi.getSubmissions(null, null);
          const allStudent = allData.filter(
            (s) => s.formType === "student" || s.form?.formType === "student"
          );
          setAllSubmissions(allStudent);
        } catch {
          /* counts are nice-to-have — silent fail */
        }
      }
    } catch (error) {
      setFetchError(error);
      toast.error(t('toast.error.failedToLoadSubmissions'));
      logger.error("Failed to load student form submissions", error);
    } finally {
      setFetchLoading(false);
    }
  };

  const statusCounts = (() => {
    const counts = { pending: 0, needs_revision: 0, approved: 0, rejected: 0, all: 0 };
    for (const s of allSubmissions) {
      counts.all++;
      if (s.reviewStatus in counts) counts[s.reviewStatus]++;
    }
    return counts;
  })();

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
      setReviewLoading(true);
      await intakeFormsApi.reviewSubmission(selectedSubmission._id, {
        reviewStatus: status,
        reviewNotes: reviewNotes,
        reviewedBy: user?.name || user?.id,
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
      setReviewLoading(false);
    }
  };

  const handleRequestEdit = async () => {
    if (!selectedSubmission) return;

    if (!editRequestNotes.trim()) {
      toast.error(t('toast.error.pleaseProvideNotesOnWhatNeedsToBeEdited'));
      return;
    }

    try {
      setReviewLoading(true);
      // Request edit using dedicated endpoint
      await intakeFormsApi.requestEdit(selectedSubmission._id, {
        notes: editRequestNotes,
        requestedBy: user?.name || user?.id,
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
      setReviewLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
      needs_revision: "info",
    };
    return colors[status] || "neutral";
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
    if (!value) return <span className="text-fg-faint">{t('pages.notProvided1')}</span>;

    if (field.type === "file") {
      const safeHref = sanitizeUrl(value);
      if (safeHref === '#') {
        return <span className="text-fg-faint">{t('pages.notProvided1')}</span>;
      }
      return (
        <a
          href={safeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-md bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-strong)] transition-colors"
        >
          <Download size={14} aria-hidden />
          Download File
        </a>
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

  const columns = [
    {
      key: "formName",
      label: t('pages.fORMName'),
      render: (s) => (
        <div>
          <div className="font-medium text-fg">{s.formName || s.form?.formName}</div>
          <div className="text-xs text-fg-muted">{s.formType || s.form?.formType}</div>
        </div>
      ),
    },
    {
      key: "studentName",
      label: t('pages.sTUDENTName'),
      render: (s) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-bg)] flex items-center justify-center">
            <User size={16} className="text-[var(--accent)]" aria-hidden />
          </div>
          <div className="text-sm font-medium">{getStudentName(s)}</div>
        </div>
      ),
    },
    {
      key: "parentContact",
      label: t('pages.pARENTContact'),
      render: (s) => <div className="text-sm">{getParentContact(s)}</div>,
    },
    {
      key: "submittedAt",
      label: t('pages.sUBMITTEDDate'),
      render: (s) => (
        <div className="text-sm">
          {s.submittedAt
            ? format(new Date(s.submittedAt), "MMM dd, yyyy HH:mm")
            : '—'}
        </div>
      ),
    },
    {
      key: "status",
      label: t('pages.sTATUS'),
      render: (s) => (
        <Chip size="sm" color={getStatusColor(s.reviewStatus)}>
          {getStatusLabel(s.reviewStatus)}
        </Chip>
      ),
    },
  ];

  const rowActions = (submission) => (
    <DropdownMenu
      ariaLabel={t('aria.menus.submissionActions')}
      trigger={
        <Button size="sm" variant="ghost" aria-label="More actions" icon={<MoreVertical size={16} aria-hidden />} />
      }
      items={[
        {
          key: "view",
          label: "Review Submission",
          icon: <Eye size={16} aria-hidden />,
          onClick: () => handleViewSubmission(submission._id),
        },
        ...(submission.studentId
          ? [
              {
                key: "student",
                label: "View Student Record",
                icon: <User size={16} aria-hidden />,
                onClick: () => navigate(`/students/${submission.studentId}`),
              },
            ]
          : []),
      ]}
    />
  );

  if (fetchError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-fg">
              Student Admission Submissions
            </h2>
            <p className="text-sm text-fg-muted mt-1">
              Review and approve student admission form submissions
            </p>
          </div>
        </div>
        <ErrorState
          title="Failed to load submissions"
          description={fetchError.message || "Something went wrong while fetching submissions."}
          onRetry={fetchSubmissions}
          size="md"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-fg">
            Student Admission Submissions
          </h2>
          <p className="text-sm text-fg-muted mt-1">
            Review and approve student admission form submissions
          </p>
        </div>
      </div>

      {/* Segmented tabs with mono tnum counts */}
      <div className="formsub-tabs" role="tablist" aria-label="Filter submissions">
        {["pending", "needs_revision", "approved", "rejected", "all"].map(
          (status) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={filterStatus === status}
              onClick={() => setFilterStatus(status)}
              className={`formsub-tab ${filterStatus === status ? 'is-active' : ''}`}
            >
              <span>
                {status === "needs_revision"
                  ? "Needs Revision"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              {statusCounts[status] > 0 && (
                <span className="formsub-tab__num">{statusCounts[status]}</span>
              )}
            </button>
          )
        )}
      </div>

      <p className="text-xs text-fg-muted">
        Showing <span className="mono tnum">{submissions.length}</span> submission{submissions.length !== 1 ? 's' : ''}
      </p>

      {/* Submissions Table */}
      <DataTable
        columns={columns}
        data={submissions}
        keyField="_id"
        loading={loading}
        emptyState={{ title: "No submissions found" }}
        rowActions={rowActions}
        ariaLabel={t('aria.tables.studentFormSubmissions')}
      />

      {/* Review Submission Modal */}
      <Modal
        isOpen={isReviewOpen}
        onClose={onReviewClose}
        size="xl"
      >
        <Modal.Header>
          <div>
            <h3 className="text-xl font-semibold">{t('pages.reviewAdmissionSubmission')}</h3>
            {selectedSubmission && (
              <p className="text-sm text-fg-muted font-normal mt-1">
                {selectedSubmission.formId?.formName || selectedSubmission.formName} -{" "}
                {getStudentName(selectedSubmission)}
              </p>
            )}
          </div>
        </Modal.Header>
        <Modal.Body>
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
                      <label className="text-sm font-medium text-fg-muted block mb-1">
                        {field.label}
                        {field.required && (
                          <span className="text-danger ml-1">*</span>
                        )}
                      </label>
                      <div className="text-sm text-fg">
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
                    rows={3}
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
                      <label className="text-sm font-medium text-fg-muted">
                        Status
                      </label>
                      <div className="mt-1">
                        <Chip
                          size="sm"
                          color={getStatusColor(
                            selectedSubmission.reviewStatus
                          )}
                        >
                          {getStatusLabel(selectedSubmission.reviewStatus)}
                        </Chip>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-fg-muted">
                        Reviewed By
                      </label>
                      <p className="text-sm">
                        {selectedSubmission.reviewedBy || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-fg-muted">
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
                        <label className="text-sm font-medium text-fg-muted">
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
        </Modal.Body>
        <Modal.Footer>
          {selectedSubmission?.reviewStatus === "pending" ? (
            <>
              <Button variant="ghost" size="sm" onClick={onReviewClose}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Edit size={16} aria-hidden />}
                onClick={() => {
                  onReviewClose();
                  onEditRequestOpen();
                }}
              >
                Request Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle size={16} aria-hidden />}
                onClick={() => handleReview("rejected")}
                loading={loading}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle size={16} aria-hidden />}
                onClick={() => handleReview("approved")}
                loading={loading}
              >
                Approve & Create Student
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={onReviewClose}>{t('pages.close2')}</Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Request Edit Modal */}
      <Modal
        isOpen={isEditRequestOpen}
        onClose={onEditRequestClose}
        size="xl"
      >
        <Modal.Header>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--info-bg)] rounded-xl">
              <Send size={20} className="text-[var(--info)]" aria-hidden />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{t('pages.requestEditReSubmit')}</h3>
              <p className="text-sm text-fg-muted font-normal mt-1">
                Send the form back to parent for corrections
              </p>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div className="bg-[var(--info-bg)] border border-[var(--info)]/20 rounded-lg p-4">
              <p className="text-sm text-[var(--info)]">
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
              rows={5}
              required
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onEditRequestClose();
              setEditRequestNotes("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRequestEdit}
            loading={loading}
            disabled={!editRequestNotes.trim()}
            icon={!loading && <Send size={16} aria-hidden />}
          >
            Send Edit Request
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
