import { Button, Input, Select, SelectItem } from "@heroui/react";
import { Building2, Banknote, Plus, X } from "lucide-react";
import { formatCurrency } from "../../../utils/numberFormatter";
import { useTranslation } from "react-i18next";
import SectionHeader from "./SectionHeader";

const inputStyles = {
  inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10",
};

const salaryTemplates = [
  { name: "Custom", breakdown: [{ component: "Basic Salary", amount: 0 }] },
  { name: "Teaching Staff", breakdown: [{ component: "Basic Salary", amount: 25000 }, { component: "HRA", amount: 10000 }, { component: "DA", amount: 5000 }, { component: "Allowance", amount: 5000 }] },
  { name: "Non-Teaching Staff", breakdown: [{ component: "Basic Salary", amount: 18000 }, { component: "HRA", amount: 7000 }, { component: "Allowance", amount: 3000 }] },
  { name: "Administrative", breakdown: [{ component: "Basic Salary", amount: 22000 }, { component: "HRA", amount: 9000 }, { component: "DA", amount: 4000 }, { component: "Allowance", amount: 4000 }] },
  { name: "Contract", breakdown: [{ component: "Consolidated Pay", amount: 15000 }] },
];

function SalaryStructureStep({
  formData,
  errors,
  updateField,
}) {
  const { t } = useTranslation();

  const handleTemplateChange = (templateName) => {
    const template = salaryTemplates.find(tmpl => tmpl.name === templateName);
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
    <div className="space-y-5 animate-fade-in text-left">
      <div className="space-y-3">
        <SectionHeader icon={Building2} title={t('staff.form.bankAccountDetails')} />
        <p className="text-xs text-gray-500 -mt-1">{t('staff.form.bankAccountHint')}</p>
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('staff.form.accountNumberLabel')} labelPlacement="outside" placeholder={t('pages.enterAccountNumber')} value={formData.accountNumber} onValueChange={v => updateField("accountNumber", v)} variant="bordered" radius="sm" classNames={inputStyles} />
          <Input label={t('staff.form.ifscCodeLabel')} labelPlacement="outside" placeholder={t('staff.form.ifscPlaceholder')} value={formData.ifscCode} onValueChange={v => updateField("ifscCode", v)} variant="bordered" radius="sm" isInvalid={!!errors.ifscCode} errorMessage={errors.ifscCode} classNames={inputStyles} />
          <Input label={t('staff.form.bankNameLabel')} labelPlacement="outside" placeholder={t('pages.enterBankName')} value={formData.bankName} onValueChange={v => updateField("bankName", v)} variant="bordered" radius="sm" classNames={inputStyles} />
          <Input label={t('staff.form.branchNameLabel')} labelPlacement="outside" placeholder={t('pages.enterBranchName')} value={formData.branchName} onValueChange={v => updateField("branchName", v)} variant="bordered" radius="sm" classNames={inputStyles} />
        </div>
      </div>

      <div className="space-y-3 pt-5 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <SectionHeader icon={Banknote} title={t('staff.form.salaryStructure')} />
          <Select size="sm" placeholder={t('staff.form.loadTemplatePlaceholder')} className="w-32" selectedKeys={formData.salaryTemplate ? [formData.salaryTemplate] : []} onSelectionChange={keys => handleTemplateChange(Array.from(keys)[0])} variant="bordered" radius="sm" classNames={{ trigger: "h-8 min-h-0 text-xs" }}>
            {salaryTemplates.map(tmpl => <SelectItem key={tmpl.name}>{tmpl.name}</SelectItem>)}
          </Select>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {formData.salaryBreakdown.map((item, i) => (
            <div key={`salary-${i}`} className="flex items-center gap-2 p-2 border-b border-gray-100 last:border-0 hover:bg-gray-50">
              <Input size="sm" value={item.component} onValueChange={v => updateBreakdownItem(i, "component", v)} variant="flat" placeholder={t('staff.form.componentNamePlaceholder')} classNames={{ inputWrapper: "bg-transparent shadow-none" }} />
              <Input size="sm" type="number" value={item.amount} onValueChange={v => updateBreakdownItem(i, "amount", v)} variant="flat" placeholder={t('staff.form.amountPlaceholder')} startContent="₹" classNames={{ inputWrapper: "bg-transparent shadow-none w-24" }} />
              <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => updateField("salaryBreakdown", formData.salaryBreakdown.filter((_, idx) => idx !== i))}><X size={14} /></Button>
            </div>
          ))}
          <button className="w-full py-2.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5" onClick={() => updateField("salaryBreakdown", [...formData.salaryBreakdown, { component: "", amount: 0 }])}>
            <Plus size={13} /> {t('staff.form.addComponent')}
          </button>
        </div>

        <div className="flex justify-between items-center px-2 pt-2">
          <span className="text-sm font-medium text-gray-600">{t('staff.form.totalMonthlySalary')}</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(totalSalary)}</span>
        </div>
      </div>
    </div>
  );
}

export default SalaryStructureStep;
