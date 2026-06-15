import { useState, useEffect, useMemo } from "react";
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
  Send,
  MoreVertical,
  Eye,
  RefreshCw,
  Trash2,
  Copy,
  FileText,
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
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import IconButton from '../../components/ui/IconButton';
import DropdownMenu from '../../components/ui/DropdownMenu';
import EmptyState from '../../components/ui/EmptyState';
import FormField from '../../components/ui/FormField';
import FormSection from '../../components/ui/FormSection';

const STATUS_FILTERS = ["all", "pending", "submitted", "approved", "rejected"];

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
    // `fetchForms`/`fetchAssignments` are recreated each render; trigger on filter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      toast.success(t('intakeForms.assignments.toast.assigned', { count: emails.length + phones.length }));
      onClose();
      fetchAssignments();
      setAssignmentData({
        formId: "",
        emails: "",
        phones: "",
        expiresInDays: 30,
      });
    } catch (error) {
      toast.error(error.message || t('intakeForms.assignments.toast.assignFailed'));
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
      label: t('intakeForms.assignments.columns.formName'),
      render: (row) => (
        <div>
          <div className="font-medium text-fg">
            {row.formId?.formName || t('intakeForms.assignments.unknownForm')}
          </div>
          <div className="text-xs text-fg-faint">
            {row.formId?.formType || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'assignedTo',
      label: t('intakeForms.assignments.columns.assignedTo'),
      render: (row) => (
        <div className="text-sm">{row.assignedToEmail || row.assignedToPhone || '—'}</div>
      ),
    },
    {
      key: 'assignedBy',
      label: t('intakeForms.assignments.columns.assignedBy'),
      render: (row) => (
        <div className="text-sm">{row.assignedBy?.name || '—'}</div>
      ),
    },
    {
      key: 'status',
      label: t('intakeForms.assignments.columns.status'),
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
      label: t('intakeForms.assignments.columns.assignedDate'),
      render: (row) => (
        <div className="text-sm">
          {row.assignedAt ? format(new Date(row.assignedAt), "MMM dd, yyyy") : '—'}
        </div>
      ),
    },
    {
      key: 'expires',
      label: t('intakeForms.assignments.columns.expires'),
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
          label: t('intakeForms.assignments.actions.viewDetails'),
          icon: <Eye size={16} />,
          onClick: () => handleViewDetails(row),
        },
        {
          key: 'copy',
          label: t('intakeForms.assignments.actions.copyLink'),
          icon: <Copy size={16} />,
          onClick: () => copyAccessLink(row.accessToken),
        },
        {
          key: 'resend',
          label: t('intakeForms.assignments.actions.resendNotification'),
          icon: <RefreshCw size={16} />,
          onClick: () => handleResend(row._id),
        },
        {
          key: 'delete',
          label: t('intakeForms.assignments.actions.cancelAssignment'),
          icon: <Trash2 size={16} />,
          isDestructive: true,
          onClick: () => handleDelete(row._id),
        },
      ]}
      ariaLabel={t('aria.menus.assignmentActions')}
    />
  );

  const formOptions = useMemo(
    () => forms.map((form) => ({ value: form.id, label: form.formName })),
    [forms]
  );

  const isFiltered = filterStatus !== "all";
  const showEmptyState = !loading && assignments.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('intakeForms.assignments.title')}
        description={t('intakeForms.assignments.description')}
        actions={
          <Button
            color="primary"
            startContent={<Send size={16} />}
            onPress={onOpen}
          >
            {t('intakeForms.assignments.assignForm')}
          </Button>
        }
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
            {t(`intakeForms.assignments.status.${status}`)}
          </Button>
        ))}
      </div>

      {/* Assignments Table / Empty State */}
      {showEmptyState ? (
        <Card className="bg-surface border border-divider">
          <CardBody>
            <EmptyState
              icon={FileText}
              title={isFiltered ? t('intakeForms.assignments.empty.filteredTitle') : t('intakeForms.assignments.empty.title')}
              description={isFiltered ? t('intakeForms.assignments.empty.filteredDescription') : t('intakeForms.assignments.empty.description')}
              action={
                !isFiltered ? (
                  <Button color="primary" startContent={<Send size={16} />} onPress={onOpen}>
                    {t('intakeForms.assignments.assignForm')}
                  </Button>
                ) : null
              }
              size="md"
            />
          </CardBody>
        </Card>
      ) : (
        <DataTable
          ariaLabel={t('aria.tables.formAssignments') || 'Form assignments table'}
          columns={columns}
          data={assignments}
          keyField="_id"
          loading={loading}
          rowActions={rowActions}
          pagination
          defaultPageSize={10}
        />
      )}

      {/* Assign Form Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t('intakeForms.assignments.assignForm')}</ModalHeader>
          <ModalBody>
            <FormSection
              title={t('intakeForms.assignments.modal.sectionTitle')}
              description={t('intakeForms.assignments.modal.sectionDescription')}
            >
              <FormField
                label={t('intakeForms.assignments.modal.selectFormLabel')}
                required
              >
                <Select
                  placeholder={t('intakeForms.assignments.modal.selectFormPlaceholder')}
                  value={assignmentData.formId}
                  options={formOptions}
                  onChange={(e) =>
                    setAssignmentData({
                      ...assignmentData,
                      formId: e.target.value,
                    })
                  }
                />
              </FormField>

              <FormField
                label={t('intakeForms.assignments.modal.emailAddressesLabel')}
                description={t('intakeForms.assignments.modal.emailAddressesHint')}
              >
                <Textarea
                  placeholder={t('intakeForms.assignments.modal.emailAddressesPlaceholder')}
                  value={assignmentData.emails}
                  onChange={(e) =>
                    setAssignmentData({
                      ...assignmentData,
                      emails: e.target.value,
                    })
                  }
                  rows={3}
                />
              </FormField>

              <FormField
                label={t('intakeForms.assignments.modal.phoneNumbersLabel')}
                description={t('intakeForms.assignments.modal.phoneNumbersHint')}
              >
                <Textarea
                  placeholder={t('intakeForms.assignments.modal.phoneNumbersPlaceholder')}
                  value={assignmentData.phones}
                  onChange={(e) =>
                    setAssignmentData({
                      ...assignmentData,
                      phones: e.target.value,
                    })
                  }
                  rows={3}
                />
              </FormField>

              <FormField
                label={t('intakeForms.assignments.modal.expiresInDaysLabel')}
                required
              >
                <Input
                  type="number"
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
              </FormField>
            </FormSection>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              color="primary"
              onPress={handleAssign}
              isLoading={loading}
            >
              {t('intakeForms.assignments.assignForm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />

      {/* Assignment Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="lg">
        <ModalContent>
          <ModalHeader>{t('intakeForms.assignments.modal.assignmentDetailsTitle')}</ModalHeader>
          <ModalBody>
            {selectedAssignment && (
              <FormSection columns={1}>
                <dl className="space-y-4">
                  <FormField label={t('intakeForms.assignments.modal.formNameLabel')}>
                    <div className="text-base font-semibold text-fg">
                      {selectedAssignment.formId?.formName || t('intakeForms.assignments.unknownForm')}
                    </div>
                  </FormField>

                  <FormField label={t('intakeForms.assignments.modal.assignedToLabel')}>
                    <div className="text-base text-fg">
                      {selectedAssignment.assignedToEmail || selectedAssignment.assignedToPhone || '—'}
                    </div>
                  </FormField>

                  <FormField label={t('intakeForms.assignments.modal.accessLinkLabel')}>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={`${window.location.origin}/form/${selectedAssignment.accessToken}`}
                        readOnly
                        size="sm"
                      />
                      <Button
                        isIconOnly
                        size="sm"
                        aria-label={t('intakeForms.assignments.modal.copyAccessLink')}
                        onPress={() =>
                          copyAccessLink(selectedAssignment.accessToken)
                        }
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </FormField>

                  <FormField label={t('intakeForms.assignments.modal.statusLabel')}>
                    <div className="mt-1">
                      <Chip
                        size="sm"
                        variant="dot"
                        color={getStatusColor(selectedAssignment.status)}
                      >
                        {selectedAssignment.status}
                      </Chip>
                    </div>
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label={t('intakeForms.assignments.modal.assignedDateLabel')}>
                      <div className="text-sm text-fg">
                        {format(
                          new Date(selectedAssignment.assignedAt),
                          "MMM dd, yyyy"
                        )}
                      </div>
                    </FormField>
                    <FormField label={t('intakeForms.assignments.modal.expiresOnLabel')}>
                      <div className="text-sm text-fg">
                        {format(
                          new Date(selectedAssignment.expiresAt),
                          "MMM dd, yyyy"
                        )}
                      </div>
                    </FormField>
                  </div>
                </dl>
              </FormSection>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={onDetailsClose}>{t('common.close')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
