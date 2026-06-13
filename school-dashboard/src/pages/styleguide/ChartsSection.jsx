import { BarChart3, TrendingUp } from "lucide-react";

import KPICardHovy from "../../components/charts/KPICardHovy";

import { Story, StoryGroup } from "./shared";

export default function ChartsSection() {
  return (
    <>
      <StoryGroup
        id="charts-kpi"
        title="Charts & Data Viz"
        sub="KPI cards and chart containers."
      >
        <Story title="KPICardHovy" layout="grid">
          <KPICardHovy label="Revenue" value="₹4.2L" trend="12%" trendUp icon={<TrendingUp />} />
          <KPICardHovy label="Students" value="1,248" trend="3%" trendUp={false} icon={<BarChart3 />} />
        </Story>
      </StoryGroup>
    </>
  );
}
