import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

import AcademicsKpiStrip from "../../components/academics/AcademicsKpiStrip";
import ExamsTable from "../../components/academics/ExamsTable";
import ClassTile from "../../components/classes/ClassTile";
import ClassesRail from "../../components/classes/ClassesRail";
import ClassesToolbar from "../../components/classes/ClassesToolbar";
import EmptyDayBanner from "../../components/classes/EmptyDayBanner";
import PeriodClassRow from "../../components/classes/PeriodClassRow";
import PeriodDetailList from "../../components/classes/PeriodDetailList";
import PeriodStrip from "../../components/classes/PeriodStrip";
import FeesKpiStrip from "../../components/fees/FeesKpiStrip";
import PaymentSheet from "../../components/fees/PaymentSheet";
import PaymentsTable from "../../components/fees/PaymentsTable";
import FrontDeskKpiStrip from "../../components/front-desk/FrontDeskKpiStrip";
import ActivityTable from "../../components/front-desk/ActivityTable";
import GatePassSheet from "../../components/front-desk/GatePassSheet";
import VisitorSheet from "../../components/front-desk/VisitorSheet";
import StudentMetricStrip from "../../components/students/StudentMetricStrip";
import ActivityTimeline from "../../components/students/ActivityTimeline";
import AttendanceHeatmap from "../../components/students/AttendanceHeatmap";
import ParentCard from "../../components/students/ParentCard";
import PersonalCard from "../../components/students/PersonalCard";
import SubjectsCard from "../../components/students/SubjectsCard";
import UpcomingCard from "../../components/students/UpcomingCard";

import PayrollReminder from "../../components/dashboard/PayrollReminder";
import SubstitutionAlertPanel from "../../components/dashboard/SubstitutionAlertPanel";
import ActionAlertCard from "../../components/overview/ActionAlertCard";
import ActivityLogCard from "../../components/overview/ActivityLogCard";
import AnalyticsChartCard from "../../components/overview/AnalyticsChartCard";
import ProfileStatCard from "../../components/overview/ProfileStatCard";
import QuickStatsCard from "../../components/overview/QuickStatsCard";
import {
  AiAssistantProvider,
  AiAssistantPanel,
  useAiAssistant,
} from "../../components/AiAssistant/AiAssistantPanel";
import ChatComposer from "../../components/AiAssistant/ChatComposer";
import ModelSelector from "../../components/AiAssistant/ModelSelector";
import StatusCard from "../../components/publicForm/StatusCard";
import FormFieldRenderer from "../../components/publicForm/FormFieldRenderer";
import TimetableCleanup from "../../components/timetable/TimetableCleanup";
import TimetableValidationPanel from "../../components/timetable/TimetableValidationPanel";

import { Story, StoryGroup } from "./shared";

function ModelSelectorStory() {
  const [selectedId, setSelectedId] = useState("school-model-1");
  const [isOpen, setIsOpen] = useState(false);
  const models = [
    {
      id: "school-model-1",
      name: "School Model A",
      description: "Balanced model for everyday school questions",
      available: true,
    },
    {
      id: "school-model-2",
      name: "School Model B",
      description: "Faster model for quick lookups",
      available: true,
    },
  ];

  return (
    <ModelSelector
      models={models}
      selectedId={selectedId}
      selectedMeta={models.find((model) => model.id === selectedId)}
      isLoading={false}
      isOpen={isOpen}
      onToggle={() => setIsOpen((open) => !open)}
      onSelect={(id) => {
        setSelectedId(id);
        setIsOpen(false);
      }}
    />
  );
}

function AiAssistantPanelStory() {
  const { openPanel } = useAiAssistant();

  useEffect(() => {
    openPanel();
  }, [openPanel]);

  return (
    <AiAssistantPanel>
      <div className="p-4 text-sm text-fg-faint">
        AI assistant panel content
      </div>
    </AiAssistantPanel>
  );
}

export default function DomainSection() {
  const [chatMsg, setChatMsg] = useState("");

  return (
    <>
      <StoryGroup id="domain-academics" title="Academics">
        <Story title="AcademicsKpiStrip" layout="plain">
          <AcademicsKpiStrip />
        </Story>
        <Story title="ExamsTable" layout="plain">
          <ExamsTable />
        </Story>
      </StoryGroup>

      <StoryGroup id="domain-classes" title="Classes">
        <Story title="ClassTile" layout="grid">
          <ClassTile title="3-A" subtitle="Mrs. Sharma" count={32} color="blue" />
          <ClassTile title="3-B" subtitle="Mr. Kumar" count={28} color="green" />
        </Story>
        <Story title="PeriodStrip" layout="plain">
          <PeriodStrip periods={[
            { time: "08:00", subject: "Math", teacher: "Mrs. Sharma" },
            { time: "09:00", subject: "Science", teacher: "Mr. Kumar" },
          ]} />
        </Story>
        <Story title="PeriodClassRow" layout="plain">
          <PeriodClassRow subject="Mathematics" teacher="Mrs. Sharma" room="101" />
        </Story>
        <Story title="PeriodDetailList" layout="plain">
          <PeriodDetailList details={[
            { label: "Subject", value: "Math" },
            { label: "Teacher", value: "Mrs. Sharma" },
          ]} />
        </Story>
        <Story title="EmptyDayBanner" layout="center">
          <EmptyDayBanner message="No classes scheduled for this day." />
        </Story>
        <Story title="ClassesToolbar" layout="plain">
          <ClassesToolbar />
        </Story>
        <Story title="ClassesRail" layout="plain">
          <ClassesRail />
        </Story>
      </StoryGroup>

      <StoryGroup id="domain-fees" title="Fees">
        <Story title="FeesKpiStrip" layout="plain">
          <FeesKpiStrip />
        </Story>
        <Story title="PaymentSheet" layout="plain">
          <PaymentSheet />
        </Story>
        <Story title="PaymentsTable" layout="plain">
          <PaymentsTable />
        </Story>
      </StoryGroup>

      <StoryGroup id="domain-front-desk" title="Front Desk">
        <Story title="FrontDeskKpiStrip" layout="plain">
          <FrontDeskKpiStrip />
        </Story>
        <Story title="ActivityTable" layout="plain">
          <ActivityTable />
        </Story>
        <Story title="VisitorSheet" layout="plain">
          <VisitorSheet />
        </Story>
        <Story title="GatePassSheet" layout="plain">
          <GatePassSheet />
        </Story>
      </StoryGroup>

      <StoryGroup id="domain-students" title="Students">
        <Story title="StudentMetricStrip" layout="plain">
          <StudentMetricStrip />
        </Story>
        <Story title="ActivityTimeline" layout="plain">
          <ActivityTimeline />
        </Story>
        <Story title="AttendanceHeatmap" layout="plain">
          <AttendanceHeatmap />
        </Story>
        <Story title="ParentCard" layout="col">
          <ParentCard name="Rajesh Mehta" phone="+91 98765 43210" relation="Father" />
        </Story>
        <Story title="PersonalCard" layout="col">
          <PersonalCard student={{ name: "Riya Mehta", roll: 5, dob: "2015-03-12" }} />
        </Story>
        <Story title="SubjectsCard" layout="col">
          <SubjectsCard subjects={["Math", "Science", "English"]} />
        </Story>
        <Story title="UpcomingCard" layout="col">
          <UpcomingCard events={[{ title: "Math Exam", date: "Tomorrow" }]} />
        </Story>
      </StoryGroup>

      <StoryGroup id="domain-dashboard" title="Dashboard">
        <Story title="PayrollReminder" layout="col">
          <PayrollReminder dueDate="2024-06-01" amount={150000} />
        </Story>
        <Story title="SubstitutionAlertPanel" layout="col">
          <SubstitutionAlertPanel alerts={[
            { teacher: "Mrs. Sharma", class: "3-A", period: "Period 3" },
          ]} />
        </Story>
      </StoryGroup>

      <StoryGroup id="domain-overview" title="Overview">
        <Story title="ActionAlertCard" layout="col">
          <ActionAlertCard title="Fee Due" message="₹13,000 pending for Term 1" action="Pay Now" />
        </Story>
        <Story title="ActivityLogCard" layout="col">
          <ActivityLogCard logs={[
            { action: "Fee collected", user: "Admin", time: "2 min ago" },
          ]} />
        </Story>
        <Story title="AnalyticsChartCard" layout="col">
          <AnalyticsChartCard title="Attendance" value="94%" trend="+2%" />
        </Story>
        <Story title="ProfileStatCard" layout="col">
          <ProfileStatCard label="Attendance" value="94%" icon={CheckCircle} />
        </Story>
        <Story title="QuickStatsCard" layout="col">
          <QuickStatsCard stats={[
            { label: "Students", value: "1,248" },
            { label: "Staff", value: "64" },
          ]} />
        </Story>
      </StoryGroup>

      <StoryGroup id="domain-ai" title="AI Assistant">
        <Story title="AiAssistantPanel" layout="plain">
          <AiAssistantProvider>
            <AiAssistantPanelStory />
          </AiAssistantProvider>
        </Story>
        <Story title="ChatComposer" layout="col">
          <ChatComposer value={chatMsg} onChange={setChatMsg} onSend={() => {}} />
        </Story>
        <Story title="ModelSelector" layout="row">
          <ModelSelectorStory />
        </Story>
      </StoryGroup>

      <StoryGroup id="domain-public-form" title="Public Forms">
        <Story title="StatusCard" layout="col">
          <StatusCard status="submitted" message="Your application has been received." />
        </Story>
        <Story title="FormFieldRenderer" layout="col">
          <FormFieldRenderer field={{ type: "text", label: "Full Name", required: true }} />
        </Story>
      </StoryGroup>

      <StoryGroup id="domain-timetable" title="Timetable">
        <Story title="TimetableCleanup" layout="plain">
          <TimetableCleanup />
        </Story>
        <Story title="TimetableValidationPanel" layout="plain">
          <TimetableValidationPanel />
        </Story>
      </StoryGroup>
    </>
  );
}
