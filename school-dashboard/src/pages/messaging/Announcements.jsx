import { useState, useEffect, useRef, useMemo } from "react";
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
  Switch,
  Spinner,
} from "@heroui/react";
import { Send, Clock, Eye, Search, X, Filter } from "lucide-react";
import { announcements } from "../../data/mockData";

export default function Announcements({ isDrawerOpen, setIsDrawerOpen }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    target: "",
    channel: "app",
    schedule: false,
    scheduleDate: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  // Lazy loading state
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  const visibleAnnouncements = useMemo(
    () => filteredAnnouncements.slice(0, visibleCount),
    [filteredAnnouncements, visibleCount]
  );

  const hasMore = visibleCount < filteredAnnouncements.length;

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
              placeholder="Search announcements..."
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
            <SelectItem key="sent">Sent</SelectItem>
            <SelectItem key="scheduled">Scheduled</SelectItem>
          </Select>
        </div>
      </div>

      <Table
        aria-label="Announcements"
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
          <TableColumn>TITLE & CONTENT</TableColumn>
          <TableColumn>TARGET & CHANNEL</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn align="end">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            <div className="text-center py-8">
              <p className="text-default-400 text-sm">No announcements found</p>
            </div>
          }
        >
          {visibleAnnouncements.map((item) => (
            <TableRow key={item.id} className="hover:bg-default-50 transition-colors">
              <TableCell width="40%">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-default-900 text-sm">{item.title}</span>
                  <span className="text-xs text-default-500 truncate max-w-[300px]">
                    {item.content}
                  </span>
                  <span className="text-[10px] text-default-400 mt-1 flex items-center gap-1">
                    <Clock size={10} /> {item.date}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5">
                  <Chip
                    size="sm"
                    variant="flat"
                    color="primary"
                    classNames={{
                      base: "h-6",
                      content: "text-xs font-medium",
                    }}
                  >
                    {item.target}
                  </Chip>
                  <span className="text-xs text-default-500">Via: {item.channel}</span>
                </div>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={item.status === "sent" ? "success" : "warning"}
                  variant="dot"
                  classNames={{
                    base: "h-6 border border-default-200",
                    content: "text-xs font-medium",
                  }}
                >
                  {item.status.toUpperCase()}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <button
                    className="p-2 bg-transparent rounded-lg border border-transparent hover:border-primary hover:bg-primary-50 transition-all duration-200 cursor-pointer text-default-400 hover:text-primary"
                    title="View Details"
                  >
                    <Eye size={16} />
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
        {!hasMore && filteredAnnouncements.length > ITEMS_PER_LOAD && (
          <span className="text-default-400 text-sm">
            All {filteredAnnouncements.length} announcements loaded
          </span>
        )}
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        placement="right"
        size="md"
        radius="none"
        classNames={{ wrapper: "justify-end" }}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="border-b border-default-200">
                <h3 className="text-lg font-semibold text-default-900">Create Announcement</h3>
              </DrawerHeader>
              <DrawerBody className="py-4">
                <div className="space-y-4">
                  <Input
                    size="sm"
                    label="Title"
                    variant="bordered"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                  <Textarea
                    size="sm"
                    label="Content"
                    variant="bordered"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                  <Select
                    size="sm"
                    label="Target Audience"
                    variant="bordered"
                    selectedKeys={formData.target ? [formData.target] : []}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  >
                    <SelectItem key="all">All (School-wide)</SelectItem>
                    <SelectItem key="parents">All Parents</SelectItem>
                    <SelectItem key="staff">All Staff</SelectItem>
                    <SelectItem key="class">Specific Class</SelectItem>
                  </Select>
                  <Select
                    size="sm"
                    label="Channel"
                    variant="bordered"
                    selectedKeys={[formData.channel]}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  >
                    <SelectItem key="app">In-App Only</SelectItem>
                    <SelectItem key="sms">SMS</SelectItem>
                    <SelectItem key="email">Email</SelectItem>
                    <SelectItem key="all">SMS + Email + App</SelectItem>
                  </Select>
                  <div className="flex items-center gap-4">
                    <Switch
                      size="sm"
                      isSelected={formData.schedule}
                      onValueChange={(v) => setFormData({ ...formData, schedule: v })}
                    >
                      Schedule for later
                    </Switch>
                    {formData.schedule && (
                      <Input
                        type="datetime-local"
                        size="sm"
                        variant="bordered"
                        className="max-w-[200px]"
                        value={formData.scheduleDate}
                        onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                      />
                    )}
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter className="border-t border-default-200">
                <button
                  onClick={onClose}
                  className="px-3 py-2 bg-transparent text-default-600 rounded-lg border border-default-300 hover:bg-default-100 transition-all duration-200 text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 text-sm cursor-pointer"
                >
                  {formData.schedule ? <Clock size={14} /> : <Send size={14} />}
                  <span>{formData.schedule ? "Schedule" : "Send Now"}</span>
                </button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
