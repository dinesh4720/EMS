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
} from "@heroui/react";
import { Search, X, Download, Bell, AlertTriangle } from "lucide-react";
import { feesApi } from "../../services/api";

const ITEMS_PER_LOAD = 10;

export default function FeeDefaulters() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch defaulters from API
  useEffect(() => {
    const fetchDefaulters = async () => {
      try {
        setLoading(true);
        const data = await feesApi.getDefaulters({});
        console.log('Defaulters loaded:', data.length);
        setDefaulters(data);
      } catch (error) {
        console.error('Error fetching defaulters:', error);
        console.error('Error details:', error.message);
        alert(`Failed to load defaulters: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchDefaulters();
  }, []);

  const filteredDefaulters = useMemo(() => {
    return defaulters.filter((d) => {
      const matchSearch = d.student.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "7" && d.days >= 7 && d.days < 15) ||
        (filter === "15" && d.days >= 15 && d.days < 30) ||
        (filter === "30" && d.days >= 30);
      return matchSearch && matchFilter;
    });
  }, [defaulters, search, filter]);

  const visibleDefaulters = useMemo(
    () => filteredDefaulters.slice(0, visibleCount),
    [filteredDefaulters, visibleCount]
  );

  const hasMore = visibleCount < filteredDefaulters.length;

  // Lazy loading state
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [search, filter]);

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

  const totalPending = filteredDefaulters.reduce((sum, d) => sum + d.pending, 0);

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
        <div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-danger-600" />
            <span className="text-xs text-danger-700 uppercase tracking-wider">Total Defaulters</span>
          </div>
          <p className="text-2xl font-semibold text-danger-700">{defaulters.length}</p>
        </div>

        <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-warning-600" />
            <span className="text-xs text-warning-700 uppercase tracking-wider">&gt;7 Days</span>
          </div>
          <p className="text-2xl font-semibold text-warning-700">
            {defaulters.filter((d) => d.days >= 7 && d.days < 15).length}
          </p>
        </div>

        <div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-danger-600" />
            <span className="text-xs text-danger-700 uppercase tracking-wider">&gt;15 Days</span>
          </div>
          <p className="text-2xl font-semibold text-danger-700">
            {defaulters.filter((d) => d.days >= 15 && d.days < 30).length}
          </p>
        </div>

        <div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-danger-600" />
            <span className="text-xs text-danger-700 uppercase tracking-wider">&gt;30 Days</span>
          </div>
          <p className="text-2xl font-semibold text-danger-700">
            {defaulters.filter((d) => d.days >= 30).length}
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="p-0.5 hover:bg-default-200 rounded cursor-pointer"
              >
                <X size={14} className="text-default-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap items-center">
          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-2 rounded-lg border transition-all duration-200 text-sm cursor-pointer whitespace-nowrap ${
                filter === "all"
                  ? "bg-primary text-white border-primary"
                  : "bg-transparent text-default-600 border-default-300 hover:border-primary"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("7")}
              className={`px-3 py-2 rounded-lg border transition-all duration-200 text-sm cursor-pointer whitespace-nowrap ${
                filter === "7"
                  ? "bg-warning text-white border-warning"
                  : "bg-transparent text-default-600 border-default-300 hover:border-warning"
              }`}
            >
              &gt;7 Days
            </button>
            <button
              onClick={() => setFilter("15")}
              className={`px-3 py-2 rounded-lg border transition-all duration-200 text-sm cursor-pointer whitespace-nowrap ${
                filter === "15"
                  ? "bg-danger text-white border-danger"
                  : "bg-transparent text-default-600 border-default-300 hover:border-danger"
              }`}
            >
              &gt;15 Days
            </button>
            <button
              onClick={() => setFilter("30")}
              className={`px-3 py-2 rounded-lg border transition-all duration-200 text-sm cursor-pointer whitespace-nowrap ${
                filter === "30"
                  ? "bg-danger text-white border-danger"
                  : "bg-transparent text-default-600 border-default-300 hover:border-danger"
              }`}
            >
              &gt;30 Days
            </button>
          </div>

          <div className="h-6 w-px bg-default-200"></div>

          {/* Total Pending */}
          <div className="flex items-center gap-2 px-3 py-2 bg-danger-50 rounded-lg border border-danger-200">
            <span className="text-xs text-danger-700 font-medium">Total Pending:</span>
            <span className="text-sm font-semibold text-danger-700">
              ₹{totalPending.toLocaleString()}
            </span>
          </div>

          <button className="flex items-center gap-2 px-3 py-2 bg-transparent text-default-600 rounded-lg border border-default-300 hover:border-warning hover:bg-warning-50 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
            <Bell size={16} />
            <span>Send Reminders</span>
          </button>

          <button className="flex items-center gap-2 px-3 py-2 bg-transparent text-default-600 rounded-lg border border-default-300 hover:border-primary hover:bg-primary-50 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <Table
        aria-label="Fee defaulters"
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
          <TableColumn>PENDING AMOUNT</TableColumn>
          <TableColumn>DUE DATE</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn align="end">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            <div className="text-center py-8">
              <p className="text-default-400 text-sm">No defaulters found</p>
            </div>
          }
        >
          {visibleDefaulters.map((item) => (
            <TableRow key={item.id} className="hover:bg-default-50 transition-colors">
              <TableCell>
                <User
                  avatarProps={{
                    radius: "full",
                    size: "sm",
                    src: `https://i.pravatar.cc/150?u=${item.id}`,
                  }}
                  description={<span className="text-xs text-default-500">Class {item.class}</span>}
                  name={
                    <span
                      className="text-sm font-medium text-default-900 hover:text-primary transition-colors cursor-pointer"
                      onClick={() => navigate(`/students/${item.id}`)}
                    >
                      {item.student}
                    </span>
                  }
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-danger-600">
                    ₹{item.pending.toLocaleString()}
                  </span>
                  <span className="text-xs text-default-400">Include late fees</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-default-600">{item.dueDate}</span>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={item.days >= 30 ? "danger" : item.days >= 15 ? "warning" : "default"}
                  variant="dot"
                  classNames={{
                    base: "h-6 border border-default-200",
                    content: "text-xs font-medium",
                  }}
                >
                  {item.days} days overdue
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <button className="px-3 py-1.5 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-xs font-medium cursor-pointer">
                    Collect
                  </button>
                  <button className="p-1.5 bg-transparent rounded-lg border border-transparent hover:border-warning hover:bg-warning-50 transition-all duration-200 cursor-pointer text-default-400 hover:text-warning">
                    <Bell size={16} />
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
        {!hasMore && filteredDefaulters.length > ITEMS_PER_LOAD && (
          <span className="text-default-400 text-sm">
            All {filteredDefaulters.length} defaulters loaded
          </span>
        )}
      </div>
    </div>
  );
}
