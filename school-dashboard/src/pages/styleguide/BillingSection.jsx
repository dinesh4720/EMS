import { useState } from "react";
import { Check } from "lucide-react";

import FeatureGate from "../../components/billing/FeatureGate";
import PlanComparisonMatrix from "../../components/billing/PlanComparisonMatrix";
import CouponInput from "../../components/billing/CouponInput";
import InvoiceHistory from "../../components/billing/InvoiceHistory";

import { Story, StoryGroup } from "./shared";

export default function BillingSection() {
  const [coupon, setCoupon] = useState("");

  return (
    <>
      <StoryGroup
        id="billing"
        title="Billing"
        sub="Trial banners, feature gates, plans, and invoicing."
      >
        <Story title="TrialBanner" layout="col">
          <div className="text-xs text-fg-subtle mb-2">
            Renders conditionally based on subscription state.
          </div>
        </Story>

        <Story title="FeatureGate" layout="center">
          <FeatureGate capability="advancedReports">
            <div className="p-4 bg-ok-bg border border-ok-border rounded-lg text-ok text-sm">
              <Check size={14} className="inline mr-1" />
              Premium feature content
            </div>
          </FeatureGate>
        </Story>

        <Story title="PlanComparisonMatrix" layout="plain">
          <PlanComparisonMatrix />
        </Story>

        <Story title="CouponInput" layout="col">
          <CouponInput value={coupon} onChange={setCoupon} />
        </Story>

        <Story title="InvoiceHistory" layout="plain">
          <InvoiceHistory />
        </Story>
      </StoryGroup>
    </>
  );
}
