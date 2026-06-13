import { useState } from "react";
import {
  Info, CheckCircle, WifiOff, CloudOff,
  ArrowUp, Printer, AlertTriangle,
} from "lucide-react";

import Dialog from "../../components/ui/Dialog";
import PrintPreviewModal from "../../components/ui/PrintPreviewModal";
import CookieConsentBanner from "../../components/ui/CookieConsentBanner";
import ConflictIndicator from "../../components/ui/ConflictIndicator";
import CoachMark from "../../components/ui/CoachMark";
import GuidedTour from "../../components/ui/GuidedTour";
import HelpIcon from "../../components/ui/HelpIcon";
import ScrollToTopButton from "../../components/ui/ScrollToTopButton";
import IconButtonWithTooltip from "../../components/ui/IconButtonWithTooltip";
import DisabledButtonWithTooltip from "../../components/ui/DisabledButtonWithTooltip";
import ErrorBoundary from "../../components/ui/ErrorBoundary";
import ModalBase from "../../components/ui/ModalBase";

import { Story, StoryGroup } from "./shared";

const SAMPLE_CONFLICTS = [
  {
    type: "double_booking",
    teacherName: "Mrs. Sharma",
    teacherCode: "SHM",
    day: "Monday",
    periodIndex: 3,
    message: "Double booked in Period 3",
    subject: "Math",
    classId: "3A",
    className: "Class 3-A",
  },
];

function BuggyComponent() {
  throw new Error("Demo error for ErrorBoundary");
}

export default function ExtendedFeedbackSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <StoryGroup
        id="extfb-dialogs"
        title="Dialogs & Modals"
        sub="Alert dialogs, print preview, and confirmation surfaces."
      >
        <Story title="Dialog" layout="row">
          <button className="btn" onClick={() => setDialogOpen(true)}>
            Open Dialog
          </button>
          {dialogOpen && (
            <Dialog
              isOpen
              onClose={() => setDialogOpen(false)}
              title="Session Expired"
              message="Your session has expired. Please log in again to continue."
              actionText="OK"
            />
          )}
        </Story>

        <Story title="PrintPreviewModal" layout="row">
          <button className="btn" onClick={() => setPrintOpen(true)}>
            Open Print Preview
          </button>
          {printOpen && (
            <PrintPreviewModal
              isOpen
              onClose={() => setPrintOpen(false)}
              title="Fee Receipt"
            >
              <div className="p-6 text-center text-fg-muted">
                <Printer size={32} className="mx-auto mb-2" />
                <p>Print preview content goes here.</p>
              </div>
            </PrintPreviewModal>
          )}
        </Story>

        <Story title="ModalBase" layout="row">
          <button className="btn" onClick={() => setModalOpen(true)}>
            Open ModalBase
          </button>
          {modalOpen && (
            <ModalBase isOpen onClose={() => setModalOpen(false)} closeOnBackdrop>
              <div className="bg-surface p-6 rounded-xl shadow-lg max-w-sm mx-auto mt-20">
                <h3 className="text-sm font-semibold mb-2">Custom Modal</h3>
                <p className="text-xs text-fg-muted mb-4">
                  ModalBase handles focus trapping, escape to close, and backdrop click.
                </p>
                <button className="btn btn--sm btn--primary" onClick={() => setModalOpen(false)}>
                  Close
                </button>
              </div>
            </ModalBase>
          )}
        </Story>
      </StoryGroup>

      <StoryGroup
        id="extfb-banners"
        title="Banners"
        sub="System-level banners for connectivity, session, and consent."
      >
        <Story title="OfflineBanner" layout="col">
          <div className="relative overflow-hidden rounded-lg border border-divider">
            <div className="bg-fg text-bg px-4 py-2 flex items-center justify-center gap-2 text-sm">
              <WifiOff size={15} />
              <span>You&apos;re offline. Some features may be unavailable.</span>
            </div>
          </div>
        </Story>

        <Story title="StaleDataBanner" layout="col">
          <div className="bg-warn-bg border-b border-warn/20 px-4 py-2 flex items-center gap-2 text-sm text-warn rounded-lg">
            <CloudOff size={15} />
            <span>Real-time sync lost. Data shown may be out of date.</span>
          </div>
        </Story>

        <Story title="CookieConsentBanner" layout="col">
          <div className="rounded-lg border border-divider overflow-hidden">
            <CookieConsentBanner />
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="extfb-indicators"
        title="Indicators"
        sub="Conflict badges, help icons, and scroll-to-top."
      >
        <Story title="ConflictIndicator" layout="col">
          <ConflictIndicator
            conflicts={SAMPLE_CONFLICTS}
            onResolve={() => {}}
          />
        </Story>

        <Story title="HelpIcon" layout="row">
          <div className="flex items-center gap-2">
            <span className="text-sm">Roll Number</span>
            <HelpIcon text="Must be unique within the class." />
          </div>
          <HelpIcon text="This is a longer help tooltip with more context." kbSlug="help-topic" />
        </Story>

        <Story title="ScrollToTopButton" layout="center">
          <div className="relative h-24 bg-surface-2 rounded-lg w-full overflow-hidden">
            <div className="absolute bottom-2 right-2">
              <ScrollToTopButton />
            </div>
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="extfb-onboarding"
        title="Onboarding"
        sub="Coach marks and guided tours for first-run experiences."
      >
        <Story title="CoachMark" layout="row">
          <button className="btn" data-coach="demo-btn">
            Target
          </button>
          <CoachMark
            surface="demo"
            marks={[
              {
                target: '[data-coach="demo-btn"]',
                title: "Quick tip",
                body: "This button does something important.",
              },
            ]}
          />
        </Story>

        <Story title="GuidedTour" layout="row">
          <button className="btn" onClick={() => setTourOpen(true)}>
            Start Tour
          </button>
          <button className="btn btn--ghost" data-tour="demo-step-1">
            Step 1 Target
          </button>
          {tourOpen && (
            <GuidedTour
              steps={[
                {
                  target: '[data-tour="demo-step-1"]',
                  title: "Welcome",
                  content: "This is the first step of the tour.",
                },
              ]}
              isOpen={tourOpen}
              onClose={() => setTourOpen(false)}
            />
          )}
        </Story>
      </StoryGroup>

      <StoryGroup
        id="extfb-button-helpers"
        title="Button Helpers"
        sub="Tooltip-wrapped icon buttons and disabled buttons with explanations."
      >
        <Story title="IconButtonWithTooltip" layout="row">
          <IconButtonWithTooltip icon={<Info size={16} />} tooltip="More info" />
          <IconButtonWithTooltip icon={<CheckCircle size={16} />} tooltip="Mark complete" variant="primary" />
        </Story>

        <Story title="DisabledButtonWithTooltip" layout="row">
          <DisabledButtonWithTooltip
            tooltip="You need permission to delete"
          >
            Delete
          </DisabledButtonWithTooltip>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="extfb-error"
        title="Error Handling"
        sub="Graceful error boundaries and fallbacks."
      >
        <Story title="ErrorBoundary" layout="center">
          <ErrorBoundary>
            <BuggyComponent />
          </ErrorBoundary>
        </Story>
      </StoryGroup>
    </>
  );
}
