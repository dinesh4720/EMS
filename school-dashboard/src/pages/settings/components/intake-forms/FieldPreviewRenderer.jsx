import {
  Input,
  Select,
  SelectItem,
  Checkbox,
  Textarea,
} from "@heroui/react";
import { Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

const FieldPreviewRenderer = ({ field }) => {
  const { t } = useTranslation();

  const widthClass = field.width === "half" ? "w-[48%] inline-block align-top mr-[4%]" : "w-full";

  // Common Props matching HeroUI style
  const labelClass = "text-sm font-semibold text-fg mb-1.5";

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
      inputWrapper: "bg-surface",
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
          startContent={<span className="text-fg-faint text-xs">+91</span>}
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
            inputWrapper: "bg-surface py-2"
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
            trigger: "bg-surface",
          }}
        >
          {field.options?.map((opt, idx) => (
            <SelectItem key={`option-${field.id}-${idx}`} value={opt} textValue={opt}>
              {opt}
            </SelectItem>
          ))}
        </Select>
      );
      break;
    case "radio":
      component = (
        <div className="space-y-2" role="radiogroup" aria-label={field.label}>
          <label className={labelClass}>
            {field.label}
            {field.required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
          </label>
          <div className="flex flex-wrap gap-4">
            {field.options?.map((opt, idx) => {
              const radioId = `radio-${field.id}-${idx}`;
              return (
                <label
                  key={radioId}
                  htmlFor={radioId}
                  className="cursor-pointer rounded-xl border border-border-token p-3 flex items-center gap-3 bg-surface hover:bg-surface-2 transition-all min-w-[120px] min-h-[44px]"
                >
                  <input
                    type="radio"
                    id={radioId}
                    name={`radio-${field.id}`}
                    value={opt}
                    disabled
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-fg-muted">{opt}</span>
                </label>
              );
            })}
          </div>
          {field.description && (
            <p className="text-xs text-fg-faint">{field.description}</p>
          )}
        </div>
      );
      break;
    case "checkbox":
      component = (
        <div className="space-y-2">
          <label className={labelClass}>
            {field.label}
            {field.required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
          </label>
          <div className="space-y-2">
            {field.options?.map((opt, idx) => (
              <Checkbox key={`checkbox-${field.id}-${idx}`} size="sm" isDisabled classNames={{ label: "text-fg" }}>
                {opt}
              </Checkbox>
            ))}
          </div>
          {field.description && (
            <p className="text-xs text-fg-faint">{field.description}</p>
          )}
        </div>
      );
      break;
    case "file":
      component = (
        <div className="space-y-2">
          <label className={labelClass}>
            {field.label}
            {field.required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
          </label>
          <label
            className="border border-dashed border-border-token rounded-lg p-4 flex items-center justify-center gap-3 bg-surface-2/50 cursor-pointer min-h-[44px]"
          >
            <Upload size={16} className="text-fg-faint" aria-hidden="true" />
            <div className="text-center">
              <p className="text-xs text-fg-muted font-medium">{t('pages.clickToUploadOrDragAndDrop')}</p>
              {field.description && <p className="text-2xs text-fg-faint mt-1">{field.description}</p>}
            </div>
            <input
              type="file"
              disabled
              className="sr-only"
              aria-label={t('pages.uploadFileFor', { label: field.label })}
            />
          </label>
        </div>
      );
      break;
    default:
      component = null;
  }

  return <div className={`${widthClass} mb-5 align-top`}>{component}</div>;
};

export default FieldPreviewRenderer;
