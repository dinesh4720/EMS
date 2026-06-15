import { Story } from "../../shared";

/* ──────────────────────────────────────────────────────────────────
 * Chat list + bubbles — .chat-list / .chat-bubble. Phase 10
 * Messaging. Two-pane chat shell: list on the left, message thread
 * on the right.
 * ────────────────────────────────────────────────────────────────── */
export default function ChatListDemo() {
  return (
    <Story title="Two-pane chat" layout="plain">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 0,
          borderTop: "1px solid var(--divider)",
          height: 320,
        }}
      >
        <div className="chat-list" style={{ borderRight: "1px solid var(--divider)" }}>
          <div className="chat-list__row is-active">
            <span className="dot" style={{ background: "var(--accent)", width: 28, height: 28, borderRadius: "50%" }} />
            <div>
              <div className="chat-list__name">Asha Sharma</div>
              <div className="chat-list__preview">Thanks for the update!</div>
            </div>
            <div className="chat-list__meta">
              <span className="chat-list__time">10:42</span>
              <span className="chat-list__unread">2</span>
            </div>
          </div>
          <div className="chat-list__row">
            <span className="dot" style={{ background: "var(--surface-2)", width: 28, height: 28, borderRadius: "50%" }} />
            <div>
              <div className="chat-list__name">Karan Singh</div>
              <div className="chat-list__preview">Will the field trip…</div>
            </div>
            <div className="chat-list__meta">
              <span className="chat-list__time">09:15</span>
            </div>
          </div>
        </div>
        <div className="chat-thread">
          <div className="chat-thread__messages">
            <div className="chat-bubble chat-bubble--them">
              Hi! Quick question about Riya&rsquo;s homework today.
              <div className="chat-bubble__time">10:38</div>
            </div>
            <div className="chat-bubble chat-bubble--me">
              Sure — she had Math worksheet pages 4–6 and the science write-up.
              <div className="chat-bubble__time">10:40</div>
            </div>
            <div className="chat-bubble chat-bubble--them">
              Thanks for the update!
              <div className="chat-bubble__time">10:42</div>
            </div>
          </div>
          <div className="chat-input">
            <input type="text" placeholder="Type a message…" disabled />
            <button type="button" className="btn btn--accent btn--sm" disabled>
              Send
            </button>
          </div>
        </div>
      </div>
    </Story>
  );
}
