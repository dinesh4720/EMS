import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Select, SelectItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { Search, X, Download, Bell, MoreVertical, CreditCard } from "lucide-react";
import { feesApi } from "../../services/api";

const ITEMS_PER_LOAD = 10;

export default function FeeDefaulters() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lazy loading state
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  useEffect(() => {
    const fetchDefaulters = async () => {
      try {
        setLoading(true);
        const data = await feesApi.getDefaulters({});
        setDefaulters(data);
      } catch (error) {
        console.error('Error fetching defaulters:', error);
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

  const visibleDefaulters = useMemo(() => filteredDefaulters.slice(0, visibleCount), [filteredDefaulters, visibleCount]);
  const hasMore = visibleCount < filteredDefaulters.length;

  useEffect(() => { setVisibleCount(ITEMS_PER_LOAD); }, [search, filter]);

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

  const totalPending = filteredDefaulters.reduce((sum, d) => sum + d.pending, 0);

  const handleSendReminders = () => {
    alert(`Sending reminders to ${filteredDefaulters.length} defaulters...`);
  };

  const handleExportDefaulters = () => {
    const headers = ['Student', 'Class', 'Roll No', 'Pending Amount', 'Due Date', 'Days Overdue', 'Phone'];
    const rows = filteredDefaulters.map(d => [d.student, d.class, d.rollNo, d.pending, d.dueDate, d.days, d.phone || 'N/A']);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee-defaulters-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSendReminder = (defaulter) => {
    alert(`Reminder will be sent to ${defaulter.student}`);
  };

  const handleCollectFee = (defaulter) => {
    navigate('/fees', { state: { selectedStudentId: defaulter.id } });
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[400px]"><Spinner size="lg" /></div>;
  }

  return (
    <div className="w-full flex flex-col">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Defaulters</p>
          <p className="text-2xl font-bold text-gray-900">{filteredDefaulters.length}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Pending</p>
          <p className="text-2xl font-bold text-gray-900">₹{totalPending.toLocaleString()}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">30+ Days Overdue</p>
          <p className="text-2xl font-bold text-gray-900">{defaulters.filter((d) => d.days >= 30).length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center border-b border-gray-200 py-4 -mx-6 px-6 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 focus-within:border-gray-400 transition-all">
            <Search size={16} className="text-gray-400" />
            <input
              type="search"
              placeholder="Search student..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="p-0.5 hover:bg-gray-100 rounded">
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <Select
            size="sm"
            placeholder="Filter by days"
            selectedKeys={new Set([filter])}
            onSelectionChange={(keys) => setFilter(Array.from(keys)[0])}
            className="w-36"
            classNames={{ trigger: "h-9 bg-white border-gray-200 hover:border-gray-300" }}
          >
            <SelectItem key="all">All</SelectItem>
            <SelectItem key="7">7+ Days</SelectItem>
            <SelectItem key="15">15+ Days</SelectItem>
            <SelectItem key="30">30+ Days</SelectItem>
          </Select>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handleSendReminders} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <Bell size={14} />
            <span>Remind All</span>
          </button>
          <button onClick={handleExportDefaulters} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden -mx-6 sm:mx-0">
        <Table
          aria-label="Fee defaulters"
          removeWrapper
          classNames={{
            th: "bg-gray-50 text-gray-500 font-medium text-xs uppercase tracking-wider h-11 border-b border-gray-200",
            td: "py-4 border-b border-gray-100",
          }}
        >
          <TableHeader>
            <TableColumn>STUDENT</TableColumn>
            <TableColumn>PENDING</TableColumn>
            <TableColumn>DUE DATE</TableColumn>
            <TableColumn>OVERDUE</TableColumn>
            <TableColumn align="end">ACTIONS</TableColumn>
          </TableHeader>
          <TableBody emptyContent={<div className="text-center py-8"><p className="text-gray-400 text-sm">No defaulters found</p></div>}>
            {visibleDefaulters.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">{item.student?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 hover:text-gray-600 cursor-pointer" onClick={() => navigate(`/students/${item.id}`)}>
                        {item.student}
                      </p>
                      <p className="text-xs text-gray-500">Class {item.class}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono text-gray-900">₹{item.pending?.toLocaleString() || 0}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{item.dueDate || '—'}</span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border border-gray-200 rounded bg-gray-50">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      item.days >= 30 ? "bg-gray-400" :
                      item.days >= 15 ? "bg-gray-400" :
                      "bg-gray-300"
                    }`}></span>
                    {item.days} days
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleCollectFee(item)} className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 border border-gray-900 rounded-lg hover:bg-gray-800 transition-all">
                      Collect
                    </button>
                    <button onClick={() => handleSendReminder(item)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all">
                      <Bell size={14} />
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
          {!hasMore && filteredDefaulters.length > ITEMS_PER_LOAD && (
            <span className="text-gray-400 text-xs">All defaulters loaded</span>
          )}
        </div>
      </div>
    </div>
  );
}
