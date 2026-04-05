import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader, Button, Input, Divider, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { Plus, Edit, Trash2, DollarSign, X } from "lucide-react";
import { useTranslation } from 'react-i18next';
import toast from "react-hot-toast";
import { settingsApi } from '../../services/api';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';

export default function SalaryTemplates() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await settingsApi.getSalaryTemplates();
      setTemplates(res?.data || []);
    } catch {
      toast.error('Failed to load salary templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleEdit = (template) => {
    setEditingTemplate({ ...template, breakdown: [...template.breakdown] });
    onOpen();
  };

  const handleNew = () => {
    setEditingTemplate({
      name: "",
      breakdown: [{ component: "", amount: 0 }]
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!editingTemplate?.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: editingTemplate.name.trim(),
        breakdown: editingTemplate.breakdown.filter(b => b.component.trim()),
      };

      if (editingTemplate._id) {
        await settingsApi.updateSalaryTemplate(editingTemplate._id, payload);
        toast.success('Template updated');
      } else {
        await settingsApi.createSalaryTemplate(payload);
        toast.success('Template created');
      }
      onClose();
      setEditingTemplate(null);
      await fetchTemplates();
    } catch (err) {
      toast.error(err?.error || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Template',
      message: t('confirm.deleteTemplate'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await settingsApi.deleteSalaryTemplate(id);
          toast.success('Template deleted');
          await fetchTemplates();
        } catch {
          toast.error('Failed to delete template');
        }
      },
    });
  };

  const updateBreakdownItem = (index, field, value) => {
    const updated = [...editingTemplate.breakdown];
    updated[index] = { ...updated[index], [field]: field === "amount" ? Number(value) : value };
    setEditingTemplate({ ...editingTemplate, breakdown: updated });
  };

  const addBreakdownItem = () => {
    setEditingTemplate({
      ...editingTemplate,
      breakdown: [...editingTemplate.breakdown, { component: "", amount: 0 }]
    });
  };

  const removeBreakdownItem = (index) => {
    setEditingTemplate({
      ...editingTemplate,
      breakdown: editingTemplate.breakdown.filter((_, i) => i !== index)
    });
  };

  const calculateTotal = (breakdown) => {
    return breakdown.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  if (loading) return <TablePageSkeleton kpiCards={0} searchBar={false} rows={4} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-medium">{t('pages.salaryTemplates')}</h2>
          <p className="text-sm text-default-500 mt-1">{t('pages.manageSalaryTemplatesForDifferentStaffRoles')}</p>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={handleNew}>
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => {
          const total = calculateTotal(template.breakdown);
          return (
            <Card key={template._id} className="shadow-sm border border-default-200">
              <CardHeader className="flex justify-between items-center pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign size={18} className="text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">{template.name}</h3>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" isIconOnly variant="light" onPress={() => handleEdit(template)} title={t('pages.editTemplate')}>
                    <Edit size={16} />
                  </Button>
                  <Button size="sm" isIconOnly variant="light" color="danger" onPress={() => handleDelete(template._id)} title={t('pages.deleteTemplate1')}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardHeader>
              <Divider />
              <CardBody className="pt-4">
                <div className="space-y-2 mb-4">
                  {template.breakdown.map((item, i) => (
                    <div key={`${template._id}-${item.component}`} className="flex justify-between text-sm">
                      <span className="text-default-600">{item.component}</span>
                      <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <Divider className="mb-3" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{t('pages.totalMonthly')}</span>
                  <Chip color="success" variant="flat" size="lg" classNames={{ content: "font-bold" }}>
                    ₹{total.toLocaleString()}
                  </Chip>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Edit/Create Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onModalClose) => (
            <>
              <ModalHeader>
                {editingTemplate?._id ? "Edit" : "Create"} Salary Template
              </ModalHeader>
              <ModalBody>
                {editingTemplate && (
                  <div className="space-y-4">
                    <Input
                      label={t('pages.templateName')}
                      placeholder={t('settings.salaryTemplateNamePlaceholder')}
                      value={editingTemplate.name}
                      onValueChange={v => setEditingTemplate({ ...editingTemplate, name: v })}
                      variant="bordered"
                      isRequired
                    />

                    <Divider />

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">{t('pages.salaryComponents')}</label>
                        <Button size="sm" variant="flat" color="primary" startContent={<Plus size={16} />}
                          onPress={addBreakdownItem}>
                          Add Component
                        </Button>
                      </div>

                      {editingTemplate.breakdown.map((item, i) => (
                        <div key={`edit-breakdown-${i}`} className="p-3 bg-default-50 rounded-lg border border-default-200">
                          <div className="flex gap-3 items-start">
                            <Input
                              size="sm"
                              label={t('pages.componentName')}
                              placeholder={t('settings.salaryComponentPlaceholder')}
                              value={item.component}
                              onValueChange={v => updateBreakdownItem(i, "component", v)}
                              variant="bordered"
                              className="flex-1"
                            />
                            <Input
                              size="sm"
                              label={t('pages.amount1')}
                              type="number"
                              value={item.amount}
                              onValueChange={v => updateBreakdownItem(i, "amount", v)}
                              variant="bordered"
                              className="flex-1"
                              startContent="₹"
                            />
                            <Button
                              size="sm"
                              isIconOnly
                              variant="light"
                              color="danger"
                              onPress={() => removeBreakdownItem(i)}
                              className="mt-1"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <div className="p-4 bg-success-50 rounded-lg border border-success-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{t('pages.totalMonthlySalary1')}</span>
                          <span className="text-xl font-bold text-success">
                            ₹{calculateTotal(editingTemplate.breakdown).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onModalClose}>{t('pages.cancel2')}</Button>
                <Button color="primary" onPress={handleSave} isLoading={saving} isDisabled={!editingTemplate?.name.trim()}>
                  Save Template
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
