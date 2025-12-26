import { useState } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";

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
const VALIDATION_RULES = [
  { key: "required", label: "Required Field" },
  { key: "minLength", label: "Minimum Length" },
  { key: "maxLength", label: "Maximum Length" },
  { key: "min", label: "Minimum Value" },
  { key: "max", label: "Maximum Value" },
  { key: "pattern", label: "Pattern (Regex)" },
  { key: "email", label: "Valid Email" },
  { key: "phone", label: "Valid Phone" },
];

export default function IntakeFormsSettings() {
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

  const [loading, setLoading] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [previewForm, setPreviewForm] = useState(null);

  // Mock forms data
  const [forms, setForms] = useState([
    {
      id: 1,
      name: "Student Admission Form",
      type: "admission",
      status: "active",
      fields: 15,
      submissions: 45,
      version: 1,
      createdAt: "2024-12-01",
    },
    {
      id: 2,
      name: "Teacher Application Form",
      type: "teacher",
      status: "active",
      fields: 20,
      submissions: 12,
      version: 1,
      createdAt: "2024-12-10",
    },
    {
      id: 3,
      name: "Parent Feedback Form",
      type: "custom",
      status: "draft",
      fields: 8,
      submissions: 0,
      version: 1,
      createdAt: "2024-12-20",
    },
  ]);

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
    if (form) {
      setEditingForm(form);
      // Load existing fields if editing
      setBuilderFields(form.fieldData || []);
    } else {
      setEditingForm(null);
      setBuilderFields([]);
    }
    onBuilderOpen();
  };

  const handleAddField = (fieldType) => {
    const newField = {
      id: Date.now(),
      type: fieldType,
      label: `New ${FIELD_TYPES.find(f => f.key === fieldType)?.label}`,
      placeholder: "",
      required: false,
      options: fieldType === "select" || fieldType === "radio" || fieldType === "checkbox" ? ["Option 1"] : [],
      validation: {},
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

  const handleSaveForm = () => {
    if (!formData.name.trim()) {
      toast.error("Form name is required");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      if (editingForm) {
        setForms(prev =>
          prev.map(f =>
            f.id === editingForm.id
              ? { ...f, ...formData, fields: builderFields.length, fieldData: builderFields }
              : f
          )
        );
        toast.success("Form updated successfully");
      } else {
        const newForm = {
          id: Date.now(),
          ...formData,
          status: "draft",
          fields: builderFields.length,
          fieldData: builderFields,
          submissions: 0,
          version: 1,
          createdAt: new Date().toISOString().split("T")[0],
        };
        setForms(prev => [...prev, newForm]);
        toast.success("Form created successfully");
      }
      setLoading(false);
      onBuilderClose();
      onClose();
    }, 500);
  };

  const handleDelete = (formId) => {
    if (!confirm("Are you sure you want to delete this form?")) return;
    setForms(prev => prev.filter(f => f.id !== formId));
    toast.success("Form deleted successfully");
  };

  const handleDuplicate = (form) => {
    const newForm = {
      ...form,
      id: Date.now(),
      name: `${form.name} (Copy)`,
      submissions: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setForms(prev => [...prev, newForm]);
    toast.success("Form duplicated successfully");
  };

  const handlePreview = (form) => {
    setPreviewForm(form);
    onPreviewOpen();
  };

  const renderFieldPreview = (field) => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
      case "number":
        return (
          <Input
            label={field.label}
            placeholder={field.placeholder}
            type={field.type}
            variant="bordered"
            isRequired={field.required}
            isDisabled
          />
        );
      case "date":
        return (
          <Input
            label={field.label}
            type="date"
            variant="bordered"
            isRequired={field.required}
            isDisabled
          />
        );
      case "textarea":
        return (
          <Textarea
            label={field.label}
            placeholder={field.placeholder}
            variant="bordered"
            isRequired={field.required}
            isDisabled
          />
        );
      case "select":
        return (
          <Select
            label={field.label}
            placeholder={field.placeholder}
            variant="bordered"
            isRequired={field.required}
            isDisabled
          >
            {field.options.map((opt, idx) => (
              <SelectItem key={idx} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </Select>
        );
      case "radio":
      case "checkbox":
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-danger ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options.map((opt, idx) => (
                <Checkbox key={idx} size="sm" isDisabled>
                  {opt}
                </Checkbox>
              ))}
            </div>
          </div>
        );
      case "file":
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-danger ml-1">*</span>}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <FileText size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Intake Forms
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create and manage custom intake forms for admissions and applications
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={16} />}
          onPress={() => {
            handleOpenModal();
            setTimeout(() => handleOpenBuilder(), 100);
          }}
          className="transition-all duration-200"
        >
          Create Form
        </Button>
      </div>

      {/* Forms Table */}
      <Card className="rounded-lg">
        <CardBody className="p-0">
          <Table
            aria-label="Intake forms table"
            removeWrapper
            classNames={{
              th: "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold",
              td: "py-4",
            }}
          >
            <TableHeader>
              <TableColumn>FORM NAME</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>FIELDS</TableColumn>
              <TableColumn>SUBMISSIONS</TableColumn>
              <TableColumn>VERSION</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              items={forms}
              emptyContent="No forms found"
              loadingContent={<Spinner />}
            >
              {(form) => (
                <TableRow key={form.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900 dark:text-white">
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
                        title="Preview"
                        className="transition-all duration-200"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleOpenBuilder(form)}
                        title="Edit"
                        className="transition-all duration-200"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleDuplicate(form)}
                        title="Duplicate"
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
                        title="Delete"
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
        </CardBody>
      </Card>

      {/* Form Builder Modal */}
      <Modal
        isOpen={isBuilderOpen}
        onClose={onBuilderClose}
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
                  <h3 className="text-sm font-semibold mb-3">Form Details</h3>
                  <div className="space-y-3">
                    <Input
                      label="Form Name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      variant="bordered"
                      size="sm"
                    />
                    <Select
                      label="Form Type"
                      selectedKeys={[formData.type]}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      variant="bordered"
                      size="sm"
                    >
                      <SelectItem key="admission" value="admission">
                        Admission
                      </SelectItem>
                      <SelectItem key="teacher" value="teacher">
                        Teacher Application
                      </SelectItem>
                      <SelectItem key="custom" value="custom">
                        Custom
                      </SelectItem>
                    </Select>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Add Fields</h3>
                  <div className="space-y-2">
                    {FIELD_TYPES.map((fieldType) => (
                      <Button
                        key={fieldType.key}
                        size="sm"
                        variant="flat"
                        className="w-full justify-start"
                        onPress={() => handleAddField(fieldType.key)}
                      >
                        <span className="mr-2">{fieldType.icon}</span>
                        {fieldType.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Middle: Form Canvas */}
              <div className="col-span-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 space-y-4 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Form Preview</h3>
                {builderFields.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Drag fields from the left to build your form</p>
                  </div>
                ) : (
                  builderFields.map((field, index) => (
                    <div
                      key={field.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedField?.id === field.id
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setSelectedField(field);
                        setFieldConfig(field);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical size={16} className="text-gray-400" />
                          <span className="text-sm font-medium">{field.label}</span>
                          {field.required && (
                            <Chip size="sm" color="danger" variant="flat">
                              Required
                            </Chip>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleMoveField(field.id, "up")}
                            isDisabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleMoveField(field.id, "down")}
                            isDisabled={index === builderFields.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDeleteField(field.id)}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </div>
                      {renderFieldPreview(field)}
                    </div>
                  ))
                )}
              </div>

              {/* Right: Field Configuration */}
              <div className="col-span-3 space-y-4">
                {selectedField ? (
                  <>
                    <h3 className="text-sm font-semibold">Field Settings</h3>
                    <div className="space-y-3">
                      <Input
                        label="Field Label"
                        value={fieldConfig.label}
                        onChange={(e) =>
                          setFieldConfig({ ...fieldConfig, label: e.target.value })
                        }
                        variant="bordered"
                        size="sm"
                      />
                      <Input
                        label="Placeholder"
                        value={fieldConfig.placeholder}
                        onChange={(e) =>
                          setFieldConfig({
                            ...fieldConfig,
                            placeholder: e.target.value,
                          })
                        }
                        variant="bordered"
                        size="sm"
                      />
                      <Checkbox
                        isSelected={fieldConfig.required}
                        onValueChange={(value) =>
                          setFieldConfig({ ...fieldConfig, required: value })
                        }
                        size="sm"
                      >
                        Required Field
                      </Checkbox>

                      {(fieldConfig.type === "select" ||
                        fieldConfig.type === "radio" ||
                        fieldConfig.type === "checkbox") && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Options
                          </label>
                          {fieldConfig.options.map((opt, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
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

                      <Button
                        color="primary"
                        size="sm"
                        className="w-full"
                        onPress={handleUpdateField}
                      >
                        Update Field
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">Select a field to configure</p>
                  </div>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onBuilderClose}>
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
            <Button onPress={onPreviewClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
