import { useState } from "react";
import InlineEdit from "../../components/ui/InlineEdit";
import CopyableText from "../../components/ui/CopyableText";
import FilePreview from "../../components/ui/FilePreview";
import MarkdownRenderer from "../../components/ui/MarkdownRenderer";
import { DashboardIllustration } from "../../components/ui/Illustrations";
import MobileResponsive from "../../components/ui/MobileResponsive";
import StructuredData from "../../components/ui/StructuredData";

import { Story, StoryGroup, Code } from "./shared";

const SAMPLE_MARKDOWN = `**Bold text** and *italic*.

- Item one
- Item two

[Open link](https://example.com)`;

const SAMPLE_JSON = {
  "@context": "https://schema.org",
  "@type": "School",
  name: "Springfield Elementary",
};

export default function UtilitySection() {
  const [inlineVal, setInlineVal] = useState("Riya Mehta");

  return (
    <>
      <StoryGroup
        id="util-editing"
        title="Editing Utilities"
        sub="Inline editing and copy-to-text helpers."
      >
        <Story title="InlineEdit" layout="row">
          <InlineEdit
            value={inlineVal}
            onSave={(next) => setInlineVal(next)}
            ariaLabel="Student name"
          />
        </Story>

        <Story title="CopyableText" layout="row">
          <CopyableText text="STU-2024-00189">
            <span className="font-mono text-sm">STU-2024-00189</span>
          </CopyableText>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="util-media"
        title="Media & Content"
        sub="File preview, markdown rendering, and illustrations."
      >
        <Story title="FilePreview" layout="col">
          <div className="border border-divider rounded-lg overflow-hidden">
            <FilePreview url="" fileName="sample.pdf" />
          </div>
        </Story>

        <Story title="MarkdownRenderer" layout="col">
          <div className="p-4 border border-divider rounded-lg">
            <MarkdownRenderer content={SAMPLE_MARKDOWN} />
          </div>
        </Story>

        <Story title="Illustrations" layout="center">
          <div className="w-64 h-40 bg-surface-2 rounded-lg relative overflow-hidden">
            <DashboardIllustration />
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="util-responsive"
        title="Responsive Helpers"
        sub="Mobile scroll wrappers and structured data."
      >
        <Story title="MobileResponsive" layout="plain">
          <MobileResponsive className="border border-divider rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider">
                  <th className="px-4 py-2 text-left whitespace-nowrap">Name</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Class</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Roll</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Score</th>
                  <th className="px-4 py-2 text-left whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-divider">
                  <td className="px-4 py-2 whitespace-nowrap">Aarav Joshi</td>
                  <td className="px-4 py-2 whitespace-nowrap">3-A</td>
                  <td className="px-4 py-2 whitespace-nowrap">5</td>
                  <td className="px-4 py-2 whitespace-nowrap">88%</td>
                  <td className="px-4 py-2 whitespace-nowrap">Active</td>
                </tr>
              </tbody>
            </table>
          </MobileResponsive>
        </Story>

        <Story title="StructuredData" layout="col">
          <StructuredData data={SAMPLE_JSON} />
          <Code>JSON-LD script injected in &lt;head&gt;</Code>
        </Story>
      </StoryGroup>
    </>
  );
}
