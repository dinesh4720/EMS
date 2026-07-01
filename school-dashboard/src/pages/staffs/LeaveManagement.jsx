import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea,
} from "@heroui/react";
import { Check, X, AlertTriangle, CalendarRange } from "lucide-react";
import { staffAttendanceApi } from "../../services/api/classes";
import toast from "react-hot-toast";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import { PageHeader, Breadcrumbs, EmptyState, ErrorState } from "../../components/ui";

function safeFormat(dateStr) {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd MMM yyyy");
  } catch {
    return dateStr;
  }
}

function leaveBounds(leave) {
  const app = leave?.leaveApplication || {};
  const start = app.startDate || leave?.date || null;
  const end = app.endDate || app.startDate || leave?.date || null;
  return { start, end };
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  try {
    const aS = new Date(aStart).getTime();
    const aE = new Date(aEnd).getTime();
    const bS = new Date(bStart).getTime();
    const bE = new Date(bEnd).getTime();
    return aS <= bE && bS <= aE;
  } catch {
    return false;
  }
}

export default function LeaveManagement() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, leaveId: null, reason: "" });

  const fetchLeaves = useCallback(async () => {
    try {
      setLoadError(null);
      const data = await staffAttendanceApi.getPendingLeaves();
      setLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(err);
      toast.error("Failed to load pending leave requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // Default-select the first row on desktop so the right pane is never blank.
  useEffect(() => {
    if (!selectedId && leaves.length > 0) {
      setSelectedId(leaves[0]._id);
    }
  }, [leaves, selectedId]);

  // Overlap detection: flag leaves for the same staff whose date ranges
  // intersect any *other* pending request from the same staff. Used both to
  // render a per-row marker and to show a banner inside the detail pane so
  // approvers can act on a conflict without manually cross-referencing rows.
  const overlapMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < leaves.length; i++) {
      const li = leaves[i];
      const staffId = li.staffId?._id || li.staffId?.id;
      const { start: aS, end: aE } = leaveBounds(li);
      if (!staffId || !aS) continue;
      for (let j = 0; j < leaves.length; j++) {
        if (i === j) continue;
        const lj = leaves[j];
        const otherStaffId = lj.staffId?._id || lj.staffId?.id;
        if (String(otherStaffId) !== String(staffId)) continue;
        const { start: bS, end: bE } = leaveBounds(lj);
        if (rangesOverlap(aS, aE, bS, bE)) {
          if (!map.has(li._id)) map.set(li._id, []);
          map.get(li._id).push(lj._id);
        }
      }
    }
    return map;
  }, [leaves]);

  const selected = useMemo(
    () => leaves.find((l) => l._id === selectedId) || null,
    [leaves, selectedId]
  );

  const handleApprove = async (id) => {
    if (!id) return;
    setProcessingId(id);
    try {
      await staffAttendanceApi.approveLeave(id, { approvalStatus: "approved" });
      toast.success("Leave request approved");
      // Drop the actioned row locally so the pane updates immediately,
      // then refetch to stay in sync with backend pagination/sort.
      setLeaves((prev) => prev.filter((l) => l._id !== id));
      setSelectedId(null);
      await fetchLeaves();
    } catch (err) {
      toast.error(err.message || "Failed to approve leave");
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (leaveId) => {
    setRejectModal({ open: true, leaveId, reason: "" });
  };

  const handleReject = async () => {
    const { leaveId, reason } = rejectModal;
    setRejectModal((s) => ({ ...s, open: false }));
    if (!leaveId) return;
    setProcessingId(leaveId);
    try {
      await staffAttendanceApi.approveLeave(leaveId, {
        approvalStatus: "rejected",
        rejectionReason: reason,
      });
      toast.success("Leave request rejected");
      setLeaves((prev) => prev.filter((l) => l._id !== leaveId));
      setSelectedId(null);
      await fetchLeaves();
    } catch (err) {
      toast.error(err.message || "Failed to reject leave");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <TablePageSkeleton />;

  return (
    <div className="page">
      <PageHeader
        title="Leave Requests"
        description={
          <span className="row gap-1">
            <span className="mono tnum">{leaves.length}</span> pending
            {overlapMap.size > 0 && (
              <>
                {" · "}
                <span className="status status--warn" style={{ marginLeft: 4 }}>
                  <span className="dot" />
                  {overlapMap.size} overlap{overlapMap.size === 1 ? "" : "s"}
                </span>
              </>
            )}
          </span>
        }
        breadcrumb={
          <Breadcrumbs
            size="sm"
            items={[
              { label: "Staff", href: "/staffs" },
              { label: "Attendance", href: "/staffs/attendance" },
              { label: "Leave Requests" },
            ]}
          />
        }
      />

      {loadError ? (
        <ErrorState
          title="Unable to load leave requests"
          error={loadError}
          onRetry={fetchLeaves}
          size="lg"
        />
      ) : leaves.length === 0 ? (
        <EmptyState
          icon={Check}
          kind="ok"
          size="md"
          title="No pending requests"
          description="All leave applications have been reviewed."
        />
      ) : (
        <div className="twopane">
          {/* Left list */}
          <div className="twopane__list">
            <div className="twopane__list-scroll" role="listbox" aria-label="Pending leave requests">
              {leaves.map((leave) => {
                const staff = leave.staffId || {};
                const app = leave.leaveApplication || {};
                const { start, end } = leaveBounds(leave);
                const isActive = selectedId === leave._id;
                const hasOverlap = overlapMap.has(leave._id);
                const days =
                  start && end ? Math.max(1, differenceInCalendarDays(new Date(end), new Date(start)) + 1) : 1;
                return (
                  <button
                    key={leave._id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`leaverow ${isActive ? "is-active" : ""} ${hasOverlap ? "is-overlap" : ""}`}
                    onClick={() => setSelectedId(leave._id)}
                  >
                    <div className="leaverow__main">
                      <span className="leaverow__name">{staff.name || "—"}</span>
                      <span className="leaverow__sub">
                        <span className={`chip chip--warn`} style={{ textTransform: "capitalize" }}>
                          {app.leaveType || "leave"}
                        </span>
                        {staff.department && <span className="subtle">{staff.department}</span>}
                        {hasOverlap && (
                          <span className="status status--warn" title="Overlaps with another pending request">
                            <AlertTriangle size={11} />
                            overlap
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="leaverow__right">
                      <span className="mono tnum" style={{ fontSize: 12 }}>
                        {start && end && start !== end
                          ? `${safeFormat(start)} – ${safeFormat(end)}`
                          : safeFormat(start)}
                      </span>
                      <span className="leaverow__days mono tnum">
                        {days} day{days === 1 ? "" : "s"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right detail */}
          <div className="twopane__detail">
            {!selected ? (
              <div className="subtle" style={{ padding: 32, fontSize: 13 }}>
                Select a request to review.
              </div>
            ) : (() => {
              const staff = selected.staffId || {};
              const app = selected.leaveApplication || {};
              const { start, end } = leaveBounds(selected);
              const days =
                start && end ? Math.max(1, differenceInCalendarDays(new Date(end), new Date(start)) + 1) : 1;
              const overlaps = overlapMap.get(selected._id) || [];
              const isProcessing = processingId === selected._id;

              return (
                <div className="leavedetail">
                  <div className="leavedetail__head">
                    <h2 className="leavedetail__title">{staff.name || "—"}</h2>
                    <div className="leavedetail__meta">
                      {[staff.department, staff.role && (Array.isArray(staff.role) ? staff.role[0] : staff.role)]
                        .filter(Boolean)
                        .join(" · ") || "Staff"}
                    </div>
                  </div>

                  <div className="leavedetail__body">
                    <div className="dp-metric" style={{ padding: 0, gap: 4 }}>
                      <span className="dp-metric__label">
                        <CalendarRange size={11} style={{ display: "inline", marginRight: 4 }} />
                        Date range
                      </span>
                      <span className="dp-metric__value mono tnum" style={{ fontSize: 14 }}>
                        {start && end && start !== end
                          ? `${safeFormat(start)} – ${safeFormat(end)}`
                          : safeFormat(start)}
                        <span className="subtle" style={{ marginLeft: 8, fontSize: 12, fontWeight: 460 }}>
                          ({days} day{days === 1 ? "" : "s"})
                        </span>
                      </span>
                    </div>

                    <dl className="leavedetail__kv">
                      <dt>Leave type</dt>
                      <dd style={{ textTransform: "capitalize" }}>{app.leaveType || "—"}</dd>
                      <dt>Applied</dt>
                      <dd className="mono tnum">{safeFormat(app.appliedAt)}</dd>
                      <dt>Status</dt>
                      <dd>
                        <span className="status status--warn">
                          <span className="dot" /> pending
                        </span>
                      </dd>
                      {staff.email && (
                        <>
                          <dt>Email</dt>
                          <dd className="mono tnum">{staff.email}</dd>
                        </>
                      )}
                      {staff.phone && (
                        <>
                          <dt>Phone</dt>
                          <dd className="mono tnum">{staff.phone}</dd>
                        </>
                      )}
                    </dl>

                    <div>
                      <div className="card__title" style={{ fontSize: 11.5, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--fg-subtle)" }}>
                        Reason
                      </div>
                      <div className="leavedetail__reason">{app.reason || "—"}</div>
                    </div>

                    {overlaps.length > 0 && (
                      <div className="leavedetail__overlap" role="alert">
                        <AlertTriangle size={14} />
                        <div>
                          <strong>Overlapping pending request{overlaps.length === 1 ? "" : "s"} detected</strong>
                          <div style={{ marginTop: 2 }}>
                            This staff member has {overlaps.length} other pending request
                            {overlaps.length === 1 ? "" : "s"} whose dates intersect this one. Resolve one
                            before approving to avoid double-counting leave days.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="leavedetail__foot">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => openRejectModal(selected._id)}
                      disabled={isProcessing}
                    >
                      <X size={13} /> Reject
                    </button>
                    <button
                      type="button"
                      className="btn btn--accent"
                      style={{ flex: 1 }}
                      onClick={() => handleApprove(selected._id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        "Working…"
                      ) : (
                        <>
                          <Check size={13} /> Approve
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal((s) => ({ ...s, open: false }))}
        size="md"
      >
        <ModalContent>
          <ModalHeader>Reject Leave Request</ModalHeader>
          <ModalBody>
            <Textarea
              label="Rejection Reason (optional)"
              placeholder="Provide a reason for rejecting this leave request..."
              value={rejectModal.reason}
              onValueChange={(v) => setRejectModal((s) => ({ ...s, reason: v }))}
              variant="bordered"
              minRows={3}
            />
          </ModalBody>
          <ModalFooter>
            <button
              type="button"
              className="btn"
              onClick={() => setRejectModal((s) => ({ ...s, open: false }))}
            >
              Cancel
            </button>
            <button type="button" className="btn btn--primary" onClick={handleReject}>
              Reject
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
