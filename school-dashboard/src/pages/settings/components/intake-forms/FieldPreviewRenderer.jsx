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

export default FieldPreviewRenderer;
