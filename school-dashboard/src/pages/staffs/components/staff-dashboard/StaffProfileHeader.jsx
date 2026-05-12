import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  ArrowLeft,
  Camera,
  Edit,
  MoreVertical,
  Phone,
  Mail,
  Printer,
  Send,
} from "lucide-react";
import PhotoAvatar from "../../../../components/PhotoAvatar";
import { getSafeDisplayName } from "../../../../utils/objectIdHelper";

const STATUS_TONE = {
  present: "ok",
  active: "ok",
  absent: "danger",
  leave: "warn",
  halfday: "warn",
  inactive: "danger",
};

function roleArray(role) {
  if (Array.isArray(role)) return role.filter(Boolean);
  return role ? [role] : [];
}

export default function StaffProfileHeader({
  staff,
  picturePreview,
  subjectAssignments,
  attendanceRate,
  monthlyStats,
  fileInputRef,
  handleRemovePhoto,
  setIsCameraCaptureOpen,
  handleEditClick,
  onOpen,
  navigate,
  t,
}) {
  const status = (staff.status || "active").toLowerCase();
  const tone = STATUS_TONE[status] || "info";
  const roles = roleArray(staff.role);
  const dept = staff.department || "—";
  const code = staff.staffNumber || staff.code || "";
  const subjects = [
    ...new Set((subjectAssignments || []).map((sa) => sa.subject).filter(Boolean)),
  ];
  const presentCount = monthlyStats?.present ?? 0;
  const totalWorking = monthlyStats?.total ?? 0;

  return (
    <>
      {/* Page head — breadcrumb + actions */}
      <div
        className="row gap-2"
        style={{
          padding: "12px 24px 0",
          alignItems: "center",
          fontSize: 12,
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/staffs")}
          className="row gap-1 subtle"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <ArrowLeft size={13} aria-hidden />
          <span>{t("pages.backToStaff", "Back to staff")}</span>
        </button>
      </div>

      {/* Hero */}
      <div className="staff-dashboard__hero">
        <div className="staff-dashboard__hero-main">
          {/* Avatar with camera dropdown */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <PhotoAvatar
              src={picturePreview || staff.picture}
              alt={staff.name}
              name={getSafeDisplayName(staff, "code")}
              size="xl"
              type="staff"
            />
            <Dropdown placement="bottom-start">
              <DropdownTrigger>
                <button
                  type="button"
                  className="iconbtn"
                  style={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    width: 26,
                    height: 26,
                  }}
                  aria-label="Change photo"
                >
                  <Camera size={13} />
                </button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Photo actions" className="min-w-[140px]">
                <DropdownItem
                  key="upload"
                  onPress={() => fileInputRef.current?.click()}
                >
                  {t("pages.uploadPhoto1")}
                </DropdownItem>
                <DropdownItem
                  key="camera"
                  onPress={() => setIsCameraCaptureOpen(true)}
                >
                  {t("pages.takePhoto")}
                </DropdownItem>
                <DropdownItem
                  key="remove"
                  className="text-danger"
                  onPress={handleRemovePhoto}
                >
                  {t("pages.remove1")}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Info */}
          <div className="staff-dashboard__hero-info">
            <h1 className="staff-dashboard__hero-name">
              {getSafeDisplayName(staff, "code")}
            </h1>
            <div
              className="row gap-2 subtle"
              style={{ fontSize: 13, flexWrap: "wrap" }}
            >
              {code && <span className="mono tnum">{code}</span>}
              {code && (roles.length > 0 || dept !== "—") && <span>·</span>}
              {roles.length > 0 && <span>{roles.join(", ")}</span>}
              {dept && dept !== "—" && (
                <>
                  <span>·</span>
                  <span>{dept}</span>
                </>
              )}
            </div>

            <div className="staff-dashboard__hero-meta">
              <span className={`status status--${tone}`}>
                <span className="dot" />
                {status}
              </span>
              {subjects.slice(0, 4).map((subj) => (
                <span key={subj} className="chip">
                  {subj}
                </span>
              ))}
              {subjects.length > 4 && (
                <span className="chip">+{subjects.length - 4}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="staff-dashboard__hero-actions">
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (staff.phone) {
                window.location.href = `tel:${staff.phone.replace(/[^\d+]/g, "")}`;
              }
            }}
            disabled={!staff.phone}
            title={staff.phone || "No phone number"}
          >
            <Phone size={13} aria-hidden /> {t("pages.call")}
          </button>
          <button type="button" className="btn" onClick={onOpen}>
            <Send size={13} aria-hidden /> {t("pages.message1", "Message")}
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={handleEditClick}
          >
            <Edit size={13} aria-hidden /> {t("pages.edit1")}
          </button>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button
                type="button"
                className="iconbtn"
                style={{ width: 32, height: 32 }}
                aria-label="More actions"
              >
                <MoreVertical size={16} />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Staff admin actions" className="min-w-[180px]">
              {staff.email && (
                <DropdownItem
                  key="email"
                  startContent={<Mail size={14} aria-hidden />}
                  onPress={() => {
                    window.location.href = `mailto:${staff.email}`;
                  }}
                >
                  {staff.email}
                </DropdownItem>
              )}
              <DropdownItem
                key="print"
                startContent={<Printer size={14} aria-hidden />}
                onPress={() => window.print()}
              >
                {t("pages.print", "Print")}
              </DropdownItem>
              <DropdownItem
                key="download"
                startContent={<Printer size={14} aria-hidden />}
                onPress={() => window.print()}
              >
                {t("pages.downloadProfile")}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Metric strip — attendance · present · role · joined */}
      <div className="staff-dashboard__metrics">
        <div className="dp-metric">
          <span className="dp-metric__label">Attendance</span>
          <span className="dp-metric__value mono tnum">
            {totalWorking > 0 ? `${attendanceRate}%` : "—"}
          </span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">Present</span>
          <span className="dp-metric__value mono tnum">
            {presentCount}
            {totalWorking > 0 && (
              <span className="subtle" style={{ fontSize: 11, marginLeft: 2 }}>
                /{totalWorking}
              </span>
            )}
          </span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">Role</span>
          <span
            className="dp-metric__value"
            style={{ fontSize: 14, fontWeight: 600 }}
          >
            {roles[0] || "—"}
          </span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">Joined</span>
          <span
            className="dp-metric__value mono tnum"
            style={{ fontSize: 14 }}
          >
            {staff.joinDate || staff.joiningDate || "—"}
          </span>
        </div>
      </div>
    </>
  );
}
