import { feesApi } from '../../services/api.js';
import { useState, useEffect, useMemo } from "react";
import { feeStructureAssignmentSchema, parseFormSchema } from '../../validators/formSchemas';
import { Card, CardBody, Button, Select, SelectItem, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Divider, Textarea, Spinner, Chip, Badge, ButtonGroup } from "@heroui/react";
import { Save, Users, CheckCircle, AlertCircle, IndianRupee, Info, FileText, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { useCurrency } from '../../context/hooks/useCurrency';
import { getAcademicYearOptions } from "../../utils/constants";
import { getDateLocale } from '../../i18n/index';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import logger from '../../utils/logger';




const COLLECTION_MODES = [
  { key: 'term', label: 'Term-wise' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'yearly', label: 'Yearly (One-time)' }
];

const getAcademicYearStart = (academicYear) => {
  const parsedYear = Number.parseInt(String(academicYear || '').split('-')[0], 10);
  return Number.isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;
};

const buildAcademicYearDate = (academicYear, month, day, useNextYear = false) => {
  const startYear = getAcademicYearStart(academicYear);
  const year = useNextYear ? startYear + 1 : startYear;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export default function FeeStructureAssignment({ classes, onAssignmentComplete }) {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const { currentAcademicYear } = useApp();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const academicYearOptions = useMemo(
    () => getAcademicYearOptions(currentAcademicYear, { past: 2, future: 2 }),
    [currentAcademicYear]
  );
  const [templates, setTemplates] = useState([]);

  const [templateError, setTemplateError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [academicYearOverride, setAcademicYearOverride] = useState(null);
  const [existingStructure, setExistingStructure] = useState(null);
  const [structureLoading, setStructureLoading] = useState(false);
  const academicYear = academicYearOverride || currentAcademicYear;
  
  const [formData, setFormData] = useState({
    templateId: '',
    feeHeads: [],
    collectionSchedule: {
      mode: 'term',
      installments: []
    },
    totalAnnualFee: 0
  });

  const [previewStudents, setPreviewStudents] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    // BUG-29: guard prevents API call with academicYear=undefined
    // Debounce to prevent rapid API calls when switching classes quickly
    if (selectedClass && academicYear) {
      const timer = setTimeout(() => fetchExistingStructure(), 300);
      return () => clearTimeout(timer);
    }
  }, [selectedClass, academicYear]);

  const fetchTemplates = async () => {
    setTemplateError(null);
    try {
      const data = await feesApi.getTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Failed to fetch templates:', error);
      setTemplateError(error.message || 'Failed to load fee templates');
      toast.error(t('toast.error.failedToLoadTemplates'));
    }
  };

  const fetchExistingStructure = async () => {
    if (!selectedClass) return;

    setStructureLoading(true);
    try {
      const data = await feesApi.getFeeStructure(selectedClass, academicYear);
      setExistingStructure(data);
      setFormData({
        templateId: data.templateId?._id || data.templateId || '',
        feeHeads: data.feeHeads || [],
        collectionSchedule: data.collectionSchedule || { mode: 'term', installments: [] },
        totalAnnualFee: data.totalAnnualFee || 0
      });
      if (data.templateId?._id) {
        setSelectedTemplate(data.templateId._id);
      }
    } catch (error) {
      // 404 = no structure yet, that's fine
      setExistingStructure(null);
      setSelectedTemplate('');
      setFormData({
        templateId: '',
        feeHeads: [],
        collectionSchedule: { mode: 'term', installments: [] },
        totalAnnualFee: 0
      });
    } finally {
      setStructureLoading(false);
    }
  };

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t._id === templateId);
    
    if (template) {
      setFormData({
        templateId: templateId,
        feeHeads: template.feeHeads || [],
        collectionSchedule: {
          mode: 'term',
          installments: generateInstallments(template.feeHeads, 'term', template.totalAnnualFee || 0)
        },
        totalAnnualFee: template.totalAnnualFee || 0
      });
    }
  };

  const generateInstallments = (feeHeads, mode, totalAnnualFee = formData.totalAnnualFee) => {
    const installments = [];

    if (mode === 'term') {
      installments.push(
        { name: 'Term 1', dueDate: buildAcademicYearDate(academicYear, 4, 15), amount: totalAnnualFee / 2, status: 'pending' },
        { name: 'Term 2', dueDate: buildAcademicYearDate(academicYear, 10, 15), amount: totalAnnualFee / 2, status: 'pending' }
      );
    } else if (mode === 'monthly') {
      const monthlyAmount = totalAnnualFee / 12;
      const monthlySchedule = [
        ['Apr', 4, false], ['May', 5, false], ['Jun', 6, false], ['Jul', 7, false],
        ['Aug', 8, false], ['Sep', 9, false], ['Oct', 10, false], ['Nov', 11, false],
        ['Dec', 12, false], ['Jan', 1, true], ['Feb', 2, true], ['Mar', 3, true]
      ];

      monthlySchedule.forEach(([label, month, useNextYear], index) => {
        installments.push({
          name: `${label} Fee`,
          dueDate: buildAcademicYearDate(academicYear, month, 10, useNextYear),
          amount: monthlyAmount,
          status: 'pending',
          order: index + 1
        });
      });
    } else if (mode === 'quarterly') {
      installments.push(
        { name: 'Q1 (Apr-Jun)', dueDate: buildAcademicYearDate(academicYear, 4, 15), amount: totalAnnualFee / 4, status: 'pending' },
        { name: 'Q2 (Jul-Sep)', dueDate: buildAcademicYearDate(academicYear, 7, 15), amount: totalAnnualFee / 4, status: 'pending' },
        { name: 'Q3 (Oct-Dec)', dueDate: buildAcademicYearDate(academicYear, 10, 15), amount: totalAnnualFee / 4, status: 'pending' },
        { name: 'Q4 (Jan-Mar)', dueDate: buildAcademicYearDate(academicYear, 1, 15, true), amount: totalAnnualFee / 4, status: 'pending' }
      );
    } else if (mode === 'yearly') {
      installments.push(
        { name: 'Annual', dueDate: buildAcademicYearDate(academicYear, 4, 15), amount: totalAnnualFee, status: 'pending' }
      );
    }

    return installments;
  };

  const handleSaveStructure = async () => {
    const { success, errors: zodErrors } = parseFormSchema(feeStructureAssignmentSchema, {
      classId: selectedClass,
      feeHeads: formData.feeHeads,
      academicYear,
    });
    if (!success) {
      toast.error(Object.values(zodErrors)[0] || t('toast.error.pleaseSelectAClassAndAddFeeHeads'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        classId: selectedClass,
        academicYear,
        ...formData
      };

      await feesApi.saveFeeStructure(payload);

      toast.success(t('toast.success.feeStructureSavedSuccessfully'));
      fetchExistingStructure();
      
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
    } catch (error) {
      logger.error('Failed to save structure:', error);
      toast.error(t('toast.error.failedToSaveFeeStructure'));
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewStudents = async () => {
    if (!selectedClass) return;

    try {
      const data = await feesApi.getClassFeeStatus(selectedClass, academicYear);
      setPreviewStudents(Array.isArray(data) ? data : []);
      onPreviewOpen();
    } catch (error) {
      logger.error('Failed to fetch students:', error);
      toast.error(t('toast.error.failedToLoadStudentList'));
    }
  };

  const handleApplyToStudents = async () => {
    if (!selectedClass) {
      toast.error(t('toast.error.pleaseSelectAClassFirst'));
      return;
    }

    showConfirm({
      title: t('pages.applyFeeStructure', 'Apply Fee Structure'),
      message: t('confirm.applyFeeStructure', 'Apply this fee structure to all students in the selected class? This cannot be undone.'),
      variant: 'warning',
      confirmText: t('pages.apply', 'Apply'),
      onConfirm: async () => {
        setApplying(true);
        try {
          const result = await feesApi.applyToStudents({ classId: selectedClass, academicYear });
          toast.success(result.message || t('toast.success.feeStructureApplied'));
          onPreviewClose();
        } catch (error) {
          logger.error('Failed to apply structure:', error);
          toast.error(t('toast.error.failedToApplyFeeStructureToStudents'));
        } finally {
          setApplying(false);
        }
      },
    });
  };

  const updateFeeHeadAmount = (index, amount) => {
    const updatedHeads = [...formData.feeHeads];
    updatedHeads[index].amount = Math.max(0, parseFloat(amount) || 0);
    
    // Recalculate total
    const newTotal = updatedHeads.reduce((sum, head) => {
      let annualAmount = head.amount;
      if (head.frequency === 'monthly') annualAmount *= 12;
      else if (head.frequency === 'quarterly') annualAmount *= 4;
      else if (head.frequency === 'term' && head.applicableTerms) annualAmount *= head.applicableTerms.length;
      return sum + annualAmount;
    }, 0);

    setFormData({
      ...formData,
      feeHeads: updatedHeads,
      totalAnnualFee: newTotal,
      collectionSchedule: {
        ...formData.collectionSchedule,
        installments: generateInstallments(updatedHeads, formData.collectionSchedule.mode, newTotal)
      }
    });
  };

  return (
    <Card className="shadow-sm border border-default-200">
      <CardBody className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-default-900">{t('pages.assignFeeStructureToClass')}</h3>
            <p className="text-sm text-default-500">{t('pages.createOrUpdateFeeStructureForASpecificClass')}</p>
          </div>
          {existingStructure && (
            <Chip color="success" variant="flat" startContent={<CheckCircle size={16} />}>
              {t('pages.structureExists')}
            </Chip>
          )}
        </div>

        <Divider />

        {/* Class Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={t('pages.selectClass1')}
            placeholder={t('pages.chooseAClass')}
            selectedKeys={selectedClass ? [selectedClass] : []}
            onChange={(e) => setSelectedClass(e.target.value)}
            variant="bordered"
          >
            {classes?.map((cls) => (
              <SelectItem key={cls._id} value={cls._id}>
                {cls.name} - {cls.section}
              </SelectItem>
            ))}
          </Select>

          <Select
            label={t('pages.academicYear1')}
            variant="bordered"
            selectedKeys={[academicYear]}
            onChange={(e) => {
              const nextAcademicYear = e.target.value;
              setAcademicYearOverride(nextAcademicYear === currentAcademicYear ? null : nextAcademicYear);
            }}
          >
            {academicYearOptions.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </Select>
        </div>

        {selectedClass && (
          <>
            <Divider />

            {/* Structure loading indicator */}
            {structureLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 py-2">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                {t('pages.loadingFeeStructure', 'Loading fee structure...')}
              </div>
            )}

            {/* Template load error */}
            {templateError && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">{t('toast.error.failedToLoadFeeTemplates')}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{templateError}</p>
                </div>
                <Button size="sm" variant="flat" color="danger" onPress={fetchTemplates}>{t('pages.retry')}</Button>
              </div>
            )}

            {/* Template Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-default-900">{t('pages.selectFeeTemplate')}</h4>
                  <p className="text-xs text-default-500">{t('pages.chooseFromExistingTemplatesOrCreateCustomStructure')}</p>
                </div>
              </div>

              <Select
                placeholder={t('pages.selectATemplateOptional')}
                selectedKeys={selectedTemplate ? [selectedTemplate] : []}
                onChange={(e) => handleTemplateChange(e.target.value)}
                variant="bordered"
                classNames={{ trigger: "bg-white dark:bg-zinc-950 border-default-200" }}
              >
                {templates.map((template) => (
                  <SelectItem key={template._id} value={template._id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-default-500">
                        {template.section} • {fmt(template.totalAnnualFee || 0)}/year
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            {formData.feeHeads.length > 0 && (
              <>
                <Divider />

                {/* Fee Heads Summary */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-default-900">{t('pages.feeHeads1')}</h4>
                      <p className="text-xs text-default-500">{t('pages.reviewAndCustomizeAmountsIfNeeded')}</p>
                    </div>
                    <Badge color="primary" variant="flat" size="lg">
                      {fmt(formData.totalAnnualFee)}/year
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {formData.feeHeads.map((head, index) => (
                      <div key={head._id || head.name || index} className="flex items-center justify-between p-4 bg-default-50 rounded-xl border border-default-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-default-900">{head.name}</span>
                            <Chip size="sm" color={head.mandatory ? "success" : "warning"} variant="flat">
                              {head.mandatory ? t('common.mandatory') : t('common.optional')}
                            </Chip>
                            <Chip size="sm" variant="flat">{head.frequency}</Chip>
                          </div>
                          <p className="text-xs text-default-500 mt-1">{head.category}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            label={t('pages.amount1')}
                            value={head.amount}
                            onValueChange={(v) => updateFeeHeadAmount(index, v)}
                            variant="bordered"
                            size="sm"
                            min={0}
                            startContent={<IndianRupee size={16} className="text-default-400" />}
                            className="w-32"
                          />
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => {
                              const updatedHeads = formData.feeHeads.filter((_, i) => i !== index);
                              setFormData({ ...formData, feeHeads: updatedHeads });
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collection Schedule */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-default-900">{t('pages.collectionSchedule')}</h4>
                      <p className="text-xs text-default-500">{t('pages.configureHowFeesWillBeCollected')}</p>
                    </div>
                    <Select
                      size="sm"
                      variant="bordered"
                      selectedKeys={[formData.collectionSchedule.mode]}
                      onChange={(e) => {
                        const newMode = e.target.value;
                        setFormData({
                          ...formData,
                          collectionSchedule: {
                            mode: newMode,
                            installments: generateInstallments(formData.feeHeads, newMode, formData.totalAnnualFee)
                          }
                        });
                      }}
                      className="w-48"
                    >
                      {COLLECTION_MODES.map(mode => (
                        <SelectItem key={mode.key} value={mode.key}>{t(`fees.collectionMode.${mode.key}`)}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formData.collectionSchedule.installments.map((installment) => (
                      <div key={installment._id || installment.name} className="p-4 bg-primary-50 rounded-xl border border-primary-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-primary-900">{installment.name}</span>
                          <Chip size="sm" color="primary" variant="flat">{t('fees.dueLabel', { date: installment.dueDate ? new Date(installment.dueDate).toLocaleDateString(getDateLocale(), { month: 'short', day: 'numeric' }) : '—' })}</Chip>
                        </div>
                        <p className="text-2xl font-bold text-primary-700">{fmt(installment.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 justify-end">
                  <Button
                    variant="bordered"
                    color="primary"
                    startContent={<Users size={18} />}
                    onPress={handlePreviewStudents}
                    isDisabled={!existingStructure}
                  >
                    {t('pages.previewStudents')} ({previewStudents.length})
                  </Button>
                  
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<Save size={18} />}
                    onPress={handleSaveStructure}
                    isLoading={saving}
                  >
                    {t('pages.saveStructure')}
                  </Button>

                  {existingStructure && (
                    <Button
                      color="success"
                      className="shadow-md"
                      startContent={<CheckCircle size={18} />}
                      onPress={handleApplyToStudents}
                      isLoading={applying}
                    >
                      {t('pages.applyToStudents1')}
                    </Button>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {!selectedClass && (
          <div className="text-center py-12">
            <Info size={48} className="mx-auto text-default-300 mb-4" />
            <p className="text-default-500">{t('pages.pleaseSelectAClassToAssignFeeStructure')}</p>
          </div>
        )}
      </CardBody>

      {/* Students Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="4xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <Users size={24} className="text-primary" />
              <div>
                <h3 className="text-lg font-bold">{t('pages.studentsInClass')}</h3>
                <p className="text-xs text-default-500">{t('pages.reviewBeforeApplyingFeeStructure')}</p>
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="py-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-default-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-default-900">{previewStudents.length}</p>
                <p className="text-xs text-default-500 uppercase tracking-wider">{t('pages.totalStudents1')}</p>
              </div>
              <div className="p-4 bg-warning-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-warning-700">{previewStudents.filter(s => s.status === 'pending').length}</p>
                <p className="text-xs text-warning-600 uppercase tracking-wider">{t('pages.pending2')}</p>
              </div>
              <div className="p-4 bg-success-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-success-700">{previewStudents.filter(s => s.status === 'paid').length}</p>
                <p className="text-xs text-success-600 uppercase tracking-wider">{t('pages.fullyPaid')}</p>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {previewStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-950 border border-default-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-700">{student.name?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <p className="font-medium text-default-900">{student.name}</p>
                      <p className="text-xs text-default-500">{student.admissionId} • {t('fees.rollLabel', { rollNo: student.rollNo })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-default-900">{fmt(student.balanceAmount)}</p>
                    <Chip 
                      size="sm" 
                      color={student.status === 'paid' ? 'success' : student.status === 'partial' ? 'warning' : 'danger'}
                      variant="flat"
                      className="text-xs"
                    >
                      {student.status}
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="light" onPress={onPreviewClose}>
              {t('common.close')}
            </Button>
            <Button
              color="success"
              onPress={handleApplyToStudents}
              isLoading={applying}
              startContent={<CheckCircle size={18} />}
            >
              {t('pages.applyToAllStudents')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </Card>
  );
}
