import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Input, Switch, Divider, Select, SelectItem, Checkbox, CheckboxGroup, RadioGroup, Radio } from "@heroui/react";
import { Save } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function FeeRules() {
  const { t } = useTranslation();
  const [rules, setRules] = useState({
    receiptPrefix: "RCP",
    receiptStart: 1001,
    allowDiscount: true,
    discountApproval: true,
    maxDiscount: "10",
    paymentModes: ["cash", "cheque", "online"],
    enableLateFee: false,
    lateFeeAmount: 100,
    gracePeriod: 7
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // API call will be added in Phase 2
      await new Promise(resolve => setTimeout(resolve, 500));
      // Show success notification
    } catch (error) {
      console.error('Failed to save fee rules:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex justify-end mb-6">
        <Button
          color="primary"
          size="sm"
          startContent={<Save size={16} />}
          onPress={handleSave}
          isLoading={saving}
          className="transition-all duration-200"
        >
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">{t('pages.receiptSettings')}</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <Input
              size="sm"
              label={t('pages.receiptPrefix')}
              variant="bordered"
              value={rules.receiptPrefix}
              onChange={(e) => setRules({ ...rules, receiptPrefix: e.target.value })}
            />
            <Input
              size="sm"
              type="number"
              label={t('pages.startingNumber')}
              variant="bordered"
              value={rules.receiptStart}
              onChange={(e) => setRules({ ...rules, receiptStart: e.target.value })}
            />
            <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-xs text-primary-700">
                Next Receipt: <strong className="text-primary-900">{rules.receiptPrefix}-2024-{rules.receiptStart}</strong>
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">{t('pages.discountSettings')}</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="text-sm font-medium text-default-700">{t('pages.allowDiscounts')}</p>
                <p className="text-xs text-default-500">{t('pages.enableFeeDiscountsForStudents')}</p>
              </div>
              <Switch size="sm" isSelected={rules.allowDiscount} onValueChange={(v) => setRules({ ...rules, allowDiscount: v })} />
            </div>
            {rules.allowDiscount && (
              <>
                <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
                  <div>
                    <p className="text-sm font-medium text-default-700">{t('pages.requireApproval')}</p>
                    <p className="text-xs text-default-500">{t('pages.discountsNeedAdminApproval')}</p>
                  </div>
                  <Switch size="sm" isSelected={rules.discountApproval} onValueChange={(v) => setRules({ ...rules, discountApproval: v })} />
                </div>
                <Select
                  size="sm"
                  label="Max Discount %"
                  variant="bordered"
                  selectedKeys={[rules.maxDiscount]}
                  onChange={(e) => setRules({ ...rules, maxDiscount: e.target.value })}
                >
                  <SelectItem key="5">5%</SelectItem>
                  <SelectItem key="10">10%</SelectItem>
                  <SelectItem key="15">15%</SelectItem>
                  <SelectItem key="20">20%</SelectItem>
                </Select>
              </>
            )}
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">{t('pages.paymentModes')}</h3>
          </CardHeader>
          <CardBody className="p-4">
            <CheckboxGroup value={rules.paymentModes} onChange={(v) => setRules({ ...rules, paymentModes: v })}>
              <div className="space-y-3">
                <Checkbox value="cash" size="sm" classNames={{ label: "text-sm text-default-700" }}>{t('pages.cash1')}</Checkbox>
                <Checkbox value="cheque" size="sm" classNames={{ label: "text-sm text-default-700" }}>{t('pages.cheque1')}</Checkbox>
                <Checkbox value="online" size="sm" classNames={{ label: "text-sm text-default-700" }}>Online / UPI</Checkbox>
                <Checkbox value="card" size="sm" classNames={{ label: "text-sm text-default-700" }}>{t('pages.card1')}</Checkbox>
                <Checkbox value="bank" size="sm" classNames={{ label: "text-sm text-default-700" }}>{t('pages.bankTransfer1')}</Checkbox>
              </div>
            </CheckboxGroup>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">{t('pages.paymentCollectionMethod')}</h3>
          </CardHeader>
          <CardBody className="p-4">
            <RadioGroup
              value={rules.collectionMethod || "term"}
              onValueChange={(v) => setRules({ ...rules, collectionMethod: v })}
            >
              <div className="space-y-3">
                <Radio value="term" description="Collect fees per academic term (e.g., Term 1, Term 2)" classNames={{ label: "text-sm font-medium", description: "text-xs text-default-400" }}>{t('pages.termWise')}</Radio>
                <Radio value="year" description="Collect the entire fee amount at once" classNames={{ label: "text-sm font-medium", description: "text-xs text-default-400" }}>{t('pages.yearly')}</Radio>
                <Radio value="monthly" description="Collect fees on a monthly basis" classNames={{ label: "text-sm font-medium", description: "text-xs text-default-400" }}>{t('pages.monthly')}</Radio>
                <Radio value="custom" description="Define custom collection durations" classNames={{ label: "text-sm font-medium", description: "text-xs text-default-400" }}>{t('pages.customDuration')}</Radio>
              </div>
            </RadioGroup>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">{t('pages.lateFeeSettings')}</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
              <div>
                <p className="text-sm font-medium text-default-700">{t('pages.enableLateFee')}</p>
                <p className="text-xs text-default-500">{t('pages.chargeLateFeeAfterDueDate')}</p>
              </div>
              <Switch
                size="sm"
                isSelected={rules.enableLateFee}
                onValueChange={(v) => setRules({ ...rules, enableLateFee: v })}
              />
            </div>
            {rules.enableLateFee && (
              <>
                <Input
                  size="sm"
                  type="number"
                  label={t('pages.lateFeeAmount')}
                  variant="bordered"
                  startContent="₹"
                  value={rules.lateFeeAmount}
                  onChange={(e) => setRules({ ...rules, lateFeeAmount: parseInt(e.target.value) || 0 })}
                />
                <Input
                  size="sm"
                  type="number"
                  label={t('pages.gracePeriodDays1')}
                  variant="bordered"
                  value={rules.gracePeriod}
                  onChange={(e) => setRules({ ...rules, gracePeriod: parseInt(e.target.value) || 0 })}
                />
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
