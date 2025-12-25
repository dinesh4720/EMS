import { useState, useMemo, useEffect, useRef } from "react";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Button, Progress, Spinner,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { Eye, MessageSquare, Search, Filter, ArrowUpDown, X, MoreVertical } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Link } from "react-router-dom";

const ITEMS_PER_LOAD = 10;

export default function ClassesList() {
  const navigate = useNavigate();
  const { classesWithTeachers: classesData, feeDefaulters } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef(null);
  const [sortDescriptor, setSortDescriptor] = useState({ column: "name", direction: "ascending" });
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));

  const [columnWidths] = useState({
    class: 150,
    teacher: 200,
    strength: 120,
    attendance: 150,
    status: 140,
    actions: 80
  });

  const filteredData = useMemo(() => {
    let filtered = [...classesData];

    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter((cls) =>
        cls.name.toLowerCase().includes(search) ||
        cls.section.toLowerCase().includes(search) ||
        (cls.teacher && cls.teacher.toLowerCase().includes(search))
      );
    }

    return filtered.sort((a, b) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [classesData, searchQuery, sortDescriptor]);

  const visibleItems = useMemo(() => {
    return filteredData.slice(0, visibleCount);
  }, [filteredData, visibleCount]);

  const hasMore = visibleCount < filteredData.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [searchQuery, sortDescriptor]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setIsLoading(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + ITEMS_PER_LOAD);
            setIsLoading(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  return (
    <div className="w-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6">
        {/* Left Side - Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
            <Search size={16} className="text-default-400" />
            <input
              type="text"
              placeholder="Search classes..."
              className="flex-1 bg-transparent outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-default-200 rounded cursor-pointer">
                <X size={14} className="text-default-400" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side - Filters */}
        <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <Dropdown>
            <DropdownTrigger>
              <button className="p-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer">
                <Filter size={16} className="text-default-400" />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Filter options">
              <DropdownItem key="all">All Classes</DropdownItem>
              <DropdownItem key="primary">Primary (1-5)</DropdownItem>
              <DropdownItem key="middle">Middle (6-8)</DropdownItem>
              <DropdownItem key="secondary">Secondary (9-12)</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger>
              <button className="p-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer">
                <ArrowUpDown size={16} className="text-default-400" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Sort options"
              disallowEmptySelection
              selectionMode="single"
              selectedKeys={new Set([sortDescriptor.column])}
              onSelectionChange={(keys) => setSortDescriptor({ column: Array.from(keys)[0], direction: sortDescriptor.direction })}
            >
              <DropdownItem key="name">Class Name</DropdownItem>
              <DropdownItem key="teacher">Teacher</DropdownItem>
              <DropdownItem key="strength">Strength</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Table */}
      <Table
        aria-label="Classes list"
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        removeWrapper
        radius="none"
        classNames={{
          base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0",
          thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12",
          th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors cursor-pointer [&_svg]:text-default-300 [&:hover_svg]:text-default-500 [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default",
          td: "py-5 border-b border-default-200 group-data-[last=true]:border-none last:pr-6",
          tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-5",
          tr: "",
        }}
      >
        <TableHeader>
          <TableColumn key="name" allowsSorting style={{ width: columnWidths.class }}>CLASS DETAILS</TableColumn>
          <TableColumn key="teacher" allowsSorting style={{ width: columnWidths.teacher }}>CLASS TEACHER</TableColumn>
          <TableColumn key="strength" allowsSorting style={{ width: columnWidths.strength }}>STRENGTH</TableColumn>
          <TableColumn style={{ width: columnWidths.attendance }}>ATTENDANCE</TableColumn>
          <TableColumn style={{ width: columnWidths.status }}>FEE STATUS</TableColumn>
          <TableColumn align="end" style={{ width: columnWidths.actions }}>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody items={visibleItems} emptyContent="No classes found">
          {(cls) => {
            const classKey = `${cls.name}-${cls.section}`;
            const pendingCount = feeDefaulters.filter(s => s.class === classKey).length;
            const attendance = cls.attendance || 85;

            return (
              <TableRow key={cls.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">{cls.name}{cls.section}</span>
                    </div>
                    <div className="flex flex-col">
                      <Link
                        to={`/classes/${cls.id}`}
                        className="text-default-900 font-medium text-base hover:text-primary transition-colors cursor-pointer"
                      >
                        Class {cls.name}
                      </Link>
                      <span className="text-default-500 text-xs">Section {cls.section}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://i.pravatar.cc/150?u=${cls.id}`}
                      alt={cls.teacher || "Teacher"}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex flex-col">
                      {cls.classTeacherId ? (
                        <Link
                          to={`/staffs/${cls.classTeacherId}`}
                          className="text-default-900 font-medium text-sm hover:text-primary transition-colors cursor-pointer"
                        >
                          {cls.teacher || "Unassigned"}
                        </Link>
                      ) : (
                        <span className="text-default-500 text-sm">Unassigned</span>
                      )}
                      <span className="text-default-500 text-xs">Class Teacher</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-default-900 font-semibold text-lg">{cls.studentCount || cls.strength}</span>
                    <span className="text-default-500 text-xs">Students</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={attendance}
                      size="sm"
                      className="max-w-[100px]"
                      classNames={{
                        indicator: attendance >= 90
                          ? "bg-emerald-300"
                          : attendance >= 75
                            ? "bg-amber-300"
                            : "bg-rose-300",
                        track: "bg-default-100"
                      }}
                    />
                    <span className="text-xs font-semibold text-default-700 min-w-[32px]">{attendance}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-medium ${
                    pendingCount > 5
                      ? "bg-danger-50 border-danger-200 text-danger-700"
                      : pendingCount > 0
                        ? "bg-warning-50 border-warning-200 text-warning-700"
                        : "bg-success-50 border-success-200 text-success-700"
                  }`}>
                    {pendingCount > 0 ? `${pendingCount} Defaulters` : "All Clear"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light" className="text-default-400">
                          <MoreVertical size={18} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Class actions">
                        <DropdownItem
                          key="view"
                          startContent={<Eye size={14} />}
                          onPress={() => navigate(`/classes/${cls.id}`)}
                        >
                          View Details
                        </DropdownItem>
                        <DropdownItem
                          key="message"
                          startContent={<MessageSquare size={14} />}
                        >
                          Send Message
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </TableCell>
              </TableRow>
            );
          }}
        </TableBody>
      </Table>

      {/* Lazy Loading Indicator */}
      <div ref={loaderRef} className="flex justify-center py-4">
        {isLoading && <Spinner size="sm" color="primary" />}
        {!hasMore && filteredData.length > ITEMS_PER_LOAD && (
          <span className="text-default-400 text-sm">All {filteredData.length} classes loaded</span>
        )}
      </div>
    </div>
  );
}
