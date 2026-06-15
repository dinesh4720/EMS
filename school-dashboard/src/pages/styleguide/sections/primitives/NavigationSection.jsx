import { useState } from "react";
import { Mail } from "lucide-react";

import Tabs from "../../../../components/ui/Tabs";
import Breadcrumbs from "../../../../components/ui/Breadcrumbs";
import { Story, StoryGroup } from "../../shared";

export default function NavigationSection() {
  const [tab, setTab] = useState("overview");
  const [tabUnderline, setTabUnderline] = useState("overview");

  return (
    <StoryGroup
      id="prim-navigation"
      title="Navigation"
      sub="Tabs (pills + underline) and Breadcrumbs."
    >
      <Story title="Tabs — pills" layout="col">
        <Tabs
          variant="pills"
          activeKey={tab}
          onChange={setTab}
          tabs={[
            { key: "overview", title: "Overview" },
            { key: "fees", title: "Fees" },
            { key: "results", title: "Results" },
            { key: "remarks", title: "Remarks" },
          ]}
        />
      </Story>

      <Story title="Tabs — underline" layout="col">
        <Tabs
          variant="underline"
          activeKey={tabUnderline}
          onChange={setTabUnderline}
          tabs={[
            { key: "overview", title: "Overview" },
            { key: "fees", title: "Fees" },
            { key: "results", title: "Results" },
            { key: "remarks", title: "Remarks", icon: <Mail size={14} /> },
          ]}
        />
      </Story>

      <Story title="Breadcrumbs">
        <Breadcrumbs
          showHomeIcon
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Classes", href: "/classes" },
            { label: "Class 3-A", href: "/classes/3a" },
            { label: "Attendance" },
          ]}
        />
      </Story>
    </StoryGroup>
  );
}
