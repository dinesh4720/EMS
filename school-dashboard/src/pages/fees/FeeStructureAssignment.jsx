import { useState, useEffect, useMemo } from "react";
import { Card, CardBody, Button, Select, SelectItem, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Divider, Textarea, Spinner, Chip, Badge, ButtonGroup } from "@heroui/react";
import { Save, Users, CheckCircle, AlertCircle, IndianRupee, Info, FileText, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { getAcademicYearOptions } from "../../utils/constants";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
  const { currentAcademicYear } = useApp();
  const academicYearOptions = useMemo(
    () => getAcademicYearOptions(currentAcademicYear, { past: 2, future: 2 }),
    [currentAcademicYear]
  );
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [academicYearOverride, setAcademicYearOverride] = useState(null);
  const [existingStructure, setExistingStructure] = useState(null);
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
    if (selectedClass) {
      fetchExistingStructure();
    }
  }, [selectedClass, academicYear]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/fee-templates`);
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const fetchExistingStructure = async () => {
    if (!selectedClass) return;

    try {
      const response = await fetch(`${API_URL}/fee-structure/class/${selectedClass}?academicYear=${academicYear}`);
      
      if (response.ok) {
        const data = await response.json();
        setExistingStructure(data);
        setFormData({
          templateId: data.templateId?._id || '',
          feeHeads: data.feeHeads || [],
          collectionSchedule: data.collectionSchedule || { mode: 'term', installments: [] },
          totalAnnualFee: data.totalAnnualFee || 0
        });
        if (data.templateId) {
          setSelectedTemplate(data.templateId._id);
        }
      } else {
        setExistingStructure(null);
        setFormData({
          templateId: '',
          feeHeads: [],
          collectionSchedule: { mode: 'term', installments: [] },
          totalAnnualFee: 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch structure:', error);
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
    if (!selectedClass || formData.feeHeads.length === 0) {
      toast.error('Please select a class and add fee heads');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        classId: selectedClass,
        academicYear,
        ...formData
      };

      const response = await fetch(`${API_URL}/fee-structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to save structure');

      toast.success('Fee structure saved successfully');
      fetchExistingStructure();
      
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
    } catch (error) {
      console.error('Failed to save structure:', error);
      toast.error('Failed to save fee structure');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewStudents = async () => {
    if (!selectedClass) return;

    try {
      const response = await fetch(`${API_URL}/students/class/${selectedClass}/fee-status?academicYear=${academicYear}`);
      const data = await response.json();
      setPreviewStudents(data);
      onPreviewOpen();
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast.error('Failed to load student list');
    }
  };

  const handleApplyToStudents = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }

    if (!confirm(`Are you sure you want to apply this fee structure to all students in this class?\n\nThis will update fee details for all active students.`)) {
      return;
    }

    setApplying(true);
    try {
      const response = await fetch(`${API_URL}/fee-structure/apply-to-students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          academicYear
        })
      });

      if (!response.ok) throw new Error('Failed to apply structure');

      const result = await response.json();
      toast.success(result.message || `Fee structure applied to all students`);
      onPreviewClose();
    } catch (error) {
      console.error('Failed to apply structure:', error);
      toast.error('Failed to apply fee structure to students');
    } finally {
      setApplying(false);
    }
  };

  const updateFeeHeadAmount = (index, amount) => {
    const updatedHeads = [...formData.feeHeads];
    updatedHeads[index].amount = parseInt(amount) || 0;
    
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
            <h3 className="text-lg font-bold text-default-900">Assign Fee Structure to Class</h3>
            <p className="text-sm text-default-500">Create or update fee structure for a specific class</p>
          </div>
          {existingStructure && (
            <Chip color="success" variant="flat" startContent={<CheckCircle size={16} />}>
              Structure Exists
            </Chip>
          )}
        </div>

        <Divider />

        {/* Class Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Select Class"
            placeholder="Choose a class"
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
            label="Academic Year"
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

            {/* Template Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-default-900">Select Fee Template</h4>
                  <p className="text-xs text-default-500">Choose from existing templates or create custom structure</p>
                </div>
              </div>

              <Select
                placeholder="Select a template (optional)"
                selectedKeys={selectedTemplate ? [selectedTemplate] : []}
                onChange={(e) => handleTemplateChange(e.target.value)}
                variant="bordered"
                classNames={{ trigger: "bg-white border-default-200" }}
              >
                {templates.map((template) => (
                  <SelectItem key={template._id} value={template._id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-default-500">
                        {template.section} • ₹{(template.totalAnnualFee || 0).toLocaleString()}/year
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
                      <h4 className="font-semibold text-default-900">Fee Heads</h4>
                      <p className="text-xs text-default-500">Review and customize amounts if needed</p>
                    </div>
                    <Badge color="primary" variant="flat" size="lg">
                      ₹{formData.totalAnnualFee.toLocaleString()}/year
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {formData.feeHeads.map((head, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-default-50 rounded-xl border border-default-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-default-900">{head.name}</span>
                            <Chip size="sm" color={head.mandatory ? "success" : "warning"} variant="flat">
                              {head.mandatory ? 'Mandatory' : 'Optional'}
                            </Chip>
                            <Chip size="sm" variant="flat">{head.frequency}</Chip>
                          </div>
                          <p className="text-xs text-default-500 mt-1">{head.category}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            label="Amount"
                            value={head.amount}
                            onValueChange={(v) => updateFeeHeadAmount(index, v)}
                            variant="bordered"
                            size="sm"
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
                      <h4 className="font-semibold text-default-900">Collection Schedule</h4>
                      <p className="text-xs text-default-500">Configure how fees will be collected</p>
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
                        <SelectItem key={mode.key} value={mode.key}>{mode.label}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formData.collectionSchedule.installments.map((installment, index) => (
                      <div key={index} className="p-4 bg-primary-50 rounded-xl border border-primary-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-primary-900">{installment.name}</span>
                          <Chip size="sm" color="primary" variant="flat">Due: {new Date(installment.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</Chip>
                        </div>
                        <p className="text-2xl font-bold text-primary-700">₹{installment.amount.toLocaleString()}</p>
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
                    Preview Students ({previewStudents.length})
                  </Button>
                  
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<Save size={18} />}
                    onPress={handleSaveStructure}
                    isLoading={saving}
                  >
                    Save Structure
                  </Button>

                  {existingStructure && (
                    <Button
                      color="success"
                      className="shadow-md"
                      startContent={<CheckCircle size={18} />}
                      onPress={handleApplyToStudents}
                      isLoading={applying}
                    >
                      Apply to Students
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
            <p className="text-default-500">Please select a class to assign fee structure</p>
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
                <h3 className="text-lg font-bold">Students in Class</h3>
                <p className="text-xs text-default-500">Review before applying fee structure</p>
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="py-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-default-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-default-900">{previewStudents.length}</p>
                <p className="text-xs text-default-500 uppercase tracking-wider">Total Students</p>
              </div>
              <div className="p-4 bg-warning-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-warning-700">{previewStudents.filter(s => s.status === 'pending').length}</p>
                <p className="text-xs text-warning-600 uppercase tracking-wider">Pending</p>
              </div>
              <div className="p-4 bg-success-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-success-700">{previewStudents.filter(s => s.status === 'paid').length}</p>
                <p className="text-xs text-success-600 uppercase tracking-wider">Fully Paid</p>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {previewStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-white border border-default-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-700">{student.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-default-900">{student.name}</p>
                      <p className="text-xs text-default-500">{student.admissionId} • Roll: {student.rollNo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-default-900">₹{student.balanceAmount.toLocaleString()}</p>
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
              Close
            </Button>
            <Button
              color="success"
              onPress={handleApplyToStudents}
              isLoading={applying}
              startContent={<CheckCircle size={18} />}
            >
              Apply to All Students
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}
