import { useState } from "react";
import { User, Mail, Check } from "lucide-react";

import { Stepper } from "../../components/create/Stepper";
import { Field } from "../../components/create/Field";
import { Section } from "../../components/create/Section";
import { Disclosure } from "../../components/create/Disclosure";
import { Opt } from "../../components/create/Opt";
import { TagInput } from "../../components/create/TagInput";
import { ToggleRow } from "../../components/create/ToggleRow";
import { AvatarUpload } from "../../components/create/AvatarUpload";
import { HelpBanner } from "../../components/create/HelpBanner";

import { Story, StoryGroup } from "./shared";

export default function CreateFlowSection() {
  const [step] = useState(2);
  const [tags, setTags] = useState(["Math", "Science"]);
  const [toggleOn, setToggleOn] = useState(true);
  const [avatar, setAvatar] = useState(null);

  return (
    <>
      <StoryGroup
        id="create-wizard"
        title="Create Flow"
        sub="Wizard stepper, fields, sections, and input patterns for creation flows."
      >
        <Story title="Stepper" layout="col">
          <Stepper
            steps={[
              { n: 1, label: "Basic" },
              { n: 2, label: "Contact" },
              { n: 3, label: "Confirm" },
            ]}
            current={step}
          />
        </Story>

        <Story title="Field" layout="col">
          <Field label="Full Name" icon={<User size={14} />} required>
            <input className="w-full px-3 py-2 bg-surface border border-border-token rounded-md text-sm" placeholder="Enter name" />
          </Field>
          <Field label="Email" icon={<Mail size={14} />} hint="Used for login">
            <input className="w-full px-3 py-2 bg-surface border border-border-token rounded-md text-sm" placeholder="email@school.edu" />
          </Field>
        </Story>

        <Story title="Section" layout="col">
          <Section title="Personal Details" description="Basic information about the student.">
            <div className="h-12 bg-surface-2 rounded" aria-hidden />
          </Section>
        </Story>

        <Story title="Disclosure" layout="col">
          <Disclosure title="Advanced settings">
            <div className="p-3 text-sm text-fg-muted">Hidden content revealed on toggle.</div>
          </Disclosure>
        </Story>

        <Story title="Opt" layout="row">
          <Opt selected>
            <Check size={14} /> Option A
          </Opt>
          <Opt>Option B</Opt>
          <Opt disabled>Option C</Opt>
        </Story>

        <Story title="TagInput" layout="col">
          <TagInput value={tags} onChange={setTags} placeholder="Add subjects…" />
        </Story>

        <Story title="ToggleRow" layout="col">
          <ToggleRow
            label="Enable notifications"
            description="Receive email alerts for fee dues."
            checked={toggleOn}
            onChange={setToggleOn}
          />
        </Story>

        <Story title="AvatarUpload" layout="center">
          <AvatarUpload value={avatar} onChange={setAvatar} />
        </Story>

        <Story title="HelpBanner" layout="col">
          <HelpBanner>
            Make sure all required fields are filled before submitting.
          </HelpBanner>
        </Story>
      </StoryGroup>
    </>
  );
}
