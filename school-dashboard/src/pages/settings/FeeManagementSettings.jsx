import { useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import { IndianRupee, Percent, Clock, CreditCard } from "lucide-react";
import FeeHeadsUnified from "./FeeHeadsUnified";
import { useTranslation } from 'react-i18next';

// Import individual tab components from FeeRulesSettings
import {
  CollectionPeriodTab,
  PaymentMethodsTab,
  ConcessionsTab,
  LateFeeTab,
  GeneralRulesTab
} from "./FeeRulesSettings";

// Combined Payment Settings Component
function PaymentSettingsTab() {
  return (
    <div className="space-y-8">
      <CollectionPeriodTab />
      <div className="border-t border-border-token pt-8">
        <PaymentMethodsTab />
      </div>
    </div>
  );
}

// Combined Concessions & Discounts Component
function ConcessionsDiscountsTab() {
  return (
    <div className="space-y-8">
      <ConcessionsTab />
      <div className="border-t border-border-token pt-8">
        <GeneralRulesTab />
      </div>
    </div>
  );
}

export default function FeeManagementSettings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("fee-heads");

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-6">
      {/* Header */}
      <div className="border-b border-border-token pb-4">
        <h2 className="text-xl font-bold text-fg">{t('pages.feeManagement')}</h2>
        <p className="text-sm text-fg-muted mt-1">{t('pages.configureFeeStructuresPaymentsAndPolicies')}</p>
      </div>

      {/* Tabs - Consolidated to 4 */}
      <Tabs
        aria-label="Fee management settings"
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
        variant="underlined"
        classNames={{
          tabList: "gap-6 w-full border-b border-border-token",
          cursor: "w-full bg-surface",
          tab: "max-w-fit px-0 h-11",
          tabContent: "group-data-[selected=true]:text-fg text-fg-muted"
        }}
      >
        <Tab
          key="fee-heads"
          title={
            <div className="flex items-center gap-2 text-sm">
              <IndianRupee size={16} />
              <span>{t('pages.feeHeads1')}</span>
            </div>
          }
        >
          <div className="mt-6">
            <FeeHeadsUnified embedded={true} />
          </div>
        </Tab>

        <Tab
          key="concessions"
          title={
            <div className="flex items-center gap-2 text-sm">
              <Percent size={16} />
              <span>{t('pages.concessionsRules')}</span>
            </div>
          }
        >
          <div className="mt-6">
            <ConcessionsDiscountsTab />
          </div>
        </Tab>

        <Tab
          key="late-fees"
          title={
            <div className="flex items-center gap-2 text-sm">
              <Clock size={16} />
              <span>{t('pages.lateFees')}</span>
            </div>
          }
        >
          <div className="mt-6">
            <LateFeeTab />
          </div>
        </Tab>

        <Tab
          key="payment-settings"
          title={
            <div className="flex items-center gap-2 text-sm">
              <CreditCard size={16} />
              <span>{t('pages.paymentSettings')}</span>
            </div>
          }
        >
          <div className="mt-6">
            <PaymentSettingsTab />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
