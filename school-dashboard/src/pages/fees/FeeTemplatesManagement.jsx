import { request } from '../../services/api.js';
import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardBody, Button, Input, Select, SelectItem, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Switch, Divider, Textarea } from "@heroui/react";
import { Plus, Edit, Trash2, IndianRupee, Copy, Save, Layers, FolderTree } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { useCurrency } from '../../context/hooks/useCurrency';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import logger from '../../utils/logger';



const SECTIONS = [
  { key: 'primary', label: 'Primary Section (Classes 1-5)' },
  { key: 'middle', label: 'Middle School (Classes 6-8)' },
  { key: 'secondary', label: 'Secondary School (Classes 9-10)' },
  { key: 'senior', label: 'Senior Secondary (Classes 11-12)' }
];

const FREQUENCIES = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'term', label: 'Term-wise' },
  { key: 'yearly', label: 'Yearly (One-time)' },
  { key: 'one-time', label: 'One-time (Admission)' }
];

const CATEGORIES = ['Academic', 'Transport', 'Extra-curricular', 'Hostel', 'Other'];

export default function FeeTemplatesManagement() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const { currentAcademicYear } = useApp();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const CATEGORY_LABELS = {
    Academic: t('fees.category.academic'),
    Transport: t('fees.category.transport'),
    'Extra-curricular': t('fees.category.extraCurricular'),
    Hostel: t('fees.category.hostel'),
    Other: t('fees.category.other'),
  };
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    section: 'primary',
    applicableFor: [],
    feeHeads: [],
    isActive: true
  });

  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await request(`/fee-templates?academicYear=${currentAcademicYear}`);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Failed to fetch templates:', error);
      toast.error(t('toast.error.failedToLoadFeeTemplates'));
    } finally {
      setLoading(false);
    }
  }, [currentAcademicYear, t]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleOpen = (template = null) => {
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        section: template.section,
        applicableFor: template.applicableFor || [],
        feeHeads: template.feeHeads || [],
        isActive: template.isActive
      });
    } else {
      setSelectedTemplate(null);
      setFormData({
        name: '',
        description: '',
        section: 'primary',
        applicableFor: [],
        feeHeads: [
          { name: 'Tuition Fee', category: 'Academic', amount: 5000, frequency: 'monthly', mandatory: true, applicableTerms: [1, 2], dueDay: 10, refundable: false }
        ],
        isActive: true
      });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error(t('toast.error.templateNameIsRequired'));
      return;
    }

    if (formData.feeHeads.length === 0) {
      toast.error(t('toast.error.atLeastOneFeeHeadIsRequired'));
      return;
    }

    // Validate all fee heads have non-empty names
    const emptyNameHead = formData.feeHeads.find(head => !head.name?.trim());
    if (emptyNameHead) {
      toast.error(t('toast.error.allFeeHeadsMustHaveName', 'All fee heads must have a name'));
      return;
    }

    setSaving(true);
    try {
      const totalAnnualFee = calculateTotalAnnualFee();
      const payload = { ...formData, totalAnnualFee };

      const endpoint = selectedTemplate
        ? `/fee-templates/${selectedTemplate._id}`
        : `/fee-templates`;

      await request(endpoint, {
        method: selectedTemplate ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });

      toast.success(selectedTemplate ? t('toast.success.templateUpdatedSuccessfully') : t('toast.success.templateCreatedSuccessfully'));
      onClose();
      fetchTemplates();
    } catch (error) {
      logger.error('Failed to save template:', error);
      toast.error(error.message || t('toast.error.failedToSaveTemplate'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    let usageInfo = null;
    try {
      usageInfo = await request(`/fee-templates/${id}/usage`);
    } catch {
      // proceed without usage count if fetch fails
    }

    let message = t('confirm.deleteFeeTemplate');
    if (usageInfo?.studentCount > 0) {
      message += ' ' + t('fees.templateUsedByStudents', { studentCount: usageInfo.studentCount, structureCount: usageInfo.structureCount });
    } else if (usageInfo?.structureCount > 0) {
      message += ' ' + t('fees.templateUsedByStructures', { structureCount: usageInfo.structureCount });
    }

    showConfirm({
      title: t('pages.deleteFeeTemplate', 'Delete Fee Template'),
      message,
      variant: 'danger',
      confirmText: t('pages.delete', 'Delete'),
      onConfirm: async () => {
        try {
          await request(`/fee-templates/${id}`, { method: 'DELETE' });

          toast.success(t('toast.success.templateDeletedSuccessfully'));
          fetchTemplates();
        } catch (error) {
          logger.error('Failed to delete template:', error);
          toast.error(error.message || t('toast.error.failedToDeleteTemplate'));
        }
      },
    });
  };

  const calculateTotalAnnualFee = () => {
    return formData.feeHeads.reduce((total, head) => {
      let annualAmount = head.amount;
      if (head.frequency === 'monthly') annualAmount *= 12;
      else if (head.frequency === 'quarterly') annualAmount *= 4;
      else if (head.frequency === 'term' && head.applicableTerms) annualAmount *= head.applicableTerms.length;
      // 'yearly' and 'one-time' are charged once per year — multiply by 1 (no change needed,
      // but explicitly handled so future frequencies don't accidentally accumulate)
      // else if (['yearly', 'one-time'].includes(head.frequency)) annualAmount *= 1;
      return total + annualAmount;
    }, 0);
  };

  const addFeeHead = () => {
    setFormData({
      ...formData,
      feeHeads: [
        ...formData.feeHeads,
        {
          name: '',
          category: 'Academic',
          amount: 0,
          frequency: 'yearly',
          mandatory: true,
          applicableTerms: [1, 2],
          dueDay: 10,
          refundable: false
        }
      ]
    });
  };

  const updateFeeHead = (index, field, value) => {
    const updatedHeads = [...formData.feeHeads];
    updatedHeads[index] = { ...updatedHeads[index], [field]: value };
    setFormData({ ...formData, feeHeads: updatedHeads });
  };

  const removeFeeHead = (index) => {
    setFormData({
      ...formData,
      feeHeads: formData.feeHeads.filter((_, i) => i !== index)
    });
  };

  const duplicateTemplate = async (template) => {
    const duplicated = {
      ...template,
      name: `${template.name} (Copy)`,
      _id: undefined
    };

    try {
      await request(`/fee-templates`, {
        method: 'POST',
        body: JSON.stringify(duplicated)
      });

      toast.success(t('toast.success.templateDuplicatedSuccessfully'));
      fetchTemplates();
    } catch (error) {
      logger.error('Failed to duplicate template:', error);
      toast.error(t('toast.error.failedToDuplicateTemplate'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-4 w-72 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 p-5 space-y-3">
              <div className="h-5 w-32 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="h-3 w-full bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-16 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse" />
                <div className="h-6 w-20 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-default-900">{t('pages.feeTemplates')}</h2>
          <p className="text-sm text-default-500 mt-1">{t('pages.createAndManageReusableFeeStructuresForDifferentSections')}</p>
        </div>
        <Button
          color="primary"
          radius="full"
          className="shadow-md font-medium px-6"
          startContent={<Plus size={18} />}
          onPress={() => handleOpen()}
        >
          {t('pages.createTemplate')}
        </Button>
      </div>

      {/* Templates Grid by Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECTIONS.map((section) => {
          const sectionTemplates = templates.filter(tmpl => tmpl.section === section.key);
          return (
            <Card key={section.key} className="shadow-sm border border-default-200">
              <CardHeader className="flex gap-3 px-5 py-4 bg-default-50/50">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <FolderTree size={24} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-default-900">{t('fees.section.' + section.key)}</h3>
                  <p className="text-xs text-default-500">{t('fees.templateCount', { count: sectionTemplates.length })}</p>
                </div>
              </CardHeader>
              <Divider />
              <CardBody className="p-4 space-y-3">
                {sectionTemplates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-default-400">{t('pages.noTemplatesInThisSection')}</p>
                  </div>
                ) : (
                  sectionTemplates.map((template) => (
                    <div
                      key={template._id}
                      className="p-4 bg-white dark:bg-zinc-950 border border-default-200 rounded-xl hover:border-primary-300 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-default-900">{template.name}</h4>
                            {template.isActive ? (
                              <Chip size="sm" color="success" variant="flat">{t('pages.active')}</Chip>
                            ) : (
                              <Chip size="sm" color="default" variant="flat">{t('pages.inactive')}</Chip>
                            )}
                          </div>
                          {template.description && (
                            <p className="text-xs text-default-500 mt-1">{template.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => handleOpen(template)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="secondary"
                            onPress={() => duplicateTemplate(template)}
                          >
                            <Copy size={16} />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDelete(template._id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-default-50 rounded-lg p-3">
                          <p className="text-xs text-default-500 uppercase tracking-wider mb-1">{t('pages.feeHeads1')}</p>
                          <p className="text-lg font-bold text-default-900">{template.feeHeads?.length || 0}</p>
                        </div>
                        <div className="bg-success-50 rounded-lg p-3">
                          <p className="text-xs text-success-600 uppercase tracking-wider mb-1">{t('pages.annualFee')}</p>
                          <p className="text-lg font-bold text-success-700">{fmt(template.totalAnnualFee || 0)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {template.feeHeads?.slice(0, 3).map((head) => (
                          <Chip key={head._id || head.name} size="sm" variant="flat" className="text-xs">
                            {head.name}
                          </Chip>
                        ))}
                        {template.feeHeads?.length > 3 && (
                          <Chip size="sm" variant="flat" className="text-xs">
                            {t('fees.moreCount', { count: template.feeHeads.length - 3 })}
                          </Chip>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Layers size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">{selectedTemplate ? t('pages.editFeeTemplate') : t('pages.createFeeTemplate')}</h3>
                <p className="text-xs text-default-500">{t('pages.defineFeeStructureForASection')}</p>
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="gap-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('pages.templateName')}
                placeholder={`e.g., Primary Section ${currentAcademicYear}`}
                value={formData.name}
                onValueChange={(val) => setFormData({ ...formData, name: val })}
                variant="bordered"
                isRequired
              />
              <Select
                label={t('pages.section1')}
                variant="bordered"
                selectedKeys={[formData.section]}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              >
                {SECTIONS.map(sec => (
                  <SelectItem key={sec.key} value={sec.key}>{t('fees.section.' + sec.key)}</SelectItem>
                ))}
              </Select>
            </div>

            <Textarea
              label={t('pages.description1')}
              placeholder={t('pages.briefDescriptionOfThisFeeTemplate')}
              value={formData.description}
              onValueChange={(val) => setFormData({ ...formData, description: val })}
              variant="bordered"
              minRows={2}
            />

            <Divider />

            {/* Fee Heads */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-default-900">{t('pages.feeHeads1')}</h4>
                  <p className="text-xs text-default-500">{t('pages.defineAllFeeComponents')}</p>
                </div>
                <Button
                  color="primary"
                  size="sm"
                  variant="flat"
                  startContent={<Plus size={16} />}
                  onPress={addFeeHead}
                >
                  {t('pages.addFeeHead')}
                </Button>
              </div>

              <div className="space-y-4">
                {formData.feeHeads.length === 0 && (
                  <div className="text-center py-8 text-default-400 border-2 border-dashed border-default-200 rounded-lg">
                    <p className="text-sm">{t('fees.noFeeHeadsAdded', 'No fee heads added yet. Click "Add Fee Head" to get started.')}</p>
                  </div>
                )}
                {formData.feeHeads.map((head, index) => (
                  <div key={head._id || head.name || index} className="p-4 bg-default-50 rounded-xl border border-default-200">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-semibold text-default-700">{t('fees.feeHeadNum', { num: index + 1 })}</h5>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => removeFeeHead(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label={t('pages.feeHeadName')}
                        placeholder={t('fees.feeHeadNamePlaceholder')}
                        value={head.name}
                        onValueChange={(val) => updateFeeHead(index, 'name', val)}
                        variant="bordered"
                        size="sm"
                      />
                      <Select
                        label={t('pages.category1')}
                        variant="bordered"
                        selectedKeys={[head.category]}
                        onChange={(e) => updateFeeHead(index, 'category', e.target.value)}
                        size="sm"
                      >
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</SelectItem>
                        ))}
                      </Select>
                      <Select
                        label={t('pages.frequency')}
                        variant="bordered"
                        selectedKeys={[head.frequency]}
                        onChange={(e) => updateFeeHead(index, 'frequency', e.target.value)}
                        size="sm"
                      >
                        {FREQUENCIES.map(freq => (
                          <SelectItem key={freq.key} value={freq.key}>{t('fees.frequency.' + freq.key)}</SelectItem>
                        ))}
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                      <Input
                        type="number"
                        label={t('fees.amountLabel')}
                        placeholder={t('fees.amountPlaceholder')}
                        value={head.amount}
                        onValueChange={(val) => updateFeeHead(index, 'amount', Math.max(0, parseInt(val) || 0))}
                        variant="bordered"
                        startContent={<IndianRupee size={16} className="text-default-400" />}
                        size="sm"
                      />
                      <Input
                        type="number"
                        label={t('pages.dueDay')}
                        placeholder={t('fees.dueDayPlaceholder')}
                        value={head.dueDay}
                        onValueChange={(val) => updateFeeHead(index, 'dueDay', parseInt(val) || 10)}
                        variant="bordered"
                        size="sm"
                      />
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-950 rounded-lg border border-default-200">
                        <Switch
                          size="sm"
                          isSelected={head.mandatory}
                          onValueChange={(val) => updateFeeHead(index, 'mandatory', val)}
                        >
                          <span className="text-sm">{t('pages.mandatory')}</span>
                        </Switch>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-950 rounded-lg border border-default-200">
                        <Switch
                          size="sm"
                          isSelected={head.refundable}
                          onValueChange={(val) => updateFeeHead(index, 'refundable', val)}
                        >
                          <span className="text-sm">{t('pages.refundable')}</span>
                        </Switch>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {formData.feeHeads.length > 0 && (
                <div className="mt-4 p-4 bg-success-50 rounded-xl border border-success-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-success-800">{t('pages.totalAnnualFee')}</p>
                      <p className="text-xs text-success-600">{t('pages.sumOfAllFeeHeadsAnnualized')}</p>
                    </div>
                    <p className="text-2xl font-bold text-success-700">
                      {fmt(calculateTotalAnnualFee())}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter className="pt-2">
            <Button variant="light" onPress={onClose} className="font-medium">
              {t('common.cancel')}
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              isDisabled={!formData.name.trim() || formData.feeHeads.length === 0}
              isLoading={saving}
              className="font-medium shadow-md"
              startContent={<Save size={18} />}
            >
              {selectedTemplate ? t('pages.updateTemplate') : t('pages.createTemplate')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
