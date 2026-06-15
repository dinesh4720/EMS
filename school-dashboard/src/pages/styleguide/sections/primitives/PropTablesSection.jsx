import { Story, StoryGroup, PropTable } from "../../shared";

export default function PropTablesSection() {
  return (
    <StoryGroup
      id="prim-prop-tables"
      title="Reference"
      sub="Common props for the most-used primitives. Full prop docs live alongside each component file."
    >
      <Story title="Button" layout="col">
        <PropTable
          rows={[
            { name: "variant", type: '"primary"|"accent"|"secondary"|"ghost"|"outline"|"danger"', default: '"primary"' },
            { name: "size", type: '"sm"|"md"|"lg"', default: '"md"' },
            { name: "icon", type: "ReactNode", default: "—" },
            { name: "iconPosition", type: '"left"|"right"', default: '"left"' },
            { name: "loading", type: "boolean", default: "false" },
            { name: "disabled", type: "boolean", default: "false" },
            { name: "fullWidth", type: "boolean", default: "false" },
          ]}
        />
      </Story>

      <Story title="Input" layout="col">
        <PropTable
          rows={[
            { name: "label", type: "ReactNode", default: "—" },
            { name: "description", type: "ReactNode", default: "—" },
            { name: "error", type: "ReactNode", default: "—" },
            { name: "hint", type: "ReactNode", default: "—" },
            { name: "startContent / endContent", type: "ReactNode", default: "—" },
            { name: "size", type: '"sm"|"md"|"lg"', default: '"md"' },
            { name: "required", type: "boolean", default: "false" },
          ]}
        />
      </Story>

      <Story title="Card" layout="col">
        <PropTable
          rows={[
            { name: "padding", type: '"none"|"sm"|"md"|"lg"', default: '"md"' },
            { name: "radius", type: '"md"|"lg"', default: '"md"' },
            { name: "elevation", type: '"flat"|"raised"|"elevated"', default: '"flat"' },
            { name: "border", type: "boolean", default: "true" },
            { name: "interactive", type: "boolean", default: "false" },
            { name: "as", type: "ElementType", default: '"div"' },
          ]}
        />
      </Story>

      <Story title="Avatar" layout="col">
        <PropTable
          rows={[
            { name: "src", type: "string", default: "—" },
            { name: "name", type: "string", default: "—" },
            { name: "size", type: '"xs"|"sm"|"md"|"lg"|"xl"', default: '"md"' },
            { name: "shape", type: '"circle"|"square"', default: '"circle"' },
            { name: "status", type: '"online"|"offline"|"away"|"busy"', default: "—" },
          ]}
        />
      </Story>
    </StoryGroup>
  );
}
