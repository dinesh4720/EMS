import { useState, useEffect } from "react";
import { useEntityFetch } from "../../hooks/useEntityFetch";
import { Card, CardBody, CardHeader, Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem, Switch, Spinner } from "@heroui/react";
import { Plus, Edit, Trash2, UserCheck, Users } from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { useTranslation } from 'react-i18next';
import logger from '../../utils/logger';


export default function LeaveSettings() {
  const { t } = useTranslation();
  const { leaveTypes, addLeaveType, updateLeaveType, deleteLeaveType, loading } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingLeave, setEditingLeave] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    applicableTo: "both",
    quota: 12,
    requiresApproval: true,
    approver: "reporter"
  });
  const [saving, setSaving] = useState(false);
  // AUDIT-128: State-driven delete confirmation
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const pendingDeleteTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pendingDeleteTimeoutRef.current) clearTimeout(pendingDeleteTimeoutRef.current);
    };
  }, []);

  const ITEMS_PER_LOAD = 10;
  const { visibleItems: visibleLeaveTypes, hasMore, isLoadingMore, loaderRef } = useEntityFetch(
    leaveTypes,
    [leaveTypes.length]
  );

  const handleOpen = (leaveType = null) => {
    if (leaveType) {
      setEditingLeave(leaveType);
      setFormData({
        name: leaveType.name || "",
        applicableTo: leaveType.applicableTo || "both",
        quota: leaveType.quota ?? 12,
        requiresApproval: leaveType.requiresApproval ?? true,
        approver: leaveType.approver || "reporter",
      });
    } else {
      setEditingLeave(null);
      setFormData({
        name: "",
        applicableTo: "both",
        quota: 12,
        requiresApproval: true,
        approver: "reporter"
      });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    if (!formData.quota || formData.quota < 1) {
      toast.error('Quota must be at least 1 day');
      return;
    }

    setSaving(true);
    try {
      if (editingLeave) {
        await updateLeaveType(editingLeave._id || editingLeave.id, formData);
        toast.success(t('toast.success.leaveTypeUpdatedSuccessfully'));
      } else {
        await addLeaveType(formData);
        toast.success(t('toast.success.leaveTypeAddedSuccessfully'));
      }
      onClose();
    } catch (error) {
      logger.error('Failed to save leave type:', error);
      toast.error(t('toast.error.failedToSaveLeaveType'));
    } finally {
      setSaving(false);
    }
  };

  // AUDIT-128: Replaced confirm() with state-driven confirmation
  const handleDelete = async (id) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      toast(t('confirm.deleteLeaveType') + ' Click delete again to confirm.', { icon: '\u26A0\uFE0F', duration: 3000 });
      if (pendingDeleteTimeoutRef.current) clearTimeout(pendingDeleteTimeoutRef.current);
      pendingDeleteTimeoutRef.current = setTimeout(() => setPendingDeleteId(null), 3000);
      return;
    }
    setPendingDeleteId(null);
    try {
      await deleteLeaveType(id);
      toast.success(t('toast.success.leaveTypeDeletedSuccessfully'));
    } catch (error) {
      logger.error('Failed to delete leave type:', error);
      toast.error(t('toast.error.failedToDeleteLeaveType'));
    }
  };

  const applicableToColors = {
    "staff": "primary",
    "students": "secondary",
    "both": "success"
  };

  if (loading) {
    return (
      <TablePageSkeleton />
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-fg">{t('pages.leaveConfiguration')}</h2>
          <p className="text-sm text-fg-muted">{t('pages.manageLeaveTypesAndApprovalWorkflows')}</p>
        </div>
        <Button 
          color="primary" 
          size="sm" 
          startContent={<Plus size={16} />} 
          onPress={() => handleOpen()}
          className="transition-all duration-200"
        >
          Add Leave Type
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-[var(--accent-bg)] rounded-lg border border-[var(--accent-border)]">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck size={18} className="text-[var(--accent)]" />
            <span className="text-xs text-[var(--accent)] uppercase tracking-wider">{t('pages.staffLeaves')}</span>
          </div>
          <p className="text-2xl font-semibold text-[var(--accent)]">
            {leaveTypes.filter(lt => lt.applicableTo === "staff" || lt.applicableTo === "both").length}
          </p>
        </div>

        <div className="p-4 bg-[var(--accent-bg)] rounded-lg border border-[var(--accent-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-[var(--accent)]" />
            <span className="text-xs text-[var(--accent)] uppercase tracking-wider">{t('pages.studentLeaves')}</span>
          </div>
          <p className="text-2xl font-semibold text-[var(--accent)]">
            {leaveTypes.filter(lt => lt.applicableTo === "students" || lt.applicableTo === "both").length}
          </p>
        </div>

        <div className="p-4 bg-[var(--ok-bg)] rounded-lg border border-[var(--ok-border)]">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck size={18} className="text-[var(--ok)]" />
            <span className="text-xs text-[var(--ok)] uppercase tracking-wider">{t('pages.totalTypes')}</span>
          </div>
          <p className="text-2xl font-semibold text-[var(--ok)]">{leaveTypes.length}</p>
        </div>

        <div className="p-4 bg-[var(--warn-bg)] rounded-lg border border-[var(--warn-border)]">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck size={18} className="text-[var(--warn)]" />
            <span className="text-xs text-[var(--warn)] uppercase tracking-wider">{t('pages.autoApproved')}</span>
          </div>
          <p className="text-2xl font-semibold text-[var(--warn)]">
            {leaveTypes.filter(lt => !lt.requiresApproval).length}
          </p>
        </div>
      </div>

      <Card className="shadow-sm border border-border-token rounded-lg">
        <CardBody className="p-0">
          <Table
            aria-label={t('aria.misc.leaveTypes')}
            removeWrapper
            classNames={{
              base: "overflow-visible",
              th: "bg-transparent text-fg-faint font-medium text-xs uppercase tracking-wider h-12 border-b border-border-token",
              td: "py-5 border-b border-divider",
              tbody: "[&>tr:last-child>td]:border-none"
            }}
          >
            <TableHeader>
              <TableColumn scope="col">{t('pages.lEAVEType')}</TableColumn>
              <TableColumn scope="col">{t('pages.aPPLICABLETo')}</TableColumn>
              <TableColumn scope="col">{t('pages.qUOTADays')}</TableColumn>
              <TableColumn scope="col">{t('pages.aPPROVAL')}</TableColumn>
              <TableColumn scope="col">{t('pages.aPPROVER')}</TableColumn>
              <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No leave types configured">
              {visibleLeaveTypes.map((leaveType) => (
                <TableRow key={leaveType._id || leaveType.id}>
                  <TableCell className="font-medium text-fg">{leaveType.name}</TableCell>
                  <TableCell>
                    <Chip 
                      size="sm" 
                      variant="flat" 
                      color={applicableToColors[leaveType.applicableTo]}
                      className="capitalize"
                    >
                      {leaveType.applicableTo}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-sm text-fg-muted">{leaveType.quota} days</TableCell>
                  <TableCell>
                    <Chip 
                      size="sm" 
                      variant="dot"
                      color={leaveType.requiresApproval ? "warning" : "success"}
                      classNames={{ base: "border-1 border-border-token pl-2" }}
                    >
                      {leaveType.requiresApproval ? "Required" : "Auto-approved"}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-sm text-fg-muted capitalize">
                    {leaveType.requiresApproval ? leaveType.approver : "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="primary"
                        aria-label="Edit leave type"
                        onPress={() => handleOpen(leaveType)}
                        className="transition-all duration-200"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        aria-label="Delete leave type"
                        onPress={() => handleDelete(leaveType._id || leaveType.id)}
                        className="transition-all duration-200"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Lazy loading indicator */}
          <div ref={loaderRef} className="flex justify-center py-4">
            {isLoadingMore && <Spinner size="sm" color="primary" />}
            {!hasMore && leaveTypes.length > ITEMS_PER_LOAD && (
              <span className="text-fg-faint text-sm">All {leaveTypes.length} leave types loaded</span>
            )}
          </div>
        </CardBody>
      </Card>

      <Card className="shadow-sm border border-border-token rounded-lg mt-4">
        <CardHeader className="py-4 px-4 bg-surface-2/50 border-b border-divider">
          <h3 className="text-sm font-semibold text-fg">{t('pages.approvalWorkflow')}</h3>
        </CardHeader>
        <CardBody className="p-4 space-y-3">
          <div className="flex items-center justify-between p-4 bg-surface-2 rounded-lg border border-border-token">
            <div>
              <p className="text-sm font-medium text-fg">{t('pages.reporter')}</p>
              <p className="text-xs text-fg-muted">{t('pages.directSupervisorOrClassTeacher')}</p>
            </div>
            <Chip size="sm" color="primary" variant="flat">{t('pages.level1')}</Chip>
          </div>
          <div className="flex items-center justify-between p-4 bg-surface-2 rounded-lg border border-border-token">
            <div>
              <p className="text-sm font-medium text-fg">{t('pages.principal2')}</p>
              <p className="text-xs text-fg-muted">{t('pages.schoolPrincipalOrHead')}</p>
            </div>
            <Chip size="sm" color="warning" variant="flat">{t('pages.level2')}</Chip>
          </div>
          <div className="flex items-center justify-between p-4 bg-surface-2 rounded-lg border border-border-token">
            <div>
              <p className="text-sm font-medium text-fg">{t('pages.admin2')}</p>
              <p className="text-xs text-fg-muted">{t('pages.systemAdministrator')}</p>
            </div>
            <Chip size="sm" color="danger" variant="flat">{t('pages.level3')}</Chip>
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader>{editingLeave ? "Edit Leave Type" : "Add New Leave Type"}</ModalHeader>
          <ModalBody className="gap-4">
            <Input
              size="sm"
              label={t('pages.leaveTypeName')}
              placeholder={t('settings.leaveTypeNamePlaceholder')}
              value={formData.name}
              onValueChange={(v) => setFormData({ ...formData, name: v })}
              variant="bordered"
            />
            <Select
              size="sm"
              label={t('pages.applicableTo')}
              variant="bordered"
              selectedKeys={[formData.applicableTo]}
              onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })}
            >
              <SelectItem key="staff" value="staff">{t('pages.staffOnly')}</SelectItem>
              <SelectItem key="students" value="students">{t('pages.studentsOnly')}</SelectItem>
              <SelectItem key="both" value="both">{t('pages.bothStaffStudents')}</SelectItem>
            </Select>
            <Input
              size="sm"
              type="number"
              label={t('pages.annualQuotaDays')}
              placeholder={t('settings.leaveQuotaPlaceholder')}
              value={formData.quota}
              onValueChange={(v) => setFormData({ ...formData, quota: parseInt(v, 10) || 0 })}
              min={1}
              isInvalid={formData.quota < 1}
              errorMessage={formData.quota < 1 ? 'Quota must be at least 1 day' : undefined}
              variant="bordered"
            />
            <div className="flex items-center justify-between p-3 bg-surface-2 rounded-lg border border-border-token">
              <div>
                <p className="text-sm font-medium text-fg">{t('pages.requiresApproval')}</p>
                <p className="text-xs text-fg-muted">{t('pages.leaveNeedsApprovalBeforeGranting')}</p>
              </div>
              <Switch 
                size="sm" 
                isSelected={formData.requiresApproval}
                onValueChange={(v) => setFormData({ ...formData, requiresApproval: v })}
              />
            </div>
            {formData.requiresApproval && (
              <Select
                size="sm"
                label={t('pages.approver')}
                variant="bordered"
                selectedKeys={[formData.approver]}
                onChange={(e) => setFormData({ ...formData, approver: e.target.value })}
              >
                <SelectItem key="reporter" value="reporter">{t('pages.reporterDirectSupervisor')}</SelectItem>
                <SelectItem key="principal" value="principal">{t('pages.principal2')}</SelectItem>
                <SelectItem key="admin" value="admin">{t('pages.admin2')}</SelectItem>
              </Select>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>{t('pages.cancel2')}</Button>
            <Button 
              color="primary" 
              onPress={handleSave}
              isDisabled={!formData.name.trim() || formData.quota < 1}
              isLoading={saving}
            >
              {editingLeave ? "Update" : "Add"} Leave Type
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
