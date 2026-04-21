import { Input, Select, SelectItem, Button } from "@heroui/react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../../context/hooks/useCurrency";

const salaryTemplates = [
  { name: "Teacher", breakdown: [{ component: "Basic Salary", amount: 25000 }, { component: "HRA", amount: 10000 }, { component: "Allowance", amount: 5000 }] },
  { name: "Assistant", breakdown: [{ component: "Basic Salary", amount: 18000 }, { component: "HRA", amount: 7000 }] },
];

const StepPayroll = ({
  formData,
  errors,
  updateField,
}) => {
  const { t } = useTranslation();
  const { fmt, currencySymbol } = useCurrency();

  const handleTemplateChange = (templateName) => {
    const template = salaryTemplates.find(t => t.name === templateName);
    if (template) {
      updateField("salaryTemplate", templateName);
      updateField("salaryBreakdown", template.breakdown);
    }
  };

  const updateBreakdownItem = (index, field, value) => {
    const updated = [...formData.salaryBreakdown];
    updated[index][field] = field === "amount" ? Number(value) : value;
    updateField("salaryBreakdown", updated);
  };

  const totalSalary = formData.salaryBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Bank Details */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-default-900">{t('pages.bankDetails')}</label>
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('pages.accountNumber')} labelPlacement="outside" placeholder={t('pages.accountNo')} value={formData.accountNumber} onValueChange={v => updateField("accountNumber", v)} variant="bordered" radius="sm" classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }} />
          <Input label={t('pages.iFSCCode')} labelPlacement="outside" placeholder={t('pages.iFSCEGSbin0001234')} value={formData.ifscCode} onValueChange={v => updateField("ifscCode", v)} variant="bordered" radius="sm" errorMessage={errors.ifscCode} classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }} />
          <Input label={t('pages.bankName')} labelPlacement="outside" placeholder={t('pages.bankName')} value={formData.bankName} onValueChange={v => updateField("bankName", v)} variant="bordered" radius="sm" classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }} />
          <Input label={t('pages.branchName')} labelPlacement="outside" placeholder={t('pages.branch')} value={formData.branchName} onValueChange={v => updateField("branchName", v)} variant="bordered" radius="sm" classNames={{ label: "text-xs font-medium text-default-600 mb-1", inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }} />
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-dashed border-default-200">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-default-900">{t('pages.salaryStructure1')}</label>
          <Select
            size="sm"
            placeholder={t('pages.loadTemplate')}
            className="w-32"
            selectedKeys={formData.salaryTemplate ? [formData.salaryTemplate] : []}
            onSelectionChange={keys => handleTemplateChange(Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ trigger: "h-8 min-h-0" }}
          >
            {salaryTemplates.map(t => <SelectItem key={t.name}>{t.name}</SelectItem>)}
          </Select>
        </div>

        <div className="border border-default-200 rounded-lg overflow-hidden">
          {formData.salaryBreakdown.map((item, i) => (
            <div key={`salary-${i}`} className="flex items-center gap-2 p-2 border-b border-default-100 last:border-0 hover:bg-default-50">
              <Input
                size="sm"
                value={item.component}
                onValueChange={v => updateBreakdownItem(i, "component", v)}
                variant="flat"
                placeholder={t('pages.enterComponentName')}
                classNames={{ inputWrapper: "bg-transparent shadow-none" }}
              />
              <Input
                size="sm"
                type="number"
                value={item.amount}
                onValueChange={v => updateBreakdownItem(i, "amount", v)}
                variant="flat"
                placeholder={t('staff.form.amountPlaceholder')}
                startContent={currencySymbol}
                classNames={{ inputWrapper: "bg-transparent shadow-none w-24" }}
              />
              <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => updateField("salaryBreakdown", formData.salaryBreakdown.filter((_, idx) => idx !== i))}><X size={14} /></Button>
            </div>
          ))}
          <Button fullWidth variant="light" size="sm" className="text-default-500 font-medium" onPress={() => updateField("salaryBreakdown", [...formData.salaryBreakdown, { component: "", amount: 0 }])}>+ Add Component</Button>
        </div>

        <div className="flex justify-between items-center px-2 pt-2">
          <span className="text-sm font-medium text-default-600">{t('pages.totalSalary')}</span>
          <span className="text-lg font-bold text-default-900">{fmt(totalSalary)}</span>
        </div>
      </div>
    </div>
  );
};

export default StepPayroll;
