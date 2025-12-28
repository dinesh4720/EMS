import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  User,
  Spinner,
  Select,
  SelectItem,
} from "@heroui/react";
import { Search, X, Plus, Download } from "lucide-react";
import { feesApi } from "../../services/api";

export default function Refunds() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch refunds from API
  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        setLoading(true);
        const data = await feesApi.getRefunds({});
        console.log('Refunds loaded:', data.length);
        setRefunds(data);
      } catch (error) {
        console.error('Error fetching refunds:', error);
        console.error('Error details:', error.message);
        alert(`Failed to load refunds: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchRefunds();
  }, []);

  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      const studentName = r.studentId?.name || '';
      const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [refunds, searchQuery, statusFilter]);

  // Lazy loading state
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  const visibleRefunds = useMemo(
    () => filteredRefunds.slice(0, visibleCount),
    [filteredRefunds, visibleCount]
  );

  const hasMore = visibleCount < filteredRefunds.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [searchQuery, statusFilter]);

  // Lazy loading intersection observer
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

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const totalRefunds = filteredRefunds.reduce((sum, r) => sum + r.amount, 0);
  const pendingRefunds = filteredRefunds.filter((r) => r.status === "pending").length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
        <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-warning-700 uppercase tracking-wider">Total Refunds</span>
          </div>
          <p className="text-2xl font-semibold text-warning-700">
            ₹{totalRefunds.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-danger-700 uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-2xl font-semibold text-danger-700">{pendingRefunds}</p>
        </div>

        <div className="p-4 bg-success-50 rounded-lg border border-success-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-success-700 uppercase tracking-wider">Processed</span>
          </div>
          <p className="text-2xl font-semibold text-success-700">
            {filteredRefunds.filter((r) => r.status === "processed").length}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
            <Search size={16} className="text-default-400" />
            <input
              type="text"
              placeholder="Search student..."
              className="flex-1 bg-transparent outline-none text-sm text-default-900 placeholder:text-default-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-0.5 hover:bg-default-200 rounded cursor-pointer"
              >
                <X size={14} className="text-default-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {/* Filter by Status */}
          <Select
            size="sm"
            placeholder="All Status"
            selectedKeys={new Set([statusFilter])}
            onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
            className="w-full sm:w-[140px]"
            classNames={{
              trigger:
                "h-9 min-h-9 bg-transparent border-default-300 hover:border-primary transition-all duration-200",
              value: "text-sm",
            }}
          >
            <SelectItem key="all">All Status</SelectItem>
            <SelectItem key="pending">Pending</SelectItem>
            <SelectItem key="approved">Approved</SelectItem>
            <SelectItem key="processed">Processed</SelectItem>
          </Select>

          <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
            <Plus size={16} />
            <span>New Refund</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <Table
        aria-label="Refunds"
        removeWrapper
        radius="none"
        classNames={{
          base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0",
          thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6",
          th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors",
          td: "py-5 border-b border-default-200 last:pr-6",
          tbody: "[&>tr>td:first-child]:pl-6 [&>tr:last-child>td]:border-none",
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
        <TableBody
          emptyContent={
            <div className="text-center py-8">
              <p className="text-default-400 text-sm">No refund records found</p>
            </div>
          }
        >
          {visibleRefunds.map((refund) => (
            <TableRow key={refund._id} className="hover:bg-default-50 transition-colors">
              <TableCell>
                <User
                  avatarProps={{
                    radius: "full",
                    size: "sm",
                    src: `https://i.pravatar.cc/150?u=${refund._id}`,
                  }}
                  description={<span className="text-xs text-default-500">Class {refund.classId?.name} {refund.classId?.section}</span>}
                  name={
                    <span
                      className="text-sm font-medium text-default-900 hover:text-primary transition-colors cursor-pointer"
                      onClick={() => navigate(`/students/${refund.studentId?._id}`)}
                    >
                      {refund.studentId?.name}
                    </span>
                  }
                />
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium text-warning-600">
                  ₹{refund.amount.toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-default-600">{refund.reason}</span>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={
                    refund.status === "processed"
                      ? "success"
                      : refund.status === "approved"
                      ? "primary"
                      : "warning"
                  }
                  variant="dot"
                  classNames={{
                    base: "h-6 border border-default-200",
                    content: "text-xs font-medium capitalize",
                  }}
                >
                  {refund.status}
                </Chip>
              </TableCell>
              <TableCell>
                <span className="text-xs text-default-600">{refund.refundDate}</span>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  {refund.status === "pending" && (
                    <button className="px-3 py-1.5 bg-success-50 text-success-700 rounded-lg border border-success-200 hover:bg-success-100 transition-all duration-200 text-xs font-medium cursor-pointer">
                      Approve
                    </button>
                  )}
                  {refund.status === "approved" && (
                    <button className="px-3 py-1.5 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-xs font-medium cursor-pointer">
                      Process
                    </button>
                  )}
                  <button className="p-1.5 bg-transparent rounded-lg border border-transparent hover:border-primary hover:bg-primary-50 transition-all duration-200 cursor-pointer text-default-400 hover:text-primary">
                    <Download size={16} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Lazy loading indicator */}
      <div ref={loaderRef} className="flex justify-center py-4 -mx-6">
        {isLoadingMore && <Spinner size="sm" color="primary" />}
        {!hasMore && filteredRefunds.length > ITEMS_PER_LOAD && (
          <span className="text-default-400 text-sm">All {filteredRefunds.length} refunds loaded</span>
        )}
      </div>
    </div>
  );
}
