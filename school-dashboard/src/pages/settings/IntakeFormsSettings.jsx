import { useState, useEffect } from "react";
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import {
  Button,
  useDisclosure,
} from "@heroui/react";
import {
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import { intakeFormsApi } from "../../services/api";
import { formTemplates } from "../../data/formTemplates";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from 'react-i18next';

import FieldPreviewRenderer from "./components/intake-forms/FieldPreviewRenderer";
import FormsTable from "./components/intake-forms/FormsTable";
import PreviewModal from "./components/intake-forms/PreviewModal";
import TemplateSelectionModal from "./components/intake-forms/TemplateSelectionModal";
import FormBuilderModal from "./components/intake-forms/FormBuilderModal";

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

export default function IntakeFormsSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
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
  const [, setSelectedTemplate] = useState(null);
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

      const formType = location.state.formType || 'student';
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

  const handleDelete = (formId) => {
    showConfirm({
      title: 'Delete Form',
      message: t('confirm.deleteForm'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await intakeFormsApi.delete(formId);
          toast.success(t('toast.success.formDeletedSuccessfully'));
          fetchForms();
        } catch (error) {
          toast.error(t('toast.error.failedToDeleteForm'));
        }
      },
    });
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
    return <FieldPreviewRenderer field={field} />;
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
      <FormsTable
        forms={forms}
        loading={loading}
        onPreview={handlePreview}
        onEdit={handleOpenBuilder}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        t={t}
      />

      {/* Form Builder Modal */}
      <FormBuilderModal
        builderKey={builderKey}
        isOpen={isBuilderOpen}
        onClose={handleBuilderClose}
        editingForm={editingForm}
        formData={formData}
        setFormData={setFormData}
        builderFields={builderFields}
        setBuilderFields={setBuilderFields}
        selectedField={selectedField}
        setSelectedField={setSelectedField}
        fieldConfig={fieldConfig}
        setFieldConfig={setFieldConfig}
        handleAddField={handleAddField}
        handleMoveField={handleMoveField}
        handleDeleteField={handleDeleteField}
        handleUpdateField={handleUpdateField}
        handleSaveForm={handleSaveForm}
        handlePreview={handlePreview}
        renderFieldPreview={renderFieldPreview}
        loading={loading}
        t={t}
      />

      {/* Preview Modal */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={onPreviewClose}
        previewForm={previewForm}
        renderFieldPreview={renderFieldPreview}
      />

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={isTemplateOpen}
        onClose={onTemplateClose}
        formTemplates={formTemplates}
        onSelectTemplate={handleSelectTemplate}
        t={t}
      />

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
