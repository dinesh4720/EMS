import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
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
} from "@heroui/react";
import {
  Send,
  MoreVertical,
  Eye,
  RefreshCw,
  Trash2,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";
import { intakeFormsApi } from "../../services/api";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Select from '../../components/ui/Select';
import IconButton from '../../components/ui/IconButton';
import DropdownMenu from '../../components/ui/DropdownMenu';

export default function FormAssignments() {
  const { t } = useTranslation();
  const { user } = useAuth();
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
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

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
      const data = await intakeFormsApi.getAll(null, "active");
      setForms(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(t('toast.error.failedToLoadForms'));
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const status = filterStatus === "all" ? null : filterStatus;
      const data = await intakeFormsApi.getAssignments(null, status);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(t('toast.error.failedToLoadAssignments'));
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignmentData.formId) {
      toast.error(t('toast.error.pleaseSelectAForm'));
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
      toast.error(t('toast.error.pleaseProvideAtLeastOneEmailOrPhoneNumber'));
      return;
    }

    try {
      setLoading(true);
      await intakeFormsApi.assign(assignmentData.formId, {
        emails,
        phones,
        expiresInDays: assignmentData.expiresInDays,
        assignedBy: user?.id || user?.name || user?.email,
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
      toast.success(t('toast.success.notificationResentSuccessfully'));
    } catch (error) {
      toast.error(t('toast.error.failedToResendNotification'));
    }
  };

  const handleDelete = (assignmentId) => {
    showConfirm({
      title: t('confirm.cancelAssignmentTitle', 'Cancel Assignment'),
      message: t('confirm.cancelAssignment'),
      variant: 'warning',
      confirmText: t('common.confirm', 'Confirm'),
      onConfirm: async () => {
        try {
          await intakeFormsApi.deleteAssignment(assignmentId);
          toast.success(t('toast.success.assignmentCancelled'));
          fetchAssignments();
        } catch (error) {
          toast.error(t('toast.error.failedToCancelAssignment'));
        }
      },
    });
  };

  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    onDetailsOpen();
  };

  const copyAccessLink = (token) => {
    if (!token) {
      toast.error(t('toast.error.accessLinkNotAvailable'));
      return;
    }
    const link = `${window.location.origin}/form/${token}`;
    navigator.clipboard.writeText(link);
    toast.success(t('toast.success.linkCopiedToClipboard'));
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

  const columns = useMemo(() => [
    {
      key: 'formName',
      label: t('pages.fORMName'),
      render: (row) => (
        <div>
          <div className="font-medium text-fg">
            {row.formId?.formName || 'Unknown Form'}
          </div>
          <div className="text-xs text-fg-faint">
            {row.formId?.formType || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'assignedTo',
      label: t('pages.aSSIGNEDTo'),
      render: (row) => (
        <div className="text-sm">{row.assignedToEmail || row.assignedToPhone || '—'}</div>
      ),
    },
    {
      key: 'assignedBy',
      label: t('pages.aSSIGNEDBy'),
      render: (row) => (
        <div className="text-sm">{row.assignedBy?.name || '—'}</div>
      ),
    },
    {
      key: 'status',
      label: t('pages.sTATUS'),
      render: (row) => (
        <Chip
          size="sm"
          variant="dot"
          color={getStatusColor(row.status)}
        >
          {row.status}
        </Chip>
      ),
    },
    {
      key: 'assignedDate',
      label: t('pages.aSSIGNEDDate'),
      render: (row) => (
        <div className="text-sm">
          {row.assignedAt ? format(new Date(row.assignedAt), "MMM dd, yyyy") : '—'}
        </div>
      ),
    },
    {
      key: 'expires',
      label: t('pages.eXPIRES'),
      render: (row) => (
        <div className="text-sm">
          {row.expiresAt ? format(new Date(row.expiresAt), "MMM dd, yyyy") : '—'}
        </div>
      ),
    },
  ], [t]);

  const rowActions = (row) => (
    <DropdownMenu
      trigger={
        <IconButton
          aria-label={t('aria.menus.assignmentActions')}
          icon={<MoreVertical size={16} />}
          size="sm"
        />
      }
      items={[
        {
          key: 'view',
          label: 'View Details',
          icon: <Eye size={16} />,
          onClick: () => handleViewDetails(row),
        },
        {
          key: 'copy',
          label: 'Copy Link',
          icon: <Copy size={16} />,
          onClick: () => copyAccessLink(row.accessToken),
        },
        {
          key: 'resend',
          label: 'Resend Notification',
          icon: <RefreshCw size={16} />,
          onClick: () => handleResend(row._id),
        },
        {
          key: 'delete',
          label: 'Cancel Assignment',
          icon: <Trash2 size={16} />,
          isDestructive: true,
          onClick: () => handleDelete(row._id),
        },
      ]}
      ariaLabel={t('aria.menus.assignmentActions')}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Form Assignments"
        description="Manage and track form assignments sent to teachers"
        actions={
          <Button
            color="primary"
            startContent={<Send size={16} />}
            onPress={onOpen}
          >
            Assign Form
          </Button>
        }
        bordered={false}
        size="lg"
      />

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
              aria-pressed={filterStatus === status}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          )
        )}
      </div>

      {/* Assignments Table */}
      <DataTable
        ariaLabel={t('aria.tables.formAssignments') || 'Form assignments table'}
        columns={columns}
        data={assignments}
        keyField="_id"
        loading={loading}
        emptyState={{
          title: 'No assignments found',
          description: 'Assign a form to see records here.',
        }}
        rowActions={rowActions}
        pagination
        defaultPageSize={10}
      />

      {/* Assign Form Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t('pages.assignForm')}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Select Form"
                placeholder={t('pages.chooseAForm')}
                value={assignmentData.formId}
                onChange={(e) =>
                  setAssignmentData({
                    ...assignmentData,
                    formId: e.target.value,
                  })
                }
              >
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.formName}
                  </option>
                ))}
              </Select>

              <Textarea
                label={t('pages.emailAddresses')}
                placeholder={t('pages.enterEmailAddressesOnePerLineOrCommaSeparated')}
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
                label={t('pages.phoneNumbers')}
                placeholder={t('pages.enterPhoneNumbersOnePerLineOrCommaSeparated')}
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
                label={t('pages.expiresInDays')}
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

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />

      {/* Assignment Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="lg">
        <ModalContent>
          <ModalHeader>{t('pages.assignmentDetails')}</ModalHeader>
          <ModalBody>
            {selectedAssignment && (
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-fg-muted">
                    Form Name
                  </dt>
                  <dd className="text-base font-semibold">
                    {selectedAssignment.formId?.formName || 'Unknown Form'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-fg-muted">
                    Assigned To
                  </dt>
                  <dd className="text-base">{selectedAssignment.assignedToEmail || selectedAssignment.assignedToPhone || '—'}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-fg-muted">
                    Access Link
                  </dt>
                  <dd className="flex gap-2 mt-1">
                    <Input
                      value={`${window.location.origin}/form/${selectedAssignment.accessToken}`}
                      readOnly
                      size="sm"
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      aria-label={t('pages.copyAccessLink')}
                      onPress={() =>
                        copyAccessLink(selectedAssignment.accessToken)
                      }
                    >
                      <Copy size={16} />
                    </Button>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-fg-muted">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <Chip
                      size="sm"
                      variant="dot"
                      color={getStatusColor(selectedAssignment.status)}
                    >
                      {selectedAssignment.status}
                    </Chip>
                  </dd>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-fg-muted">
                      Assigned Date
                    </dt>
                    <dd className="text-sm">
                      {format(
                        new Date(selectedAssignment.assignedAt),
                        "MMM dd, yyyy"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-fg-muted">
                      Expires On
                    </dt>
                    <dd className="text-sm">
                      {format(
                        new Date(selectedAssignment.expiresAt),
                        "MMM dd, yyyy"
                      )}
                    </dd>
                  </div>
                </div>
              </dl>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={onDetailsClose}>{t('pages.close2')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
