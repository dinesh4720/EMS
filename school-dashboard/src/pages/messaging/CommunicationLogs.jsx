import { useState, useMemo, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
  SelectItem,
  User,
  Spinner,
} from "@heroui/react";
import { Search, X } from "lucide-react";
import { communicationLogs } from "../../data/mockData";

export default function CommunicationLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredLogs = useMemo(() => {
    return communicationLogs.filter((log) => {
      const matchSearch =
        log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.student.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === "all" || log.type.toLowerCase() === filterType;
      const matchStatus = filterStatus === "all" || log.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [searchQuery, filterType, filterStatus]);

  // Lazy loading state
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  const visibleLogs = useMemo(
    () => filteredLogs.slice(0, visibleCount),
    [filteredLogs, visibleCount]
  );

  const hasMore = visibleCount < filteredLogs.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [searchQuery, filterType, filterStatus]);

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

  return (
    <div className="w-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
            <Search size={16} className="text-default-400" />
            <input
              type="text"
              placeholder="Search recipient..."
              className="flex-1 bg-transparent outline-none text-sm"
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
          {/* Filter by Type */}
          <Select
            size="sm"
            placeholder="All Types"
            selectedKeys={new Set([filterType])}
            onSelectionChange={(keys) => setFilterType(Array.from(keys)[0])}
            className="w-full sm:w-[140px]"
            classNames={{
              trigger:
                "h-9 min-h-9 bg-transparent border-default-300 hover:border-primary transition-all duration-200",
              value: "text-sm",
            }}
          >
            <SelectItem key="all">All Types</SelectItem>
            <SelectItem key="sms">SMS</SelectItem>
            <SelectItem key="email">Email</SelectItem>
          </Select>

          {/* Filter by Status */}
          <Select
            size="sm"
            placeholder="All Status"
            selectedKeys={new Set([filterStatus])}
            onSelectionChange={(keys) => setFilterStatus(Array.from(keys)[0])}
            className="w-full sm:w-[140px]"
            classNames={{
              trigger:
                "h-9 min-h-9 bg-transparent border-default-300 hover:border-primary transition-all duration-200",
              value: "text-sm",
            }}
          >
            <SelectItem key="all">All Status</SelectItem>
            <SelectItem key="delivered">Delivered</SelectItem>
            <SelectItem key="failed">Failed</SelectItem>
          </Select>
        </div>
      </div>

      <Table
        aria-label="Communication logs"
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
          <TableColumn>RECIPIENT</TableColumn>
          <TableColumn>TYPE</TableColumn>
          <TableColumn>MESSAGE</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>DATE</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            <div className="text-center py-8">
              <p className="text-default-400 text-sm">No communication logs found</p>
            </div>
          }
        >
          {visibleLogs.map((log) => (
            <TableRow key={log.id} className="hover:bg-default-50 transition-colors">
              <TableCell>
                <User
                  avatarProps={{
                    radius: "full",
                    size: "sm",
                    src: `https://i.pravatar.cc/150?u=${log.id}`,
                  }}
                  description={<span className="text-xs text-default-500">{log.student}</span>}
                  name={<span className="text-sm font-medium text-default-900">{log.recipient}</span>}
                />
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  color={log.type === "SMS" ? "primary" : "secondary"}
                  classNames={{
                    base: "h-6",
                    content: "text-xs font-medium uppercase",
                  }}
                >
                  {log.type}
                </Chip>
              </TableCell>
              <TableCell>
                <span className="text-sm text-default-700 truncate max-w-[300px] block">
                  {log.message}
                </span>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={log.status === "delivered" ? "success" : "danger"}
                  variant="dot"
                  classNames={{
                    base: "h-6 border border-default-200",
                    content: "text-xs font-medium capitalize",
                  }}
                >
                  {log.status}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-xs text-default-600">{log.date.split(" ")[0]}</span>
                  <span className="text-[10px] text-default-400">{log.date.split(" ")[1]}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Lazy loading indicator */}
      <div ref={loaderRef} className="flex justify-center py-4 -mx-6">
        {isLoadingMore && <Spinner size="sm" color="primary" />}
        {!hasMore && filteredLogs.length > ITEMS_PER_LOAD && (
          <span className="text-default-400 text-sm">All {filteredLogs.length} logs loaded</span>
        )}
      </div>
    </div>
  );
}
