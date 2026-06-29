import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import PhotoAvatar from "../../../components/PhotoAvatar";
import { toTodayDateString } from "../../../utils/dateFormatter";
import { isBirthdayToday } from "../formatters";
import EmptyState from "../../../components/ui/EmptyState";

function PersonRow({ name, sub, badge, photo, type }) {
  return (
    <div className="pulse">
      <PhotoAvatar name={name} src={photo} size="sm" type={type} className="pulse__avatar-img" />
      <div className="pulse__main">
        <div className="pulse__name">{name}</div>
        <div className="pulse__sub">{sub}</div>
      </div>
      {badge}
    </div>
  );
}

const STAFF_STATUS_MAP = {
  present: { label: "Present", tone: "ok" },
  absent: { label: "Absent", tone: "danger" },
  leave: { label: "Leave", tone: "warn" },
  halfday: { label: "Half day", tone: "warn" },
};

export default function PeopleSection({ staff, students, staffAttendance, classes }) {
  const [tab, setTab] = useState("staff");
  const todayStr = toTodayDateString();

  const activeStaff = useMemo(
    () => (staff || []).filter((s) => (s.status || "active") === "active"),
    [staff]
  );

  const absentStaff = useMemo(
    () =>
      activeStaff.filter((s) => {
        const rec = staffAttendance?.[s.id]?.[todayStr];
        return rec && rec.status !== "present" && rec.status !== "unmarked";
      }),
    [activeStaff, staffAttendance, todayStr]
  );

  const staffBirthdays = useMemo(
    () => activeStaff.filter((s) => isBirthdayToday(s.dob)),
    [activeStaff]
  );

  const presentStaff = useMemo(
    () =>
      activeStaff.filter((s) => {
        const rec = staffAttendance?.[s.id]?.[todayStr];
        return rec?.status === "present";
      }),
    [activeStaff, staffAttendance, todayStr]
  );

  const activeStudents = useMemo(
    () => (students || []).filter((s) => (s.status || "active") === "active"),
    [students]
  );

  const studentBirthdays = useMemo(
    () => activeStudents.filter((s) => isBirthdayToday(s.dateOfBirth || s.dob)),
    [activeStudents]
  );

  const feeDueStudents = useMemo(
    () =>
      activeStudents.filter((s) =>
        ["overdue", "partial", "pending"].includes(s.feeStatus)
      ),
    [activeStudents]
  );

  const classMap = useMemo(() => {
    const map = {};
    (classes || []).forEach((c) => {
      map[c.id] = c.name || c.className || "";
    });
    return map;
  }, [classes]);

  const staffStatusBadge = (s) => {
    const rec = staffAttendance?.[s.id]?.[todayStr];
    if (!rec || rec.status === "unmarked") return null;
    const info = STAFF_STATUS_MAP[rec.status];
    if (!info) return null;
    return <span className={`status status--${info.tone}`}>{info.label}</span>;
  };

  const staffSub = (s) => [s.role, s.department].filter(Boolean).join(" · ");
  const studentClassName = (s) => classMap[s.classId] || s.className || "";

  return (
    <div className="dash-section">
      <div className="dash-people-header">
        <h2 className="dash-section-title">People</h2>
        <div className="dash-people-tabs">
          <button
            type="button"
            className={`dash-people-tab${tab === "staff" ? " is-active" : ""}`}
            onClick={() => setTab("staff")}
          >
            Staff
          </button>
          <button
            type="button"
            className={`dash-people-tab${tab === "students" ? " is-active" : ""}`}
            onClick={() => setTab("students")}
          >
            Students
          </button>
        </div>
      </div>
      <div className="dash-section-card">
        {tab === "staff" ? (
          <div className="pulse-list">
            {absentStaff.length > 0 && (
              <>
                <div className="pulse__group">Absent today · {absentStaff.length}</div>
                {absentStaff.map((s) => (
                  <PersonRow
                    key={s.id}
                    name={s.name}
                    photo={s.picture || s.photo}
                    type="staff"
                    sub={staffSub(s)}
                    badge={staffStatusBadge(s)}
                  />
                ))}
              </>
            )}
            {staffBirthdays.length > 0 && (
              <>
                <div className="pulse__group">Birthdays · {staffBirthdays.length}</div>
                {staffBirthdays.map((s) => (
                  <PersonRow
                    key={s.id}
                    name={s.name}
                    photo={s.picture || s.photo}
                    type="staff"
                    sub={staffSub(s)}
                  />
                ))}
              </>
            )}
            {presentStaff.length > 0 && (
              <>
                <div className="pulse__group">On campus · {presentStaff.length}</div>
                {presentStaff.slice(0, 5).map((s) => (
                  <PersonRow
                    key={s.id}
                    name={s.name}
                    photo={s.picture || s.photo}
                    type="staff"
                    sub={staffSub(s)}
                    badge={staffStatusBadge(s)}
                  />
                ))}
              </>
            )}
            {absentStaff.length === 0 &&
              staffBirthdays.length === 0 &&
              presentStaff.length === 0 && (
                <EmptyState icon={Users} title="No staff data available" size="sm" className="flex-1" />
              )}
          </div>
        ) : (
          <div className="pulse-list">
            {studentBirthdays.length > 0 && (
              <>
                <div className="pulse__group">Birthdays · {studentBirthdays.length}</div>
                {studentBirthdays.map((s) => (
                  <PersonRow
                    key={s.id}
                    name={s.name}
                    photo={s.photo || s.picture}
                    type="student"
                    sub={studentClassName(s)}
                  />
                ))}
              </>
            )}
            {feeDueStudents.length > 0 && (
              <>
                <div className="pulse__group">Fee due · {feeDueStudents.length}</div>
                {feeDueStudents.slice(0, 5).map((s) => (
                  <PersonRow
                    key={s.id}
                    name={s.name}
                    photo={s.photo || s.picture}
                    type="student"
                    sub={[studentClassName(s), s.feeStatus].filter(Boolean).join(" · ")}
                    badge={<span className="status status--danger">Due</span>}
                  />
                ))}
              </>
            )}
            {activeStudents.length > 0 &&
              feeDueStudents.length === 0 &&
              studentBirthdays.length === 0 && (
                <>
                  <div className="pulse__group">Active · {activeStudents.length}</div>
                  {activeStudents.slice(0, 6).map((s) => (
                    <PersonRow
                      key={s.id}
                      name={s.name}
                      photo={s.photo || s.picture}
                      type="student"
                      sub={studentClassName(s)}
                      badge={<span className="status status--ok">Active</span>}
                    />
                  ))}
                </>
              )}
            {activeStudents.length === 0 && (
              <EmptyState icon={Users} title="No student data available" size="sm" className="flex-1" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
