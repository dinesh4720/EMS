import { useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import { IndianRupee, Calendar, CreditCard, DollarSign, AlertCircle, Settings } from "lucide-react";
import FeeHeadsCardBased from "./FeeHeadsCardBased";

// Import individual tab components from FeeRulesSettings
import { 
  CollectionPeriodTab, 
  PaymentMethodsTab, 
  ConcessionsTab, 
  LateFeeTab, 
  GeneralRulesTab 
} from "./FeeRulesSettings";

export default function FeeManagementSettings() {
  const [activeTab, setActiveTab] = useState("fee-heads");

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-default-900">Fee Management</h2>
          <p className="text-sm text-default-500 mt-1">Complete fee configuration - heads, collection, payments, rules and policies</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
        variant="underlined"
        classNames={{
          tabList: "gap-4 w-full relative rounded-none p-0 border-b border-divider overflow-x-auto",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary"
        }}
      >
        <Tab
          key="fee-heads"
          title={
            <div className="flex items-center space-x-2">
              <IndianRupee size={18} />
              <span>Fee Heads</span>
            </div>
          }
        >
          <div className="mt-6">
            <FeeHeadsCardBased embedded={true} />
          </div>
        </Tab>

        <Tab
          key="collection-period"
          title={
            <div className="flex items-center space-x-2">
              <Calendar size={18} />
              <span>Collection Period</span>
            </div>
          }
        >
          <div className="mt-6">
            <CollectionPeriodTab />
          </div>
        </Tab>

        <Tab
          key="payment-methods"
          title={
            <div className="flex items-center space-x-2">
              <CreditCard size={18} />
              <span>Payment Methods</span>
            </div>
          }
        >
          <div className="mt-6">
            <PaymentMethodsTab />
          </div>
        </Tab>

        <Tab
          key="concessions"
          title={
            <div className="flex items-center space-x-2">
              <DollarSign size={18} />
              <span>Concessions</span>
            </div>
          }
        >
          <div className="mt-6">
            <ConcessionsTab />
          </div>
        </Tab>

        <Tab
          key="late-fees"
          title={
            <div className="flex items-center space-x-2">
              <AlertCircle size={18} />
              <span>Late Fee Rules</span>
            </div>
          }
        >
          <div className="mt-6">
            <LateFeeTab />
          </div>
        </Tab>
        
        <Tab
          key="general-rules"
          title={
            <div className="flex items-center space-x-2">
              <Settings size={18} />
              <span>Fee Rules</span>
            </div>
          }
        >
          <div className="mt-6">
            <GeneralRulesTab />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
