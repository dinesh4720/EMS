import { useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
  Textarea,
} from "@heroui/react";
import {
  Plus,
  Trash2,
  Eye,
  GripVertical,
  X,
} from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import { useTranslation } from "react-i18next";
import FormFieldPreview from "./FormFieldPreview";

// Field types available in form builder
const FIELD_TYPES = [
  { key: "text", labelKey: "settings.intakeForms.fieldTypes.text", labelDefault: "Text Input", icon: "T" },
  { key: "number", labelKey: "settings.intakeForms.fieldTypes.number", labelDefault: "Number Input", icon: "#" },
  { key: "email", labelKey: "settings.intakeForms.fieldTypes.email", labelDefault: "Email Input", icon: "@" },
  { key: "phone", labelKey: "settings.intakeForms.fieldTypes.phone", labelDefault: "Phone Input", icon: "\u260E" },
  { key: "date", labelKey: "settings.intakeForms.fieldTypes.date", labelDefault: "Date Picker", icon: "\uD83D\uDCC5" },
  { key: "textarea", labelKey: "settings.intakeForms.fieldTypes.textarea", labelDefault: "Text Area", icon: "\u00B6" },
  { key: "select", labelKey: "settings.intakeForms.fieldTypes.select", labelDefault: "Dropdown", icon: "\u25BC" },
  { key: "radio", labelKey: "settings.intakeForms.fieldTypes.radio", labelDefault: "Radio Buttons", icon: "\u25C9" },
  { key: "checkbox", labelKey: "settings.intakeForms.fieldTypes.checkbox", labelDefault: "Checkboxes", icon: "\u2611" },
  { key: "file", labelKey: "settings.intakeForms.fieldTypes.file", labelDefault: "File Upload", icon: "\uD83D\uDCCE" },
];

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
          ? "border-primary bg-white shadow-lg shadow-primary/5 z-10"
          : "border-transparent hover:border-gray-200 hover:bg-white bg-transparent"
          }`}
        onClick={onSelect}
      >
        <div className="flex items-center justify-between mb-4 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 right-4 bg-white shadow-sm border border-gray-100 rounded-full px-2 py-1 z-20">
          <div className="flex items-center gap-1">
            <div
              className="cursor-move p-1 text-gray-400 hover:text-gray-700 transition-colors"
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

export default function FormBuilder({ isOpen, onClose, formData: initialFormData, onSave, editingForm, loading, onPreview }) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: initialFormData?.name || "",
    type: initialFormData?.type || "custom",
    description: initialFormData?.description || "",
  });

  const [builderFields, setBuilderFields] = useState(initialFormData?.fieldData || []);
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

  const handleAddField = (fieldType) => {
    const newField = {
      id: Date.now(),
      type: fieldType,
      label: `${t('settings.intakeForms.newField', 'New')} ${t(FIELD_TYPES.find(f => f.key === fieldType)?.labelKey, FIELD_TYPES.find(f => f.key === fieldType)?.labelDefault)}`,
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

  const handleSave = () => {
    onSave({
      formData,
      builderFields,
    });
  };

  const renderFieldPreview = (field) => {
    return <FormFieldPreview field={field} />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center justify-between w-full pr-8">
            <span>{editingForm ? t('settings.intakeForms.editForm', 'Edit') : t('settings.intakeForms.addForm', 'Create')} {t('settings.intakeForms.formName', 'Form')}</span>
            <Button
              size="sm"
              variant="flat"
              color="primary"
              onPress={() => onPreview({ ...editingForm, name: formData.name, fieldData: builderFields })}
            >
              <Eye size={16} className="mr-2" />
              {t('settings.intakeForms.preview', 'Preview')}
            </Button>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* Left: Field Palette */}
            <div className="col-span-3 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">{t('settings.intakeForms.formName', 'Form Details')}</h3>
                <div className="space-y-3">
                  <Input
                    label={t('settings.intakeForms.formName', 'Form Name')}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    variant="bordered"
                    size="sm"
                  />
                  <Select
                    label={t('settings.intakeForms.formType', 'Form Type')}
                    selectedKeys={[formData.type]}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    variant="bordered"
                    size="sm"
                  >
                    <SelectItem key="student" value="student" textValue={t('settings.intakeForms.formTypeStudent', 'Student / Admission')}>
                      {t('settings.intakeForms.formTypeStudent', 'Student / Admission')}
                    </SelectItem>
                    <SelectItem key="staff" value="staff" textValue={t('settings.intakeForms.formTypeStaff', 'Staff / Teacher')}>
                      {t('settings.intakeForms.formTypeStaff', 'Staff / Teacher')}
                    </SelectItem>
                    <SelectItem key="parent" value="parent" textValue={t('settings.intakeForms.formTypeParent', 'Parent')}>
                      {t('settings.intakeForms.formTypeParent', 'Parent')}
                    </SelectItem>
                    <SelectItem key="custom" value="custom" textValue={t('settings.intakeForms.formTypeCustom', 'Custom')}>
                      {t('settings.intakeForms.formTypeCustom', 'Custom')}
                    </SelectItem>
                  </Select>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">
                  {t('settings.intakeForms.formFields', 'Form Components')}
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
                        {t(fieldType.labelKey, fieldType.labelDefault)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle: Form Canvas */}
            <div className="col-span-6 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-gray-800 p-6 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('settings.intakeForms.canvas', 'Canvas')}</h3>
                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">
                  {builderFields.length} {t('settings.intakeForms.fields', 'Fields')}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 min-h-[600px] rounded-xl p-8 max-w-2xl mx-auto">
                  {/* Form Header Preview */}
                  <div className="mb-8 border-b border-gray-100 dark:border-gray-800 pb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formData.name || t('settings.intakeForms.untitledForm', 'Untitled Form')}
                    </h1>
                    <p className="text-gray-500 mt-2">
                      {formData.description || t('settings.intakeForms.addDescription', 'Add a description to your form...')}
                    </p>
                  </div>

                  {builderFields.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                        <Plus size={24} />
                      </div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        {t('settings.intakeForms.startBuilding', 'Start Building')}
                      </h4>
                      <p className="text-sm text-gray-500 max-w-[200px] mx-auto">
                        {t('settings.intakeForms.addField', 'Select a component from the left sidebar to add it to your form.')}
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
                  <h3 className="text-sm font-semibold">{t('settings.intakeForms.formFields', 'Field Settings')}</h3>
                  <div className="space-y-3">
                    <Input
                      label={t('settings.intakeForms.fieldLabel', 'Field Label')}
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
                      label={t('settings.intakeForms.placeholder', 'Placeholder')}
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
                      label={t('settings.intakeForms.helperText', 'Helper Text / Description')}
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
                        {t('settings.intakeForms.fieldRequired', 'Required')}
                      </Checkbox>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                        {t('settings.intakeForms.layout', 'Layout')}
                      </label>
                      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button
                          className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${fieldConfig.width !== "half"
                            ? "bg-white dark:bg-gray-700 shadow-sm font-medium"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            }`}
                          onClick={() => setFieldConfig({ ...fieldConfig, width: "full" })}
                        >
                          {t('settings.intakeForms.fullWidth', 'Full Width')}
                        </button>
                        <button
                          className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${fieldConfig.width === "half"
                            ? "bg-white dark:bg-gray-700 shadow-sm font-medium"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            }`}
                          onClick={() => setFieldConfig({ ...fieldConfig, width: "half" })}
                        >
                          {t('settings.intakeForms.halfWidth', 'Half Width')}
                        </button>
                      </div>
                    </div>

                    {/* Validation Rules Section */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                        {t('settings.intakeForms.validationRules', 'Validation Rules')}
                      </h4>

                      {(fieldConfig.type === "text" || fieldConfig.type === "textarea") && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <Input
                            label={t('settings.intakeForms.minLength', 'Min Length')}
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
                            label={t('settings.intakeForms.maxLength', 'Max Length')}
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
                            label={t('settings.intakeForms.minValue', 'Min Value')}
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
                            label={t('settings.intakeForms.maxValue', 'Max Value')}
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
                        label={t('settings.intakeForms.regexPattern', 'Regex Pattern')}
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
                            {t('settings.intakeForms.options', 'Options')}
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
                            {t('settings.intakeForms.addField', 'Add Option')}
                          </Button>
                        </div>
                      )}

                    <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        color="primary"
                        className="w-full font-medium"
                        onPress={handleUpdateField}
                      >
                        {t('settings.intakeForms.saveForm', 'Apply Changes')}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">{t('settings.intakeForms.formFields', 'Select a field to configure')}</p>
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            isLoading={loading}
            className="transition-all duration-200"
          >
            {t('settings.intakeForms.saveForm', 'Save Form')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
