import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Textarea, Input, Divider,
} from "@heroui/react";
import { Calendar as CalendarIcon, Check, X, AlertCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { CardGridPageSkeleton } from "../../components/skeletons/PageSkeletons";
import logger from "../../utils/logger";
import { PageHeader, Breadcrumbs } from "../../components/ui";
import { isActiveStaff } from "./utils/staffHelpers";

const STATUS_META = {
  present: { label: "Present", tone: "ok" },
  absent: { label: "Absent", tone: "danger" },
  leave: { label: "Leave", tone: "warn" },
  halfday: { label: "Half day", tone: "info" },
  unmarked: { label: "Unmarked", tone: "muted" },
};

export default function StaffAttendanceRegularize() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    staff,
    staffAttendance,
    requestRegularization,
    fetchStaffAttendanceByStaff,
    loading,
  } = useApp();
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [regularizeModalOpen, setRegularizeModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [regularizeData, setRegularizeData] = useState({
    status: "present",
    inTime: "",
    outTime: "",
    reason: "",
  });

  // Race-condition guards:
  //  - requestSeqRef ignores stale month/year fetches if the user navigated
  //    again before the previous response landed.
  //  - submitToken stops double-fire from rapid Regularize clicks.
  const requestSeqRef = useRef(0);
  const submitTokenRef = useRef(null);

  const selectedStaff = useMemo(
    () => staff.find((member) => String(member.id) === String(selectedStaffId)),
    [staff, selectedStaffId]
  );

  useEffect(() => {
    if (!selectedStaffId) return;
    const seq = ++requestSeqRef.current;
    const start = format(new Date(currentYear, currentMonth, 1), "yyyy-MM-dd");
    const end = format(new Date(currentYear, currentMonth + 1, 0), "yyyy-MM-dd");
    (async () => {
      try {
        await fetchStaffAttendanceByStaff(selectedStaffId, start, end);
        // If a newer request fired after this one, drop the result silently.
        if (seq !== requestSeqRef.current) return;
      } catch (err) {
        if (seq === requestSeqRef.current) logger.error("Failed to load staff attendance:", err);
      }
    })();
  }, [selectedStaffId, currentMonth, currentYear, fetchStaffAttendanceByStaff]);

  const calendarData = useMemo(() => {
    if (!selectedStaffId) return [];
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push({ isEmpty: true });
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const attendance = staffAttendance[selectedStaffId]?.[dateStr];
      const todayStr = new Date().toISOString().split("T")[0];
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;
      days.push({ day, dateStr, attendance, isToday, isFuture });
    }
    return days;
  }, [selectedStaffId, currentMonth, currentYear, staffAttendance]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  };
  const isAtCurrentMonth =
    currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();

  const handleDayClick = (dayData) => {
    if (dayData.isEmpty || dayData.isFuture) return;
    setSelectedDate(dayData);
    setRegularizeData({
      status: dayData.attendance?.status || "present",
      inTime: dayData.attendance?.inTime || "09:00",
      outTime: dayData.attendance?.outTime || "17:00",
      reason: dayData.attendance?.reason || "",
    });
    setRegularizeModalOpen(true);
  };

  const handleRegularize = async () => {
    if (!selectedDate || !selectedStaffId) return;
    // Race guard: tag this submission and bail out if a newer one started.
    const token = Symbol("regularize");
    submitTokenRef.current = token;
    setSubmitting(true);
    try {
      await requestRegularization(
        selectedStaffId,
        selectedDate.dateStr,
        regularizeData.status,
        regularizeData.reason
      );
      if (submitTokenRef.current !== token) return;
      toast.success(t("toast.success.attendanceRegularizedSuccessfully"));
      setRegularizeModalOpen(false);
      setSelectedDate(null);
    } catch (error) {
      if (submitTokenRef.current !== token) return;
      logger.error("Regularization failed:", error);
      toast.error(error.message || "Failed to regularize attendance");
    } finally {
      if (submitTokenRef.current === token) setSubmitting(false);
    }
  };

  const monthStats = useMemo(() => {
    const stats = { present: 0, absent: 0, leave: 0, halfday: 0, unmarked: 0 };
    if (!selectedStaffId) return stats;
    calendarData.forEach((day) => {
      if (!day.isEmpty && !day.isFuture) {
        const status = day.attendance?.status || "unmarked";
        if (stats[status] != null) stats[status]++;
      }
    });
    return stats;
  }, [selectedStaffId, calendarData]);

  const dayClass = (dayData) => {
    if (dayData.isEmpty) return "is-empty";
    if (dayData.isFuture) return "";
    const status = dayData.attendance?.status;
    const tone = STATUS_META[status]?.tone;
    return [
      dayData.isToday ? "is-today" : "",
      tone === "ok" ? "is-present" : tone === "danger" ? "is-absent" : tone === "warn" ? "is-leave" : tone === "info" ? "is-halfday" : "",
    ].filter(Boolean).join(" ");
  };

  if (loading) {
    return <CardGridPageSkeleton title cards={5} columns="grid-cols-2 sm:grid-cols-5" />;
  }

  return (
    <div className="page">
      <PageHeader
        title="Regularize Attendance"
        description="View and adjust per-day staff attendance records."
        breadcrumb={
          <Breadcrumbs
            size="sm"
            items={[
              { label: "Staff", href: "/staffs" },
              { label: "Attendance", href: "/staffs/attendance" },
              { label: "Regularize Attendance" },
            ]}
          />
        }
      />

      {/* Staff picker — uses HeroUI Select so existing staff data renders;
          wrapped in a card to match other pages' density. */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card__body" style={{ padding: 14 }}>
          <Select
            label="Select staff member"
            placeholder="Choose a staff member to view attendance"
            selectedKeys={selectedStaffId ? [selectedStaffId] : []}
            onSelectionChange={(keys) => setSelectedStaffId(Array.from(keys)[0])}
            variant="bordered"
            size="md"
            aria-label="Select staff"
          >
            {staff
              .filter((m) => isActiveStaff(m))
              .map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} {m.department ? `— ${m.department}` : ""}
                </SelectItem>
              ))}
          </Select>
        </div>
      </div>

      {!selectedStaffId ? (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <div className="assign-empty">
            <div className="assign-empty__icon">
              <CalendarIcon size={20} />
            </div>
            <div className="assign-empty__title">Select a staff member</div>
            <div className="assign-empty__sub">
              Choose a staff member above to view their attendance calendar and regularize records.
            </div>
            <div
              className="row gap-2"
              style={{ marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}
            >
              <span className="status status--ok"><span className="dot" />Present</span>
              <span className="status status--danger"><span className="dot" />Absent</span>
              <span className="status status--warn"><span className="dot" />Leave</span>
              <span className="status status--info"><span className="dot" />Half day</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* KPI strip — mirrors detail-pane__metrics */}
          <div className="detail-pane__metrics" style={{ margin: "0 0 12px", gridTemplateColumns: "repeat(5, 1fr)" }}>
            {(["present", "absent", "leave", "halfday", "unmarked"]).map((k) => (
              <div key={k} className="dp-metric">
                <span className="dp-metric__label">{STATUS_META[k].label}</span>
                <span className="dp-metric__value mono tnum">{monthStats[k]}</span>
              </div>
            ))}
          </div>

          {/* Calendar */}
          <div className="card">
            <div className="card__head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="row" style={{ alignItems: "center", gap: 8 }}>
                <CalendarIcon size={14} className="text-fg-muted" />
                <span className="card__title">
                  {monthNames[currentMonth]} <span className="mono tnum">{currentYear}</span>
                </span>
                {selectedStaff && (
                  <span className="chip" style={{ marginLeft: 8 }}>
                    {selectedStaff.name}
                  </span>
                )}
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={handlePreviousMonth}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                  disabled={isAtCurrentMonth}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="card__body">
              <div className="regcal" style={{ marginBottom: 8 }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="regcal__head">{d}</div>
                ))}
              </div>
              <div className="regcal">
                {calendarData.map((dayData, index) => (
                  <button
                    key={dayData.dateStr || `empty-${index}`}
                    type="button"
                    onClick={() => handleDayClick(dayData)}
                    disabled={dayData.isEmpty || dayData.isFuture}
                    className={`regcal__day ${dayClass(dayData)}`}
                    aria-label={dayData.isEmpty ? "" : `Day ${dayData.day}${dayData.attendance?.status ? ` — ${dayData.attendance.status}` : ""}`}
                  >
                    {!dayData.isEmpty && (
                      <>
                        <span>{dayData.day}</span>
                        {dayData.attendance?.status && <span className="regcal__day__dot" style={{ background: "currentColor" }} />}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Regularize Modal */}
      <Modal
        isOpen={regularizeModalOpen}
        onOpenChange={(open) => {
          if (!submitting) setRegularizeModalOpen(open);
        }}
        size="lg"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Regularize attendance</h3>
                <p className="text-sm text-fg-muted font-normal mono tnum">
                  {selectedStaff?.name} · {selectedDate?.dateStr}
                </p>
              </ModalHeader>
              <Divider />
              <ModalBody className="py-6">
                <div className="space-y-4">
                  <Select
                    label="Status"
                    selectedKeys={[regularizeData.status]}
                    onSelectionChange={(keys) =>
                      setRegularizeData({ ...regularizeData, status: Array.from(keys)[0] })
                    }
                    variant="bordered"
                  >
                    <SelectItem key="present" startContent={<Check size={14} />}>Present</SelectItem>
                    <SelectItem key="halfday" startContent={<AlertCircle size={14} />}>Half day</SelectItem>
                    <SelectItem key="absent" startContent={<X size={14} />}>Absent</SelectItem>
                    <SelectItem key="leave" startContent={<Clock size={14} />}>On leave</SelectItem>
                  </Select>

                  {(regularizeData.status === "present" || regularizeData.status === "halfday") && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="time"
                        label="Check-in"
                        value={regularizeData.inTime}
                        onValueChange={(value) =>
                          setRegularizeData({ ...regularizeData, inTime: value })
                        }
                        variant="bordered"
                      />
                      <Input
                        type="time"
                        label="Check-out"
                        value={regularizeData.outTime}
                        onValueChange={(value) =>
                          setRegularizeData({ ...regularizeData, outTime: value })
                        }
                        variant="bordered"
                      />
                    </div>
                  )}

                  <Textarea
                    label="Reason / Notes"
                    placeholder="Enter reason for regularization"
                    value={regularizeData.reason}
                    onValueChange={(value) =>
                      setRegularizeData({ ...regularizeData, reason: value })
                    }
                    variant="bordered"
                    minRows={3}
                  />

                  {selectedDate?.attendance && (
                    <div className="staff-banner">
                      <div className="staff-banner__icon">
                        <AlertCircle size={14} />
                      </div>
                      <div>
                        <div className="staff-banner__title">Current record</div>
                        <div className="staff-banner__body" style={{ marginTop: 4 }}>
                          <span className="mono tnum">
                            {selectedDate.attendance.status}
                            {selectedDate.attendance.inTime ? ` · in ${selectedDate.attendance.inTime}` : ""}
                            {selectedDate.attendance.outTime ? ` · out ${selectedDate.attendance.outTime}` : ""}
                          </span>
                          {selectedDate.attendance.reason && (
                            <div className="subtle" style={{ marginTop: 2 }}>{selectedDate.attendance.reason}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>
              <Divider />
              <ModalFooter>
                <button
                  type="button"
                  className="btn"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn--accent"
                  onClick={handleRegularize}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Regularize"}
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
