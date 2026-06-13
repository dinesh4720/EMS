import { useState } from "react";
import {
  Card, CardBody, CardHeader, Button, Input, Divider,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { Plus, Trash2, IndianRupee, ArrowUpRight, ArrowDownRight, CheckCircle } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../../hooks/useConfirmDialog';

export default function SalaryComponents() {
  const { t } = useTranslation();
  const { salarySettings, updateSalarySettings } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const [modalType, setModalType] = useState("earnings");
  const [itemName, setItemName] = useState("");

  const handleOpenAdd = (type) => {
    setModalType(type);
    setItemName("");
    onOpen();
  };

  const handleAdd = () => {
    if (!itemName.trim()) return;
    updateSalarySettings(modalType, "add", { name: itemName });
    onClose();
  };

  // [AUDIT-557] Added confirmation before removing salary components
  const handleRemove = (type, id) => {
    showConfirm({
      title: 'Remove Salary Component',
      message: 'Are you sure you want to remove this salary component? This cannot be undone.',
      variant: 'danger',
      confirmText: 'Remove',
      onConfirm: async () => {
        updateSalarySettings(type, "remove", { id });
      },
    });
  };

  const earnings = salarySettings?.earnings || [];
  const deductions = salarySettings?.deductions || [];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-[var(--ok-bg)] rounded-lg border border-[var(--ok-border)]">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight size={18} className="text-[var(--ok)]" />
            <span className="text-xs text-[var(--ok)] uppercase tracking-wider font-medium">
              {t("pages.earningsComponents")}
            </span>
          </div>
          <p className="text-2xl font-semibold text-[var(--ok)]">
            {earnings.length}
          </p>
        </div>
        <div className="p-4 bg-[var(--danger-bg)] rounded-lg border border-[var(--danger-border)]">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight size={18} className="text-[var(--danger)]" />
            <span className="text-xs text-[var(--danger)] uppercase tracking-wider font-medium">
              {t("pages.deductionsComponents")}
            </span>
          </div>
          <p className="text-2xl font-semibold text-[var(--danger)]">
            {deductions.length}
          </p>
        </div>
        <div className="p-4 bg-[var(--accent-bg)] rounded-lg border border-[var(--accent-border)]">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={18} className="text-[var(--accent)]" />
            <span className="text-xs text-[var(--accent)] uppercase tracking-wider font-medium">
              Total Components
            </span>
          </div>
          <p className="text-2xl font-semibold text-[var(--accent)]">
            {earnings.length + deductions.length}
          </p>
        </div>
        <div className="p-4 bg-[var(--warn-bg)] rounded-lg border border-[var(--warn-border)]">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-[var(--warn)]" />
            <span className="text-xs text-[var(--warn)] uppercase tracking-wider font-medium">
              Status
            </span>
          </div>
          <p className="text-lg font-semibold text-[var(--warn)]">Configured</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Card */}
        <Card className="shadow-sm border border-border-token">
          <CardHeader className="flex justify-between items-center px-6 pt-5 pb-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--ok-bg)] rounded-lg">
                <ArrowUpRight size={20} className="text-[var(--ok)]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-fg">
                  {t("pages.earningsComponents")}
                </h3>
                <p className="text-xs text-fg-muted">
                  {t("pages.defineSalaryAdditions")}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              color="success"
              variant="flat"
              startContent={<Plus size={14} />}
              onPress={() => handleOpenAdd("earnings")}
            >
              Add
            </Button>
          </CardHeader>
          <Divider className="mt-4" />
          <CardBody className="px-6 py-4">
            {earnings.length === 0 ? (
              <p className="text-sm text-fg-faint text-center py-6">
                No earning components added yet
              </p>
            ) : (
              <div className="space-y-1">
                {earnings.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-surface-2 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--ok-bg)]" />
                      <span className="text-sm font-medium text-fg">
                        {item.name}
                      </span>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="light"
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      onPress={() => handleRemove("earnings", item.id)}
                      aria-label={t("pages.removeComponent")}
                      title={t("pages.removeComponent")}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Deductions Card */}
        <Card className="shadow-sm border border-border-token">
          <CardHeader className="flex justify-between items-center px-6 pt-5 pb-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--danger-bg)] rounded-lg">
                <ArrowDownRight size={20} className="text-[var(--danger)]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-fg">
                  {t("pages.deductionsComponents")}
                </h3>
                <p className="text-xs text-fg-muted">
                  {t("pages.defineSalaryDeductions")}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              startContent={<Plus size={14} />}
              onPress={() => handleOpenAdd("deductions")}
            >
              Add
            </Button>
          </CardHeader>
          <Divider className="mt-4" />
          <CardBody className="px-6 py-4">
            {deductions.length === 0 ? (
              <p className="text-sm text-fg-faint text-center py-6">
                No deduction components added yet
              </p>
            ) : (
              <div className="space-y-1">
                {deductions.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-surface-2 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--danger-bg)]" />
                      <span className="text-sm font-medium text-fg">
                        {item.name}
                      </span>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="light"
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      onPress={() => handleRemove("deductions", item.id)}
                      aria-label={t("pages.removeComponent")}
                      title={t("pages.removeComponent")}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Add Component Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            {modalType === "earnings" ? (
              <ArrowUpRight size={18} className="text-[var(--ok)]" />
            ) : (
              <ArrowDownRight size={18} className="text-[var(--danger)]" />
            )}
            Add {modalType === "earnings" ? "Earning" : "Deduction"} Component
          </ModalHeader>
          <ModalBody>
            <Input
              label={t("pages.componentName")}
              placeholder={t("settings.payrollComponentPlaceholder")}
              value={itemName}
              onValueChange={setItemName}
              variant="bordered"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              {t("pages.cancel2")}
            </Button>
            <Button
              color="primary"
              onPress={handleAdd}
              isDisabled={!itemName.trim()}
            >
              {t("pages.add1")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
