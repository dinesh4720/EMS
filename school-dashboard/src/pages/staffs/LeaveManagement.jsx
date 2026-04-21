import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardBody, Button, Chip, Modal, ModalContent, ModalHeader,
  ModalBody, ModalFooter, Textarea, Spinner,
} from "@heroui/react";
import { ArrowLeft, Check, X } from "lucide-react";
import { staffAttendanceApi } from "../../services/api/classes";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";

export default function LeaveManagement() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  // processingId tracks which row is being acted on — keeps buttons disabled until refetch completes
  const [processingId, setProcessingId] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, leaveId: null, reason: "" });

  const fetchLeaves = useCallback(async () => {
    try {
      const data = await staffAttendanceApi.getPendingLeaves();
      setLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load pending leave requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await staffAttendanceApi.approveLeave(id, { approvalStatus: "approved" });
      toast.success("Leave request approved");
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
    setProcessingId(leaveId);
    try {
      await staffAttendanceApi.approveLeave(leaveId, {
        approvalStatus: "rejected",
        rejectionReason: reason,
      });
      toast.success("Leave request rejected");
      await fetchLeaves();
    } catch (err) {
      toast.error(err.message || "Failed to reject leave");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return format(parseISO(dateStr), "dd MMM yyyy");
    } catch {
      return dateStr;
    }
  };

  if (loading) return <TablePageSkeleton />;

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <Button isIconOnly variant="light" aria-label="Back to attendance" onPress={() => navigate("/staffs/attendance")}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-default-900">Leave Requests</h1>
          <p className="text-sm text-default-500 mt-1">Review and action pending staff leave applications</p>
        </div>
      </div>

      {leaves.length === 0 ? (
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-12 text-center">
            <Check size={48} className="text-success-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-default-900 mb-1">No pending requests</h3>
            <p className="text-sm text-default-500">All leave applications have been reviewed.</p>
          </CardBody>
        </Card>
      ) : (
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-default-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-default-500 uppercase tracking-wider">Staff</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-default-500 uppercase tracking-wider">Leave Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-default-500 uppercase tracking-wider">Date(s)</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-default-500 uppercase tracking-wider">Reason</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-default-500 uppercase tracking-wider">Applied</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-default-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => {
                    const isProcessing = processingId === leave._id;
                    const app = leave.leaveApplication || {};
                    const staff = leave.staffId || {};
                    const dateRange =
                      app.startDate && app.endDate && app.startDate !== app.endDate
                        ? `${formatDate(app.startDate)} – ${formatDate(app.endDate)}`
                        : formatDate(app.startDate || leave.date);

                    return (
                      <tr key={leave._id} className="border-b border-default-100 last:border-none">
                        <td className="px-4 py-4">
                          <p className="font-medium text-default-800">{staff.name || "—"}</p>
                          <p className="text-xs text-default-500">{staff.department || ""}</p>
                        </td>
                        <td className="px-4 py-4">
                          <Chip size="sm" variant="flat" color="warning" className="capitalize">
                            {app.leaveType || "—"}
                          </Chip>
                        </td>
                        <td className="px-4 py-4 text-default-700">{dateRange}</td>
                        <td className="px-4 py-4 text-default-600 max-w-[200px] truncate">
                          {app.reason || "—"}
                        </td>
                        <td className="px-4 py-4 text-default-500 text-xs">
                          {app.appliedAt ? formatDate(app.appliedAt) : "—"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2 justify-end">
                            {isProcessing ? (
                              <Spinner size="sm" color="primary" />
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  color="success"
                                  variant="flat"
                                  startContent={<Check size={14} />}
                                  onPress={() => handleApprove(leave._id)}
                                  isDisabled={isProcessing}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="flat"
                                  startContent={<X size={14} />}
                                  onPress={() => openRejectModal(leave._id)}
                                  isDisabled={isProcessing}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      <Modal isOpen={rejectModal.open} onClose={() => setRejectModal((s) => ({ ...s, open: false }))} size="md">
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
            <Button variant="light" onPress={() => setRejectModal((s) => ({ ...s, open: false }))}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleReject}>
              Reject
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
