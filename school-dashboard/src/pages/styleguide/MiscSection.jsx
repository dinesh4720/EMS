import AcademicYearSelector from "../../components/AcademicYearSelector";
// import OnboardingFlow from "../../components/onboarding/OnboardingFlow";
import PhotoAvatar from "../../components/PhotoAvatar";

import ReportCardTemplate from "../../components/ReportCardTemplate";
import RequirePermission from "../../components/RequirePermission";
import SchoolBuilding3D from "../../components/SchoolBuilding3D";
import SubjectAssignment from "../../components/SubjectAssignment";
import Antigravity from "../../components/Antigravity";
// import NpsSurveyModal from "../../components/NpsSurveyModal";

import { Story, StoryGroup } from "./shared";

export default function MiscSection() {
  return (
    <>
      <StoryGroup id="misc-other" title="Other Components">
        <Story title="AcademicYearSelector" layout="row">
          <AcademicYearSelector />
        </Story>

        <Story title="PhotoAvatar" layout="row">
          <PhotoAvatar src="" alt="Student" name="AB" />
        </Story>

        <Story title="RequirePermission" layout="center">
          <RequirePermission module="students" action="view">
            <div className="p-3 bg-surface-2 rounded text-sm">Permission-protected content</div>
          </RequirePermission>
        </Story>

        <Story title="SubjectAssignment" layout="plain">
          <SubjectAssignment subjects={["Math", "Science"]} teachers={["Mrs. Sharma", "Mr. Kumar"]} />
        </Story>

        <Story title="PrintLayout" layout="plain">
          <div className="text-xs text-fg-subtle">Print-optimized layout wrapper (preview only in print media).</div>
        </Story>

        <Story title="ReportCardTemplate" layout="plain">
          <ReportCardTemplate />
        </Story>

        <Story title="SchoolBuilding3D" layout="center">
          <SchoolBuilding3D />
        </Story>

        <Story title="Antigravity" layout="center">
          <Antigravity />
        </Story>

        <Story title="NpsSurveyModal" layout="row">
          <span className="text-xs text-fg-subtle">
            Self-contained modal — checks eligibility via API 4s after mount.
          </span>
        </Story>

        <Story title="OnboardingFlow" layout="plain">
          <div className="text-xs text-fg-subtle">
            Full-screen setup wizard — renders a fixed overlay. Not shown inline to avoid blocking the style guide.
          </div>
        </Story>
      </StoryGroup>
    </>
  );
}
