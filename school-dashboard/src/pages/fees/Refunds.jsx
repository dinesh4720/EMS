import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea } from "@heroui/react";
import { Search, X, Plus, Download } from "lucide-react";
import { feesApi } from "../../services/api";
import toast from "react-hot-toast";

export default function Refunds() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // refund id being actioned

  // New Refund modal
  const [newRefundOpen, setNewRefundOpen] = useState(false);
  const [newRefundForm, setNewRefundForm] = useState({ studentId: "", classId: "", amount: "", reason: "", refundMode: "cash", remarks: "" });
  const [savingRefund, setSavingRefund] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const data = await feesApi.getRefunds({});
      setRefunds(data);
    } catch (error) {
      console.error('Error fetching refunds:', error);
      toast.error('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (refund) => {
    setActionLoading(refund._id);
    try {
      await feesApi.approveRefund(refund._id, {});
      toast.success('Refund approved');
      fetchRefunds();
    } catch (error) {
      toast.error('Failed to approve refund');
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcess = async (refund) => {
    setActionLoading(refund._id);
    try {
      await feesApi.processRefund(refund._id, {});
      toast.success('Refund processed');
      fetchRefunds();
    } catch (error) {
      toast.error('Failed to process refund');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateRefund = async () => {
    if (!newRefundForm.studentId || !newRefundForm.classId || !newRefundForm.amount || !newRefundForm.reason || !newRefundForm.refundMode) {
      toast.error('Please fill all required fields');
      return;
    }
    setSavingRefund(true);
    try {
      await feesApi.createRefund({
        ...newRefundForm,
        amount: parseFloat(newRefundForm.amount),
      });
      toast.success('Refund request created');
      setNewRefundOpen(false);
      setNewRefundForm({ studentId: "", classId: "", amount: "", reason: "", refundMode: "cash", remarks: "" });
      fetchRefunds();
    } catch (error) {
      toast.error('Failed to create refund');
    } finally {
      setSavingRefund(false);
    }
  };

  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      const studentName = r.studentId?.name || '';
      const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [refunds, searchQuery, statusFilter]);

  // Lazy loading
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  const visibleRefunds = useMemo(() => filteredRefunds.slice(0, visibleCount), [filteredRefunds, visibleCount]);
  const hasMore = visibleCount < filteredRefunds.length;

  useEffect(() => { setVisibleCount(ITEMS_PER_LOAD); }, [searchQuery, statusFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + ITEMS_PER_LOAD);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const totalRefunds = filteredRefunds.reduce((sum, r) => sum + (r.amount || 0), 0);
  const pendingCount = filteredRefunds.filter((r) => r.status === "pending").length;
  const processedCount = filteredRefunds.filter((r) => r.status === "processed").length;

  if (loading) {
    return <div className="flex justify-center items-center min-h-[400px]"><Spinner size="lg" /></div>;
  }

  return (
    <div className="w-full flex flex-col">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Refunds</p>
          <p className="text-2xl font-bold text-gray-900">₹{totalRefunds.toLocaleString()}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pending</p>
          <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Processed</p>
          <p className="text-2xl font-bold text-gray-900">{processedCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center border-b border-gray-200 py-4 -mx-6 px-6 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 focus-within:border-gray-400 transition-all">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search student..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-gray-100 rounded">
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            size="sm"
            placeholder="All Status"
            selectedKeys={new Set([statusFilter])}
            onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
            className="w-full sm:w-[140px]"
            classNames={{ trigger: "h-9 min-h-9 bg-white border-gray-200 hover:border-gray-300", value: "text-sm" }}
          >
            <SelectItem key="all">All Status</SelectItem>
            <SelectItem key="pending">Pending</SelectItem>
            <SelectItem key="approved">Approved</SelectItem>
            <SelectItem key="processed">Processed</SelectItem>
          </Select>

          <button
            onClick={() => setNewRefundOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-gray-900 rounded-lg hover:bg-gray-800 transition-all"
          >
            <Plus size={14} />
            <span>New Refund</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden -mx-6 sm:mx-0">
        <Table
          aria-label="Refunds"
          removeWrapper
          classNames={{
            th: "bg-gray-50 text-gray-500 font-medium text-xs uppercase tracking-wider h-11 border-b border-gray-200",
            td: "py-4 border-b border-gray-100",
          }}
        >
          <TableHeader>
            <TableColumn>STUDENT</TableColumn>
            <TableColumn>AMOUNT</TableColumn>
            <TableColumn>REASON</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>DATE</TableColumn>
            <TableColumn align="end">ACTIONS</TableColumn>
          </TableHeader>
          <TableBody emptyContent={<div className="text-center py-8"><p className="text-gray-400 text-sm">No refund records</p></div>}>
            {visibleRefunds.map((refund) => (
              <TableRow key={refund._id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">{refund.studentId?.name?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 hover:text-gray-600 cursor-pointer" onClick={() => navigate(`/students/${refund.studentId?._id}`)}>
                        {refund.studentId?.name}
                      </p>
                      <p className="text-xs text-gray-500">Class {refund.classId?.name} {refund.classId?.section}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono text-gray-900">₹{refund.amount?.toLocaleString() || 0}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{refund.reason || '—'}</span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border rounded ${
                    refund.status === "processed" ? "border-green-200 bg-green-50 text-green-700" :
                    refund.status === "approved" ? "border-blue-200 bg-blue-50 text-blue-700" :
                    refund.status === "rejected" ? "border-red-200 bg-red-50 text-red-700" :
                    "border-yellow-200 bg-yellow-50 text-yellow-700"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      refund.status === "processed" ? "bg-green-500" :
                      refund.status === "approved" ? "bg-blue-500" :
                      refund.status === "rejected" ? "bg-red-500" :
                      "bg-yellow-500"
                    }`}></span>
                    {refund.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-500">{refund.refundDate || '—'}</span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {refund.status === "pending" && (
                      <button
                        onClick={() => handleApprove(refund)}
                        disabled={actionLoading === refund._id}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                      >
                        {actionLoading === refund._id ? '...' : 'Approve'}
                      </button>
                    )}
                    {refund.status === "approved" && (
                      <button
                        onClick={() => handleProcess(refund)}
                        disabled={actionLoading === refund._id}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 border border-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
                      >
                        {actionLoading === refund._id ? '...' : 'Process'}
                      </button>
                    )}
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all">
                      <Download size={14} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Load more */}
        <div ref={loaderRef} className="flex justify-center py-4 bg-gray-50 border-t border-gray-200">
          {isLoadingMore && <Spinner size="sm" />}
          {!hasMore && filteredRefunds.length > ITEMS_PER_LOAD && (
            <span className="text-gray-400 text-xs">All refunds loaded</span>
          )}
        </div>
      </div>

      {/* New Refund Modal */}
      <Modal isOpen={newRefundOpen} onClose={() => setNewRefundOpen(false)} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-gray-200">New Refund Request</ModalHeader>
              <ModalBody className="py-4 space-y-4">
                <Input
                  label="Student ID"
                  placeholder="Enter student ID"
                  value={newRefundForm.studentId}
                  onValueChange={(v) => setNewRefundForm({ ...newRefundForm, studentId: v })}
                  variant="bordered"
                  isRequired
                />
                <Input
                  label="Class ID"
                  placeholder="Enter class ID"
                  value={newRefundForm.classId}
                  onValueChange={(v) => setNewRefundForm({ ...newRefundForm, classId: v })}
                  variant="bordered"
                  isRequired
                />
                <Input
                  type="number"
                  label="Amount (₹)"
                  placeholder="0"
                  value={newRefundForm.amount}
                  onValueChange={(v) => setNewRefundForm({ ...newRefundForm, amount: v })}
                  variant="bordered"
                  isRequired
                />
                <Textarea
                  label="Reason"
                  placeholder="Reason for refund..."
                  value={newRefundForm.reason}
                  onValueChange={(v) => setNewRefundForm({ ...newRefundForm, reason: v })}
                  variant="bordered"
                  isRequired
                  minRows={2}
                />
                <Select
                  label="Refund Mode"
                  variant="bordered"
                  selectedKeys={[newRefundForm.refundMode]}
                  onChange={(e) => setNewRefundForm({ ...newRefundForm, refundMode: e.target.value })}
                >
                  <SelectItem key="cash">Cash</SelectItem>
                  <SelectItem key="cheque">Cheque</SelectItem>
                  <SelectItem key="bank_transfer">Bank Transfer</SelectItem>
                </Select>
                <Textarea
                  label="Remarks (optional)"
                  placeholder="Additional notes..."
                  value={newRefundForm.remarks}
                  onValueChange={(v) => setNewRefundForm({ ...newRefundForm, remarks: v })}
                  variant="bordered"
                  minRows={2}
                />
              </ModalBody>
              <ModalFooter className="border-t border-gray-200 gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleCreateRefund}
                  disabled={savingRefund}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  {savingRefund ? 'Creating...' : 'Create Refund'}
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
