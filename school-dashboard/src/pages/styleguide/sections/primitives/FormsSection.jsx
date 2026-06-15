import { useState } from "react";
import { Search } from "lucide-react";

import Input from "../../../../components/ui/Input";
import Textarea from "../../../../components/ui/Textarea";
import Checkbox from "../../../../components/ui/Checkbox";
import Radio, { RadioGroup } from "../../../../components/ui/Radio";
import Switch from "../../../../components/ui/Switch";
import { Story, StoryGroup } from "../../shared";
import ValidationDemo from "./ValidationDemo";

export default function FormsSection() {
  const [text, setText] = useState("");
  const [agree, setAgree] = useState(true);
  const [plan, setPlan] = useState("pro");
  const [enabled, setEnabled] = useState(true);

  return (
    <StoryGroup
      id="prim-forms"
      title="Forms"
      sub="Inputs share label / description / error / hint slots. Always wrap in <FormField> when the layout demands consistent label-on-top spacing."
    >
      <Story title="Input — sizes" layout="col">
        <div className="sg-form-grid">
          <Input size="sm" label="Small" placeholder="Short field" />
          <Input size="md" label="Medium" placeholder="Default size" />
          <Input size="lg" label="Large" placeholder="Spacious" />
        </div>
      </Story>

      <Story
        title="Input — states"
        sub="default · hover · focus · error · disabled"
        layout="col"
      >
        <div className="sg-form-grid">
          <Input
            label="With description"
            description="Used to identify the student"
            placeholder="Type here"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Input
            label="With start icon"
            startContent={<Search size={14} />}
            placeholder="Search students"
          />
          <Input label="Error" placeholder="Required" error="This field is required" />
          <Input label="Disabled" placeholder="Read only" disabled />
        </div>
      </Story>

      <Story title="Textarea" layout="col">
        <Textarea
          label="Remarks"
          description="Visible to parents in the app"
          placeholder="Type a short note about this student…"
          rows={4}
        />
      </Story>

      <Story
        title="Checkbox"
        sub="default · checked · indeterminate · disabled"
        layout="col"
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
          <Checkbox label="Default" />
          <Checkbox
            label="Email me a copy"
            description="We'll send to the registered email"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <Checkbox label="Indeterminate" indeterminate />
          <Checkbox label="Disabled" disabled />
          <Checkbox label="Disabled & checked" disabled checked readOnly />
        </div>
      </Story>

      <Story
        title="Radio group"
        sub="The selected option shows a filled dot. Click any row to switch."
        layout="col"
      >
        <RadioGroup
          label="Plan"
          value={plan}
          onChange={setPlan}
          name="sg-plan"
        >
          <Radio value="starter" label="Starter" description="Up to 100 students" />
          <Radio value="pro" label="Pro" description="Up to 1,000 students" />
          <Radio value="scale" label="Scale" description="Unlimited" />
        </RadioGroup>
      </Story>

      <Story
        title="Form validation UX — inline + summary + scroll-to-error"
        sub="useFormErrors() gives every form the same error UX: inline FieldError under the input (aria-invalid + aria-describedby), an optional FormErrorSummary banner at the top, scroll + focus to the first invalid field on submit, error clears on field change, and server errors map back onto the right field. Submit empty to see it in action."
        layout="col"
      >
        <ValidationDemo />
      </Story>

      <Story
        title="Switch"
        sub="On/off — prefer over a checkbox for settings that take effect immediately"
        layout="col"
      >
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Switch
            label="Parent app notifications"
            description="Send a push when results are published"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <Switch
            label="Auto-publish"
            description="Defaults off — flip to publish immediately on save"
          />
          <Switch label="Disabled" disabled />
          <Switch label="Disabled (on)" disabled checked readOnly />
        </div>
      </Story>
    </StoryGroup>
  );
}
