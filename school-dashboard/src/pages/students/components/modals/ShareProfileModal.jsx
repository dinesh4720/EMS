import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Share2, Search, Check } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import logger from "../../../../utils/logger";

const SHARE_LINK_TTL_MIN = 60 * 24 * 7; // 7 days

export default function ShareProfileModal({
  isOpen,
  onClose,
  student,
  staff = [],
}) {
  const { t } = useTranslation();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers([]);
      setSearchQuery("");
      setIsSharing(false);
    }
  }, [isOpen]);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return staff;
    return staff.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.role?.toLowerCase().includes(q)
    );
  }, [staff, searchQuery]);

  const toggleUser = (id) =>
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      toast.error(
        t(
          "toast.error.pleaseSelectAtLeastOneUserToShareWith",
          "Select at least one staff member"
        )
      );
      return;
    }
    setIsSharing(true);
    const loadingToast = toast.loading(
      t("toast.loading.sharingProfile", {
        count: selectedUsers.length,
        defaultValue: `Sharing profile with ${selectedUsers.length} user(s)…`,
      })
    );
    try {
      const expiresAt = new Date(Date.now() + SHARE_LINK_TTL_MIN * 60_000);
      const shareUrl = `${window.location.origin}/students/${student.id}?ref=share&exp=${expiresAt.getTime()}`;
      const message = `Student profile: ${student.name}\n\nView profile (link expires ${expiresAt.toLocaleDateString()}): ${shareUrl}`;
      const { request } = await import("../../../../services/api");

      await Promise.all(
        selectedUsers.map(async (userId) => {
          const conversation = await request("/messages/conversations", {
            method: "POST",
            body: JSON.stringify({
              participantId: userId,
              participantModel: "Staff",
            }),
          });
          await request("/messages", {
            method: "POST",
            body: JSON.stringify({
              conversationId: conversation._id || conversation.id,
              receiverId: userId,
              receiverModel: "Staff",
              content: message,
              type: "text",
            }),
          });
        })
      );

      toast.success(
        t("toast.success.profileShared", {
          count: selectedUsers.length,
          defaultValue: `Profile shared with ${selectedUsers.length} user(s)`,
        }),
        { id: loadingToast }
      );
      onClose();
    } catch (error) {
      logger.error("Error sharing profile:", error);
      toast.error(
        t("toast.error.failedToShareProfile", "Failed to share profile") +
          ": " +
          (error.message || t("common.unknownError", "Unknown error")),
        { id: loadingToast }
      );
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("pages.shareStudentProfile", "Share student profile")}
      description={
        student?.name
          ? `Send ${student.name}'s profile to staff (link valid 7 days)`
          : undefined
      }
      size="md"
      isDismissable={!isSharing}
      footer={
        <>
          <span className="field__hint" style={{ marginRight: "auto" }}>
            {selectedUsers.length > 0
              ? `${selectedUsers.length} selected`
              : "Select staff members"}
          </span>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={isSharing}
          >
            {t("pages.cancel2", "Cancel")}
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={handleShare}
            disabled={selectedUsers.length === 0 || isSharing}
            aria-busy={isSharing || undefined}
          >
            <Share2 size={13} aria-hidden />
            {isSharing
              ? "Sharing…"
              : t("pages.shareProfile", "Share Profile")}
          </button>
        </>
      }
    >
      <div className="section" style={{ margin: 0 }}>
        <div className="field" style={{ marginBottom: 12 }}>
          <div className="field__icon-wrap">
            <Search size={12} className="field__icon" aria-hidden />
            <input
              type="text"
              className="input input--with-icon"
              placeholder={t(
                "pages.searchStaffMembers",
                "Search staff by name, role, email…"
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search staff"
            />
          </div>
        </div>

        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label="Staff to share with"
          style={{
            maxHeight: 320,
            overflowY: "auto",
            border: "1px solid var(--border)",
            borderRadius: 8,
            background: "var(--surface)",
          }}
        >
          {filteredStaff.length === 0 ? (
            <p
              className="muted"
              style={{ textAlign: "center", padding: "32px 16px", fontSize: 13 }}
            >
              {t("pages.noStaffMembersAvailable", "No staff members available")}
            </p>
          ) : (
            filteredStaff.map((s) => {
              const selected = selectedUsers.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => toggleUser(s.id)}
                  className="row gap-3"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderBottom: "1px solid var(--divider)",
                    background: selected ? "var(--accent-bg)" : "transparent",
                    color: selected ? "var(--accent)" : "var(--fg)",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "background 120ms",
                  }}
                >
                  <span
                    className="opt__icon"
                    style={{ width: 28, height: 28, borderRadius: 999 }}
                    aria-hidden
                  >
                    {(s.name || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="col" style={{ flex: 1, minWidth: 0, gap: 1 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 520,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.name || "—"}
                    </span>
                    <span
                      className="subtle"
                      style={{
                        fontSize: 11.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.role || s.email || ""}
                    </span>
                  </span>
                  {selected ? (
                    <Check
                      size={14}
                      aria-hidden
                      style={{ color: "var(--accent)" }}
                    />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
