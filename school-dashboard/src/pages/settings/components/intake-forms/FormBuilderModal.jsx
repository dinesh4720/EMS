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
import { Plus, Eye, X } from "lucide-react";
import { Reorder } from "framer-motion";
import DraggableFieldItem from "./DraggableFieldItem";

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

const FormBuilderModal = ({
  builderKey,
  isOpen,
  onClose,
  editingForm,
  formData,
  setFormData,
  builderFields,
  setBuilderFields,
  selectedField,
  setSelectedField,
  fieldConfig,
  setFieldConfig,
  handleAddField,
  handleMoveField,
  handleDeleteField,
  handleUpdateField,
  handleSaveForm,
  handlePreview,
  renderFieldPreview,
  loading,
  t,
}) => {
  return (
    <Modal
      key={builderKey}
      isOpen={isOpen}
      onClose={onClose}
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
                    <SelectItem key="student" value="student" textValue="Student / Admission">
                      Student / Admission
                    </SelectItem>
                    <SelectItem key="staff" value="staff" textValue="Staff / Teacher">
                      Staff / Teacher
                    </SelectItem>
                    <SelectItem key="parent" value="parent" textValue="Parent">
                      Parent
                    </SelectItem>
                    <SelectItem key="custom" value="custom" textValue="Custom">
                      Custom
                    </SelectItem>
                  </Select>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3 text-fg">
                  Form Components
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_TYPES.map((fieldType) => (
                    <button
                      key={fieldType.key}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-border-token bg-surface hover:border-[var(--accent-border)] hover:bg-[var(--accent-bg)] dark:hover:bg-[var(--accent-bg)] transition-all duration-200 group"
                      onClick={() => handleAddField(fieldType.key)}
                    >
                      <span className="text-2xl mb-2 text-fg-muted group-hover:text-[var(--accent)] dark:group-hover:text-[var(--accent)]">
                        {fieldType.icon}
                      </span>
                      <span className="text-xs font-medium text-fg-muted group-hover:text-[var(--accent)] dark:group-hover:text-[var(--accent)] text-center">
                        {fieldType.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle: Form Canvas */}
            <div className="col-span-6 bg-surface-2 dark:bg-surface-2 rounded-xl border border-border-token p-6 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-sm font-semibold text-fg-muted uppercase tracking-wide">{t('pages.canvas1')}</h3>
                <span className="text-xs bg-surface-2 px-2 py-1 rounded-full text-fg-muted">
                  {builderFields.length} Fields
                </span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-surface shadow-sm border border-border-token min-h-[600px] rounded-xl p-8 max-w-2xl mx-auto">
                  {/* Form Header Preview */}
                  <div className="mb-8 border-b border-divider pb-6 text-center">
                    <h1 className="text-2xl font-bold text-fg">
                      {formData.name || "Untitled Form"}
                    </h1>
                    <p className="text-fg-muted mt-2">
                      {formData.description || "Add a description to your form..."}
                    </p>
                  </div>

                  {builderFields.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed border-divider rounded-xl">
                      <div className="w-16 h-16 bg-[var(--info-bg)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--info)]">
                        <Plus size={24} />
                      </div>
                      <h4 className="text-base font-semibold text-fg mb-1">
                        Start Building
                      </h4>
                      <p className="text-sm text-fg-muted max-w-[200px] mx-auto">
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
                      classNames={{ inputWrapper: "bg-surface" }}
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
                      classNames={{ inputWrapper: "bg-surface" }}
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
                      classNames={{ inputWrapper: "bg-surface" }}
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
                      <label className="text-xs font-semibold text-fg-muted uppercase mb-2 block">
                        Layout
                      </label>
                      <div className="flex bg-surface-2 p-1 rounded-lg">
                        <button
                          className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${fieldConfig.width !== "half"
                            ? "bg-surface shadow-sm font-medium"
                            : "text-fg-muted hover:text-fg"
                            }`}
                          onClick={() => setFieldConfig({ ...fieldConfig, width: "full" })}
                        >
                          Full Width
                        </button>
                        <button
                          className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${fieldConfig.width === "half"
                            ? "bg-surface shadow-sm font-medium"
                            : "text-fg-muted hover:text-fg"
                            }`}
                          onClick={() => setFieldConfig({ ...fieldConfig, width: "half" })}
                        >
                          Half Width
                        </button>
                      </div>
                    </div>

                    {/* Validation Rules Section */}
                    <div className="pt-4 border-t border-border-token">
                      <h4 className="text-xs font-semibold text-fg-muted uppercase mb-3">
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
                        placeholder={t('settings.regexPatternPlaceholder')}
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
                        <div className="pt-4 border-t border-border-token">
                          <label className="text-xs font-semibold text-fg-muted uppercase mb-2 block">
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
                                classNames={{ inputWrapper: "bg-surface" }}
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

                    <div className="pt-6 mt-6 border-t border-border-token">
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
                <div className="text-center py-12 text-fg-faint">
                  <p className="text-sm">{t('pages.selectAFieldToConfigure')}</p>
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
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
  );
};

export default FormBuilderModal;
