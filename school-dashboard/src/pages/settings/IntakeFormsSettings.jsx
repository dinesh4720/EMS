import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Checkbox,
  Textarea,
} from "@heroui/react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Copy,
  FileText,
  GripVertical,
  X,
  Upload,
  Send,
} from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import toast from "react-hot-toast";
import { intakeFormsApi } from "../../services/api";
import { formTemplates } from "../../data/formTemplates";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from 'react-i18next';

// Field types available in form builder
const FIELD_TYPES = [
  { key: "text", label: "Text Input", icon: "T" },
  { key: "number", label: "Number Input", icon: "#" },
  { key: "email", label: "Email Input", icon: "@" },
  { key: "phone", label: "Phone Input", icon: "☎" },
  { key: "date", label: "Date Picker", icon: "📅" },
  { key: "textarea", label: "Text Area", icon: "¶" },
  { key: "select", label: "Dropdown", icon: "▼" },
  { key: "radio", label: "Radio Buttons", icon: "◉" },
  { key: "checkbox", label: "Checkboxes", icon: "☑" },
  { key: "file", label: "File Upload", icon: "📎" },
];

// Validation rules



const DraggableFieldItem = ({
  field,
  index,
  isSelected,
  onSelect,
  onMove,
  onDelete,
  renderPreview,
  isFirst,
  isLast,
}) => {
  const { t } = useTranslation();
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={field}
      dragListener={false}
      dragControls={controls}
      className={`relative mb-3 ${field.width === "half"
        ? "w-[calc(50%-0.5rem)] inline-block align-top mr-2"
        : "w-full block"
        }`}
    >
      <div
        className={`p-4 rounded-xl transition-all duration-200 group relative border-2 ${isSelected
          ? "border-primary bg-white dark:bg-zinc-950 shadow-lg shadow-primary/5 z-10"
          : "border-transparent hover:border-gray-200 hover:bg-white bg-transparent"
          }`}
        onClick={onSelect}
      >
        <div className="flex items-center justify-between mb-4 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 right-4 bg-white dark:bg-zinc-900 shadow-sm border border-gray-100 dark:border-zinc-700 rounded-full px-2 py-1 z-20">
          <div className="flex items-center gap-1">
            <div
              className="cursor-move p-1 text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
              onPointerDown={(e) => controls.start(e)}
            >
              <GripVertical size={14} />
            </div>
            <div className="h-4 w-px bg-gray-200 mx-1"></div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="h-6 w-6 min-w-0"
              onPress={() => onMove("up")}
              isDisabled={isFirst}
            >
              ↑
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="h-6 w-6 min-w-0"
              onPress={() => onMove("down")}
              isDisabled={isLast}
            >
              ↓
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              className="h-6 w-6 min-w-0"
              onPress={onDelete}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* Field Content - rendered to look exactly like the final form */}
        <div className={isSelected ? "" : "pointer-events-none"}>
          {renderPreview(field)}
        </div>
      </div>
    </Reorder.Item>
  );
};

export default function IntakeFormsSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isBuilderOpen,
    onOpen: onBuilderOpen,
    onClose: onBuilderClose,
  } = useDisclosure();
  const {
    isOpen: isPreviewOpen,
    onOpen: onPreviewOpen,
    onClose: onPreviewClose,
  } = useDisclosure();
  const {
    isOpen: isTemplateOpen,
    onOpen: onTemplateOpen,
    onClose: onTemplateClose,
  } = useDisclosure();

  const [loading, setLoading] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [previewForm, setPreviewForm] = useState(null);
  const [forms, setForms] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [builderKey, setBuilderKey] = useState(0); // Key to force remount the modal

  const [formData, setFormData] = useState({
    name: "",
    type: "custom",
    description: "",
  });

  // Form builder state
  const [builderFields, setBuilderFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [fieldConfig, setFieldConfig] = useState({
    label: "",
    placeholder: "",
    type: "text",
    required: false,
    options: [],
    validation: {},
    conditional: null,
  });

  // Fetch forms on mount
  useEffect(() => {
    fetchForms();
  }, []);

  // Check for navigation state to open builder with pre-filled type
  useEffect(() => {
    if (location.state?.openBuilder) {
      // Force fresh mount
      setBuilderKey(prev => prev + 1);

      const formType = location.state.formType || 'admission';
      setFormData({
        name: "",
        type: formType,
        description: "",
      });
      setBuilderFields([]);
      setEditingForm(null);
      setSelectedField(null);
      setFieldConfig({
        label: "",
        placeholder: "",
        type: "text",
        required: false,
        options: [],
        validation: {},
        conditional: null,
      });
      onBuilderOpen();
      // Clear the state to prevent re-opening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const data = await intakeFormsApi.getAll();
      setForms(data.map(form => ({
        id: form._id || form.id,
        name: form.formName,
        type: form.formType,
        status: form.status,
        fields: form.fields?.length || 0,
        submissions: form.submissionCount || 0,
        version: 1,
        createdAt: form.createdAt,
        description: "",
        fieldData: form.fields || []
      })));
    } catch (error) {
      toast.error(t('toast.error.failedToLoadForms'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTemplateModal = () => {
    onTemplateOpen();
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.template.formName,
      type: template.template.formType,
      description: template.description,
    });
    setBuilderFields(template.template.fields);
    onTemplateClose();
    onBuilderOpen();
  };

  const handleOpenModal = (form = null) => {
    if (form) {
      setEditingForm(form);
      setFormData({
        name: form.name,
        type: form.type,
        description: form.description || "",
      });
    } else {
      setEditingForm(null);
      setFormData({
        name: "",
        type: "custom",
        description: "",
      });
    }
    onOpen();
  };

  const handleOpenBuilder = (form = null) => {
    // Increment key to force fresh mount
    setBuilderKey(prev => prev + 1);

    if (form) {
      setEditingForm(form);
      setFormData({
        name: form.name,
        type: form.type,
        description: form.description || "",
      });
      // Load existing fields if editing
      setBuilderFields(form.fieldData || []);
    } else {
      setEditingForm(null);
      setFormData({
        name: "",
        type: "custom",
        description: "",
      });
      setBuilderFields([]);
    }
    setSelectedField(null);
    setFieldConfig({
      label: "",
      placeholder: "",
      type: "text",
      required: false,
      options: [],
      validation: {},
      conditional: null,
    });
    onBuilderOpen();
  };

  const handleBuilderClose = () => {
    // Increment key to force remount on next open
    setBuilderKey(prev => prev + 1);
    // Reset all builder state
    setEditingForm(null);
    setBuilderFields([]);
    setSelectedField(null);
    setFormData({
      name: "",
      type: "custom",
      description: "",
    });
    setFieldConfig({
      label: "",
      placeholder: "",
      type: "text",
      required: false,
      options: [],
      validation: {},
      conditional: null,
    });
    onBuilderClose();
  };

  const handleAddField = (fieldType) => {
    const newField = {
      id: Date.now(),
      type: fieldType,
      label: `New ${FIELD_TYPES.find(f => f.key === fieldType)?.label}`,
      description: "",
      width: "full",
      placeholder: "",
      required: false,
      options: fieldType === "select" || fieldType === "radio" || fieldType === "checkbox" ? ["Option 1"] : [],
      validation: {
        minLength: null,
        maxLength: null,
        min: null,
        max: null,
        pattern: "",
      },
      conditional: null,
    };
    setBuilderFields([...builderFields, newField]);
    setSelectedField(newField);
    setFieldConfig(newField);
  };

  const handleUpdateField = () => {
    setBuilderFields(
      builderFields.map(f => (f.id === selectedField.id ? { ...fieldConfig } : f))
    );
    setSelectedField(null);
  };

  const handleDeleteField = (fieldId) => {
    setBuilderFields(builderFields.filter(f => f.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const handleMoveField = (fieldId, direction) => {
    const index = builderFields.findIndex(f => f.id === fieldId);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === builderFields.length - 1)
    ) {
      return;
    }

    const newFields = [...builderFields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [
      newFields[targetIndex],
      newFields[index],
    ];
    setBuilderFields(newFields);
  };

  const handleSaveForm = async () => {
    if (!formData.name.trim()) {
      toast.error(t('toast.error.formNameIsRequired'));
      return;
    }

    setLoading(true);
    try {
      const formPayload = {
        formName: formData.name,
        formType: formData.type,
        fields: builderFields,
        status: "active",
        createdBy: user?.name || user?.id,
      };

      if (editingForm) {
        await intakeFormsApi.update(editingForm.id, formPayload);
        toast.success(t('toast.success.formUpdatedSuccessfully'));
      } else {
        await intakeFormsApi.create(formPayload);
        toast.success(t('toast.success.formCreatedSuccessfully'));
      }

      fetchForms();
      handleBuilderClose();
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to save form");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (formId) => {
    if (!confirm(t('confirm.deleteForm'))) return;

    try {
      await intakeFormsApi.delete(formId);
      toast.success(t('toast.success.formDeletedSuccessfully'));
      fetchForms();
    } catch (error) {
      toast.error(t('toast.error.failedToDeleteForm'));
    }
  };

  const handleDuplicate = async (form) => {
    try {
      await intakeFormsApi.duplicate(form.id, user?.name || user?.id);
      toast.success(t('toast.success.formDuplicatedSuccessfully'));
      fetchForms();
    } catch (error) {
      toast.error(t('toast.error.failedToDuplicateForm'));
    }
  };

  const handlePreview = (form) => {
    setPreviewForm(form);
    onPreviewOpen();
  };

  const renderFieldPreview = (field) => {
    const widthClass = field.width === "half" ? "w-[48%] inline-block align-top mr-[4%]" : "w-full";
    // Fix for the last half-width item in a row to not have margin-right if we can detect it, 
    // but simplified layout logic in builder is fine. 
    // Actually, inline-block with percentage is tricky for exact spacing. 
    // Let's use `float-left` or flex behavior if possible, but inline-block is robust enough for simple grid.
    // Better: use flex basis in the parent Reorder.Item, but that wrapper handles the width.

    // Common Props matching HeroUI style
    const labelClass = "text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1.5";

    const commonProps = {
      label: field.label,
      placeholder: field.placeholder,
      description: field.description,
      isRequired: field.required,
      labelPlacement: "outside",
      variant: "bordered",
      isDisabled: true,
      radius: "lg",
      classNames: {
        label: labelClass,
        inputWrapper: "bg-white dark:bg-zinc-950",
      }
    };

    let component = null;

    switch (field.type) {
      case "text":
      case "email":
      case "number":
        component = <Input type={field.type} {...commonProps} />;
        break;
      case "phone":
        component = (
          <Input
            type="tel"
            startContent={<span className="text-gray-400 dark:text-zinc-500 text-xs">+91</span>}
            {...commonProps}
          />
        );
        break;
      case "date":
        component = <Input type="date" {...commonProps} />;
        break;
      case "textarea":
        component = (
          <Textarea
            {...commonProps}
            minRows={3}
            classNames={{
              ...commonProps.classNames,
              inputWrapper: "bg-white dark:bg-zinc-950 py-2"
            }}
          />
        );
        break;
      case "select":
        component = (
          <Select
            {...commonProps}
            classNames={{
              label: labelClass,
              trigger: "bg-white dark:bg-zinc-950",
            }}
          >
            {field.options?.map((opt, idx) => (
              <SelectItem key={`option-${opt}`} value={opt} textValue={opt}>
                {opt}
              </SelectItem>
            ))}
          </Select>
        );
        break;
      case "radio":
        component = (
          <div className="space-y-2">
            <label className={labelClass}>
              {field.label}
              {field.required && <span className="text-danger ml-1">*</span>}
            </label>
            <div className="flex gap-4">
              {field.options?.map((opt, idx) => (
                <div
                  key={`radio-${opt}`}
                  className="cursor-pointer rounded-xl border border-gray-200 dark:border-zinc-700 p-3 flex items-center gap-3 bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all min-w-[120px]"
                >
                  <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-zinc-600 flex items-center justify-center">
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-zinc-300">{opt}</span>
                </div>
              ))}
            </div>
            {field.description && (
              <p className="text-xs text-gray-400 dark:text-zinc-500">{field.description}</p>
            )}
          </div>
        );
        break;
      case "checkbox":
        component = (
          <div className="space-y-2">
            <label className={labelClass}>
              {field.label}
              {field.required && <span className="text-danger ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((opt, idx) => (
                <Checkbox key={`checkbox-${opt}`} size="sm" isDisabled classNames={{ label: "text-gray-700 dark:text-zinc-300" }}>
                  {opt}
                </Checkbox>
              ))}
            </div>
            {field.description && (
              <p className="text-xs text-gray-400 dark:text-zinc-500">{field.description}</p>
            )}
          </div>
        );
        break;
      case "file":
        component = (
          <div className="space-y-2">
            <label className={labelClass}>
              {field.label}
              {field.required && <span className="text-danger ml-1">*</span>}
            </label>
            <div className="border border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-4 flex items-center justify-center gap-3 bg-gray-50/50 dark:bg-zinc-900/50">
              <Upload size={16} className="text-gray-400 dark:text-zinc-500" />
              <div className="text-center">
                <p className="text-xs text-gray-600 dark:text-zinc-400 font-medium">{t('pages.clickToUploadOrDragAndDrop')}</p>
                {field.description && <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">{field.description}</p>}
              </div>
            </div>
          </div>
        );
        break;
      default:
        component = null;
    }

    return <div className={`${widthClass} mb-5 align-top`}>{component}</div>;
  };

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-8">
      {/* Unified Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-default-900">{t('pages.intakeForms1')}</h2>
          <p className="text-sm text-default-500 mt-1">{t('pages.createAndManageCustomIntakeFormsForAdmissionsAndApplications')}</p>
        </div>
        <Button color="primary" radius="full" className="shadow-md font-medium px-6" startContent={<Plus size={18} />} onPress={handleOpenTemplateModal}>{t('pages.createForm')}</Button>
      </div>

      {/* Forms Table */}
      <div className="bg-white dark:bg-zinc-950 border border-default-200 rounded-xl overflow-hidden shadow-sm">
        <Table
          aria-label={t('aria.misc.intakeForms')}
          removeWrapper
          radius="none"
          classNames={{
            base: "overflow-visible",
            th: "bg-default-50 text-default-500 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200",
            td: "py-4 border-b border-default-100",
            tbody: "[&>tr:last-child>td]:border-none"
          }}
        >
          <TableHeader>
            <TableColumn scope="col">{t('pages.fORMName')}</TableColumn>
            <TableColumn scope="col">{t('pages.tYPE')}</TableColumn>
            <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
            <TableColumn scope="col">{t('pages.fIELDS')}</TableColumn>
            <TableColumn scope="col">{t('pages.sUBMISSIONS')}</TableColumn>
            <TableColumn scope="col">{t('pages.vERSION')}</TableColumn>
            <TableColumn scope="col">{t('pages.aCTIONS')}</TableColumn>
          </TableHeader>
          <TableBody
            items={forms}
            emptyContent="No forms found"
            loadingContent={<Spinner />}
          >
            {(form) => (
              <TableRow key={form.id}>
                <TableCell>
                  <div className="font-medium text-gray-900 dark:text-zinc-100">
                    {form.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color="primary">
                    {form.type}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    variant="dot"
                    color={form.status === "active" ? "success" : "warning"}
                  >
                    {form.status}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {form.fields} fields
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {form.submissions}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat">
                    v{form.version}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handlePreview(form)}
                      title={t('pages.preview1')}
                      className="transition-all duration-200"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleOpenBuilder(form)}
                      title={t('pages.edit1')}
                      className="transition-all duration-200"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleDuplicate(form)}
                      title={t('pages.duplicate1')}
                      className="transition-all duration-200"
                    >
                      <Copy size={16} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => handleDelete(form.id)}
                      title={t('pages.delete1')}
                      className="transition-all duration-200"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Builder Modal */}
      <Modal
        key={builderKey}
        isOpen={isBuilderOpen}
        onClose={handleBuilderClose}
        size="full"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center justify-between w-full pr-8">
              <span>{editingForm ? "Edit" : "Create"} Form</span>
              <Button
                size="sm"
                variant="flat"
                color="primary"
                onPress={() => handlePreview({ ...editingForm, fieldData: builderFields })}
              >
                <Eye size={16} className="mr-2" />
                Preview
              </Button>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-12 gap-6 h-full">
              {/* Left: Field Palette */}
              <div className="col-span-3 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">{t('pages.formDetails')}</h3>
                  <div className="space-y-3">
                    <Input
                      label={t('pages.formName1')}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      variant="bordered"
                      size="sm"
                    />
                    <Select
                      label={t('pages.formType1')}
                      selectedKeys={[formData.type]}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      variant="bordered"
                      size="sm"
                    >
                      <SelectItem key="admission" value="admission" textValue="Admission">
                        Admission
                      </SelectItem>
                      <SelectItem key="teacher" value="teacher" textValue="Teacher Application">
                        Teacher Application
                      </SelectItem>
                      <SelectItem key="custom" value="custom" textValue="Custom">
                        Custom
                      </SelectItem>
                    </Select>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">
                    Form Components
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {FIELD_TYPES.map((fieldType) => (
                      <button
                        key={fieldType.key}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all duration-200 group"
                        onClick={() => handleAddField(fieldType.key)}
                      >
                        <span className="text-2xl mb-2 text-gray-500 group-hover:text-primary-600 dark:text-gray-400 dark:group-hover:text-primary-400">
                          {fieldType.icon}
                        </span>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-primary-700 dark:group-hover:text-primary-300 text-center">
                          {fieldType.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Middle: Form Canvas */}
              <div className="col-span-6 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-gray-800 p-6 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('pages.canvas1')}</h3>
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">
                    {builderFields.length} Fields
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 min-h-[600px] rounded-xl p-8 max-w-2xl mx-auto">
                    {/* Form Header Preview */}
                    <div className="mb-8 border-b border-gray-100 dark:border-gray-800 pb-6 text-center">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formData.name || "Untitled Form"}
                      </h1>
                      <p className="text-gray-500 mt-2">
                        {formData.description || "Add a description to your form..."}
                      </p>
                    </div>

                    {builderFields.length === 0 ? (
                      <div className="text-center py-24 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                          <Plus size={24} />
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                          Start Building
                        </h4>
                        <p className="text-sm text-gray-500 max-w-[200px] mx-auto">
                          Select a component from the left sidebar to add it to your form.
                        </p>
                      </div>
                    ) : (
                      <Reorder.Group
                        axis="y"
                        values={builderFields}
                        onReorder={setBuilderFields}
                        className="space-y-4"
                      >
                        {builderFields.map((field, index) => (
                          <DraggableFieldItem
                            key={field.id}
                            field={field}
                            index={index}
                            isSelected={selectedField?.id === field.id}
                            onSelect={() => {
                              setSelectedField(field);
                              setFieldConfig(field);
                            }}
                            onMove={(dir) => handleMoveField(field.id, dir)}
                            onDelete={() => handleDeleteField(field.id)}
                            renderPreview={renderFieldPreview}
                            isFirst={index === 0}
                            isLast={index === builderFields.length - 1}
                          />
                        ))}
                      </Reorder.Group>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Field Configuration */}
              <div className="col-span-3 space-y-4">
                {selectedField ? (
                  <>
                    <h3 className="text-sm font-semibold">{t('pages.fieldSettings')}</h3>
                    <div className="space-y-3">
                      <Input
                        label={t('pages.fieldLabel1')}
                        value={fieldConfig.label}
                        onChange={(e) =>
                          setFieldConfig({ ...fieldConfig, label: e.target.value })
                        }
                        variant="bordered"
                        size="sm"
                        labelPlacement="outside"
                        classNames={{ inputWrapper: "bg-white dark:bg-gray-800" }}
                      />

                      <Input
                        label={t('pages.placeholder1')}
                        value={fieldConfig.placeholder}
                        onChange={(e) =>
                          setFieldConfig({
                            ...fieldConfig,
                            placeholder: e.target.value,
                          })
                        }
                        variant="bordered"
                        size="sm"
                        labelPlacement="outside"
                        classNames={{ inputWrapper: "bg-white dark:bg-gray-800" }}
                      />

                      <Textarea
                        label="Helper Text / Description"
                        value={fieldConfig.description || ""}
                        onChange={(e) =>
                          setFieldConfig({
                            ...fieldConfig,
                            description: e.target.value,
                          })
                        }
                        variant="bordered"
                        size="sm"
                        labelPlacement="outside"
                        minRows={2}
                        classNames={{ inputWrapper: "bg-white dark:bg-gray-800" }}
                      />

                      <div className="flex gap-4">
                        <Checkbox
                          size="sm"
                          isSelected={fieldConfig.required}
                          onValueChange={(value) =>
                            setFieldConfig({ ...fieldConfig, required: value })
                          }
                        >
                          Required
                        </Checkbox>
                      </div>

                      <div className="pt-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                          Layout
                        </label>
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                          <button
                            className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${fieldConfig.width !== "half"
                              ? "bg-white dark:bg-gray-700 shadow-sm font-medium"
                              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                              }`}
                            onClick={() => setFieldConfig({ ...fieldConfig, width: "full" })}
                          >
                            Full Width
                          </button>
                          <button
                            className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${fieldConfig.width === "half"
                              ? "bg-white dark:bg-gray-700 shadow-sm font-medium"
                              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                              }`}
                            onClick={() => setFieldConfig({ ...fieldConfig, width: "half" })}
                          >
                            Half Width
                          </button>
                        </div>
                      </div>

                      {/* Validation Rules Section */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                          Validation Rules
                        </h4>

                        {(fieldConfig.type === "text" || fieldConfig.type === "textarea") && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <Input
                              label={t('pages.minLength1')}
                              type="number"
                              size="sm"
                              variant="bordered"
                              labelPlacement="outside"
                              value={fieldConfig.validation?.minLength || ""}
                              onChange={(e) =>
                                setFieldConfig({
                                  ...fieldConfig,
                                  validation: { ...fieldConfig.validation, minLength: e.target.value },
                                })
                              }
                            />
                            <Input
                              label={t('pages.maxLength1')}
                              type="number"
                              size="sm"
                              variant="bordered"
                              labelPlacement="outside"
                              value={fieldConfig.validation?.maxLength || ""}
                              onChange={(e) =>
                                setFieldConfig({
                                  ...fieldConfig,
                                  validation: { ...fieldConfig.validation, maxLength: e.target.value },
                                })
                              }
                            />
                          </div>
                        )}

                        {fieldConfig.type === "number" && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <Input
                              label={t('pages.minValue1')}
                              type="number"
                              size="sm"
                              variant="bordered"
                              labelPlacement="outside"
                              value={fieldConfig.validation?.min || ""}
                              onChange={(e) =>
                                setFieldConfig({
                                  ...fieldConfig,
                                  validation: { ...fieldConfig.validation, min: e.target.value },
                                })
                              }
                            />
                            <Input
                              label={t('pages.maxValue1')}
                              type="number"
                              size="sm"
                              variant="bordered"
                              labelPlacement="outside"
                              value={fieldConfig.validation?.max || ""}
                              onChange={(e) =>
                                setFieldConfig({
                                  ...fieldConfig,
                                  validation: { ...fieldConfig.validation, max: e.target.value },
                                })
                              }
                            />
                          </div>
                        )}

                        <Input
                          label={t('pages.regexPattern1')}
                          placeholder="e.g. ^[A-Za-z]+$"
                          size="sm"
                          variant="bordered"
                          labelPlacement="outside"
                          value={fieldConfig.validation?.pattern || ""}
                          onChange={(e) =>
                            setFieldConfig({
                              ...fieldConfig,
                              validation: { ...fieldConfig.validation, pattern: e.target.value },
                            })
                          }
                          className="mb-3"
                        />
                      </div>


                      {(fieldConfig.type === "select" ||
                        fieldConfig.type === "radio" ||
                        fieldConfig.type === "checkbox") && (
                          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                              Options
                            </label>
                            {fieldConfig.options.map((opt, idx) => (
                              <div key={`option-${idx}`} className="flex gap-2 mb-2">
                                <Input
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...fieldConfig.options];
                                    newOptions[idx] = e.target.value;
                                    setFieldConfig({
                                      ...fieldConfig,
                                      options: newOptions,
                                    });
                                  }}
                                  variant="bordered"
                                  size="sm"
                                  classNames={{ inputWrapper: "bg-white dark:bg-gray-800" }}
                                />
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  onPress={() => {
                                    const newOptions = fieldConfig.options.filter(
                                      (_, i) => i !== idx
                                    );
                                    setFieldConfig({
                                      ...fieldConfig,
                                      options: newOptions,
                                    });
                                  }}
                                >
                                  <X size={16} />
                                </Button>
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="flat"
                              className="w-full mt-2"
                              startContent={<Plus size={14} />}
                              onPress={() =>
                                setFieldConfig({
                                  ...fieldConfig,
                                  options: [
                                    ...fieldConfig.options,
                                    `Option ${fieldConfig.options.length + 1}`,
                                  ],
                                })
                              }
                            >
                              Add Option
                            </Button>
                          </div>
                        )}

                      <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          color="primary"
                          className="w-full font-medium"
                          onPress={handleUpdateField}
                        >
                          Apply Changes
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">{t('pages.selectAFieldToConfigure')}</p>
                  </div>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleBuilderClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSaveForm}
              isLoading={loading}
              className="transition-all duration-200"
            >
              Save Form
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={onPreviewClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Form Preview: {previewForm?.name}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {previewForm?.fieldData?.map((field) => (
                <div key={field.id}>{renderFieldPreview(field)}</div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onPress={onPreviewClose}>{t('pages.close2')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Template Selection Modal */}
      <Modal isOpen={isTemplateOpen} onClose={onTemplateClose} size="3xl">
        <ModalContent>
          <ModalHeader>{t('pages.chooseATemplate')}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formTemplates.map((template) => (
                <Card
                  key={template.id}
                  isPressable
                  onPress={() => handleSelectTemplate(template)}
                  className="hover:border-primary transition-all"
                >
                  <CardBody className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <FileText size={24} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-zinc-400 mb-3">
                          {template.description}
                        </p>
                        {template.id !== "blank" && (
                          <Chip size="sm" variant="flat" color="primary">
                            {template.template.fields.length} fields
                          </Chip>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onTemplateClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div >
  );
}
