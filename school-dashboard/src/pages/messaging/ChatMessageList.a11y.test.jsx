/**
 * @vitest-environment jsdom
 *
 * Accessibility regression tests for the Messaging chat message list.
 *
 * These tests mount ChatMessageList with realistic mocked data and run axe-core
 * via vitest-axe. They guard the fixes applied in DK-1007 (labels, focus order,
 * ARIA roles, motion) and catch regressions as the module evolves.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";

vi.mock("../../../components/ui", () => ({
  Avatar: ({ name }) => <div data-testid="avatar">{name}</div>,
  Button: ({ children, onClick }) => <button type="button" onClick={onClick}>{children}</button>,
  IconButton: ({ "aria-label": label, onClick, children }) => (
    <button type="button" aria-label={label} onClick={onClick}>{children}</button>
  ),
  Tooltip: ({ children }) => children,
  Textarea: (props) => <textarea {...props} />,
  EmptyState: ({ title }) => <div>{title}</div>,
}));

vi.mock("@heroui/react", () => ({
  ScrollShadow: ({ children }) => <div>{children}</div>,
  Tooltip: ({ children }) => children,
}));

vi.mock("./components/MessageActionsMenu", () => ({
  default: () => <button type="button" aria-label="Message actions">⋯</button>,
}));

vi.mock("./components/MessageReactions", () => ({
  default: ({ reactions }) => (
    <div>
      {reactions.map((r) => (
        <span key={r.emoji}>{r.emoji}</span>
      ))}
    </div>
  ),
}));

vi.mock("./components/EmojiPicker", () => ({
  default: () => <div role="dialog" aria-label="Choose a reaction">emoji picker</div>,
}));

vi.mock("./components/VoiceWaveform", () => ({
  default: () => <div>voice waveform</div>,
}));

vi.mock("../utils/chatUtils", () => ({
  formatTime: () => "10:00",
  formatLastSeen: () => "Last seen recently",
  getFileIcon: () => "📎",
  formatFileSize: () => "1 KB",
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, fallback, interpolations) => {
      let text = typeof fallback === "string" ? fallback : key;
      if (interpolations) {
        Object.entries(interpolations).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{{${k}}}`, "g"), String(v));
        });
      }
      return text;
    },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
  I18nextProvider: ({ children }) => children,
}));

import ChatMessageList from "./components/ChatMessageList";

const USER = { id: "user-1", name: "Admin" };
const SELECTED_CONVERSATION = {
  otherParticipant: { name: "Ananya Sharma", online: true },
};

const MESSAGES = [
  {
    id: "msg-1",
    _id: "msg-1",
    senderId: "user-2",
    senderName: "Ananya Sharma",
    content: "Good morning! Can we discuss the exam schedule?",
    type: "text",
    status: "read",
    createdAt: "2026-03-20T08:00:00.000Z",
    isEdited: false,
    pinned: false,
    reactions: [],
    replyTo: null,
    forwardedFrom: null,
  },
  {
    id: "msg-2",
    _id: "msg-2",
    senderId: "user-1",
    senderName: "Admin",
    content: "Sure, let me check the timetable first.",
    type: "text",
    status: "delivered",
    createdAt: "2026-03-20T08:05:00.000Z",
    isEdited: false,
    pinned: false,
    reactions: [{ emoji: "👍", users: ["user-2"] }],
    replyTo: null,
    forwardedFrom: null,
  },
];

const PINNED_MESSAGES = [
  {
    id: "msg-1",
    senderName: "Ananya Sharma",
    content: "Good morning! Can we discuss the exam schedule?",
    createdAt: "2026-03-20T08:00:00.000Z",
  },
];

function renderList(props = {}) {
  return render(
    <ChatMessageList
      selectedConversation={SELECTED_CONVERSATION}
      messages={MESSAGES}
      typingUsers={new Set()}
      pinnedMessages={PINNED_MESSAGES}
      user={USER}
      editingMessage={null}
      editText=""
      emojiPickerMessage={null}
      onMessageAction={vi.fn()}
      onVideoCall={vi.fn()}
      onOpenNewChatModal={vi.fn()}
      isMobile={false}
      onBack={null}
      {...props}
    />
  );
}

describe("ChatMessageList accessibility", () => {
  it("has no detectable axe violations with populated data", async () => {
    const { container } = renderList();

    expect(screen.getAllByText("Ananya Sharma").length).toBeGreaterThanOrEqual(1);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders pinned messages as labelled buttons", () => {
    renderList();

    const pinned = screen.getAllByRole("button", { name: /Jump to pinned message/ });
    expect(pinned.length).toBeGreaterThanOrEqual(1);
  });

  it("exposes the add-reaction button with an aria label", () => {
    renderList();

    const reactions = screen.getAllByRole("button", { name: /Add reaction|addReaction/ });
    expect(reactions.length).toBeGreaterThanOrEqual(2);
  });

  it("renders message actions menu buttons for each message", () => {
    renderList();

    const actions = screen.getAllByRole("button", { name: /Message actions/ });
    expect(actions.length).toBeGreaterThanOrEqual(2);
  });

  it("announces typing activity via aria-live", () => {
    renderList({ typingUsers: new Set(["Ananya Sharma"]) });

    const liveText = screen.getByText(/typing/);
    expect(liveText.parentElement).toHaveAttribute("aria-live", "polite");
  });
});
