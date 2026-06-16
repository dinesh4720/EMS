import { useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Info,
  Edit3,
  Send,
  Trash2,
} from "lucide-react";

import Button from "../../../../components/ui/Button";
import Modal from "../../../../components/ui/Modal";
import Drawer from "../../../../components/ui/Drawer";
import Tooltip from "../../../../components/ui/Tooltip";
import Popover from "../../../../components/ui/Popover";
import DropdownMenu from "../../../../components/ui/DropdownMenu";
import ExportMenu from "../../../../components/ui/ExportMenu";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import Input from "../../../../components/ui/Input";
import toast from "../../../../components/ui/toast";
import { Story, StoryGroup } from "../../shared";

export default function OverlaysSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <StoryGroup
      id="prim-overlays"
      title="Overlays"
      sub="Tooltip · Popover · DropdownMenu · Modal · Drawer · Dialog · ConfirmDialog. REVAMP-05: all overlays now use frosted glass (--glass-bg / --glass-blur / --shadow-glass), close on ESC and backdrop click, trap focus, and lock body scroll. Choose by hierarchy: tooltip < popover < dropdown < dialog/modal/drawer."
    >
      <Story title="Tooltip · Popover" sub="Hover/focus to reveal — keep tooltips < 8 words">
        <Tooltip content="Add a new student to the class">
          <Button variant="ghost" size="sm" icon={<Plus size={14} />}>Hover me</Button>
        </Tooltip>
        <Tooltip content="Critical action — destroys the record" variant="danger">
          <Button variant="ghost" size="sm">Danger tooltip</Button>
        </Tooltip>
        <Popover
          trigger={<Button variant="ghost" size="sm" icon={<Info size={14} />}>Open popover</Button>}
        >
          <div style={{ maxWidth: 240 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>Quick info</p>
            <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
              Popovers are for richer content — multi-line, links, sample charts.
            </p>
          </div>
        </Popover>
      </Story>

      <Story title="DropdownMenu" sub="Use for contextual actions on rows or page-level overflow">
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="sm" icon={<MoreHorizontal size={14} />}>
              Actions
            </Button>
          }
          items={[
            { key: "edit", label: "Edit", icon: <Edit3 size={14} />, shortcut: "⌘E" },
            { key: "send", label: "Send to parent", icon: <Send size={14} /> },
            {
              key: "delete",
              label: "Delete row",
              icon: <Trash2 size={14} />,
              isDestructive: true,
              shortcut: "⌫",
            },
          ]}
        />
      </Story>

      <Story
        title="ExportMenu"
        sub="REVAMP-106 · Standard CSV/Excel/PDF/Print dropdown. Caller passes filtered rows + column descriptors; the primitive handles escaping, filenames (with tabular-nums date), and progress toast."
        code={`<ExportMenu
  filename="students"
  title="Students"
  rows={filteredItems}
  columns={[
    { key: "name", label: "Name" },
    { key: "code", label: "Roll No" },
    { key: "status", label: "Status" },
  ]}
/>`}
      >
        <ExportMenu
          filename="styleguide-sample"
          title="Sample export"
          rows={[
            { name: "Aarav Sharma", code: "S-001", status: "Active" },
            { name: "Diya Patel", code: "S-002", status: "Active" },
            { name: "Kabir Singh", code: "S-003", status: "Inactive" },
          ]}
          columns={[
            { key: "name", label: "Name" },
            { key: "code", label: "Roll No" },
            { key: "status", label: "Status" },
          ]}
        />
      </Story>

      <Story title="Modal" sub="Frosted glass · centered · ESC closes · backdrop click closes · focus trap">
        <Button variant="primary" onClick={() => setModalOpen(true)}>Open modal</Button>
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Promote students to next class"
          description="This will copy active students from the current academic year to the next."
          size="md"
          footer={
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>Promote</Button>
            </div>
          }
        >
          <p style={{ fontSize: 13, color: "var(--fg-muted)" }}>
            Sample modal body — uses the design-system <code>Modal</code> wrapper around HeroUI.
            Body scrolls inside; footer stays sticky.
          </p>
        </Modal>
      </Story>

      <Story title="Drawer" sub="Right-side default · use for filters and detail editors">
        <Button variant="primary" onClick={() => setDrawerOpen(true)}>Open drawer</Button>
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Filter students"
          description="Narrow the list by class, status, or fee state"
          size="md"
          footer={
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Reset</Button>
              <Button variant="primary" onClick={() => setDrawerOpen(false)}>Apply</Button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Class" placeholder="3-A" />
            <Input label="Status" placeholder="Active" />
            <Input label="Fee state" placeholder="Outstanding" />
          </div>
        </Drawer>
      </Story>

      <Story title="ConfirmDialog" sub="alertdialog · Discard / Keep pattern · destructive actions get a built-in confirmation">
        <Button variant="danger" onClick={() => setConfirmOpen(true)} icon={<Trash2 size={14} />}>
          Delete student
        </Button>
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            toast.success("Deleted (demo)");
          }}
          title="Discard unsaved changes?"
          message="You have unsaved edits. Close without saving?"
          confirmText="Discard"
          cancelText="Keep editing"
          variant="danger"
        />
      </Story>
    </StoryGroup>
  );
}
