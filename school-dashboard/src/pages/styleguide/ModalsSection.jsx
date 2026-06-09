import { useState } from "react";

import RevokeRoleModal from "../../components/modals/RevokeRoleModal";
import UnsavedChangesModal from "../../components/modals/UnsavedChangesModal";

import { Story, StoryGroup } from "./shared";

export default function ModalsSection() {
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [unsavedOpen, setUnsavedOpen] = useState(false);

  return (
    <>
      <StoryGroup
        id="modals"
        title="Modals"
        sub="Specialised modal dialogs for specific actions."
      >
        <Story title="RevokeRoleModal" layout="row">
          <button className="btn" onClick={() => setRevokeOpen(true)}>
            Open Revoke Role
          </button>
          <RevokeRoleModal
            isOpen={revokeOpen}
            onClose={() => setRevokeOpen(false)}
            onConfirm={() => setRevokeOpen(false)}
          />
        </Story>

        <Story title="UnsavedChangesModal" layout="row">
          <button className="btn" onClick={() => setUnsavedOpen(true)}>
            Open Unsaved Changes
          </button>
          <UnsavedChangesModal
            isOpen={unsavedOpen}
            onDiscard={() => setUnsavedOpen(false)}
            onCancel={() => setUnsavedOpen(false)}
          />
        </Story>
      </StoryGroup>
    </>
  );
}
