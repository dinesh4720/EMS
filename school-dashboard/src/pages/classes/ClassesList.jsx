import { useState, useMemo, useEffect, useRef } from "react";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Button, Progress, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Checkbox
} from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { Eye, MessageSquare, Search, Filter, ArrowUpDown, X, MoreVertical, Settings, UserPlus, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Link } from "react-router-dom";

const ITEMS_PER_LOAD = 10;

// Available columns configuration
const AVAILABLE_COLUMNS = [
  { key: 'class', label: 'CLASS DETAILS', width: 180, visible: true, fixed: true },
  { key: 'teacher', label: 'CLASS TEACHER', width: 200, visible: true },
  { key: 'subjects', label: 'SUBJECTS', width: 100, visible: true },
  { key: 'strength', label: 'STRENGTH', width: 120, visible: true },
  { key: 'academic', label: 'ACADEMIC PERFORMANCE', width: 160, visible: true },
  { key: 'attendance', label: 'ATTENDANCE', width: 150, visible: true },
  { key: 'status', label: 'FEE STATUS', width: 140, visible: true },
  { key: 'actions', label: 'ACTIONS', width: 80, visible: true, fixed: true },
];

export default function ClassesList() {
  const navigate = useNavigate();
  const { classesWithTeachers: classesData, feeDefaulters, classesEnhancedApi, classesApi } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef(null);
  const [sortDescriptor, setSortDescriptor] = useState({ column: "name", direction: "ascending" });
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));

  // Expanded classes state
  const [expandedClasses, setExpandedClasses] = useState(new Set([]));

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('classes_columns');
    return saved ? JSON.parse(saved) : AVAILABLE_COLUMNS;
  });
  const [showColumnModal, setShowColumnModal] = useState(false);

  // Academic performance data state
  const [academicPerformance, setAcademicPerformance] = useState({});

  // Class settings data state (for tags)
  const [classSettingsMap, setClassSettingsMap] = useState({});

  // Assign teacher modal state
  const [assignTeacherModal, setAssignTeacherModal] = useState(false);
  const [selectedClassForTeacher, setSelectedClassForTeacher] = useState(null);

  // Actions modal state
  const [actionsModal, setActionsModal] = useState(false);
  const [selectedClassForActions, setSelectedClassForActions] = useState(null);

  // Extract class number from name
  const extractClassNum = (name) => {
    const match = name?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Group classes by class number
  const groupedClasses = useMemo(() => {
    const groups = {};

    classesData.forEach((cls) => {
      const classNum = extractClassNum(cls.name);
      if (!groups[classNum]) {
        groups[classNum] = {
          classNum,
          className: cls.name,
          sections: [],
          totalStudents: 0,
          totalPendingFees: 0,
          averageAttendance: 0,
          averageAcademic: 0,
        };
      }
      groups[classNum].sections.push(cls);

      // Aggregate data
      groups[classNum].totalStudents += cls.studentCount || cls.strength || 0;

      const classKey = `${cls.name}-${cls.section}`;
      const pendingCount = feeDefaulters.filter(s => s.class === classKey).length;
      groups[classNum].totalPendingFees += pendingCount;

      // For average calculations, we'll collect values
      const attendance = cls.averageAttendance || cls.attendance || 85;
      const academic = cls.averageAcademicPerformance || 0;
      groups[classNum].averageAttendance = (groups[classNum].averageAttendance || 0) + attendance;
      groups[classNum].averageAcademic = (groups[classNum].averageAcademic || 0) + academic;
    });

    // Calculate averages
    Object.values(groups).forEach(group => {
      const sectionCount = group.sections.length;
      group.averageAttendance = sectionCount > 0 ? Math.round(group.averageAttendance / sectionCount) : 0;
      group.averageAcademic = sectionCount > 0 ? Math.round(group.averageAcademic / sectionCount) : 0;
    });

    return Object.values(groups).sort((a, b) => a.classNum - b.classNum);
  }, [classesData, feeDefaulters]);

  // Filter grouped classes
  const filteredGroupedClasses = useMemo(() => {
    if (!searchQuery) return groupedClasses;

    const search = searchQuery.toLowerCase();
    const keywords = search.split(' ').filter(k => k.length > 0);

    return groupedClasses.filter((group) => {
      // Check if any section in this group matches the search
      return group.sections.some((cls) => {
        const searchableText = [
          cls.name,
          cls.section,
          cls.teacher || '',
          `${cls.name} ${cls.section}`,
          `${cls.name}${cls.section}`
        ].join(' ').toLowerCase();

        return keywords.every(keyword => searchableText.includes(keyword));
      });
    });
  }, [groupedClasses, searchQuery]);

  // Flatten for display - include parent rows and expanded children
  const visibleItems = useMemo(() => {
    const items = [];
    let count = 0;

    for (const group of filteredGroupedClasses) {
      if (count >= visibleCount) break;

      // Add parent row
      items.push({ type: 'parent', data: group });
      count++;

      // Add child rows if expanded
      if (expandedClasses.has(group.classNum)) {
        for (const section of group.sections) {
          if (count >= visibleCount) break;
          items.push({ type: 'child', data: section });
          count++;
        }
      }
    }

    return items;
  }, [filteredGroupedClasses, expandedClasses, visibleCount]);

  const hasMore = visibleItems.length < filteredGroupedClasses.length +
    Array.from(expandedClasses).reduce((sum, classNum) => {
      const group = groupedClasses.find(g => g.classNum === classNum);
      return sum + (group ? group.sections.length : 0);
    }, 0);

  // Toggle class expansion
  const toggleClassExpansion = (classNum) => {
    setExpandedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classNum)) {
        newSet.delete(classNum);
      } else {
        newSet.add(classNum);
      }
      return newSet;
    });
  };

  // Load academic performance data with batching
  useEffect(() => {
    const loadAcademicPerformance = async () => {
      if (classesData.length === 0) return;
      
      try {
        // Process in batches of 3 with 300ms delay between batches
        const batchSize = 3;
        const delayBetweenBatches = 300;
        
        for (let i = 0; i < classesData.length; i += batchSize) {
          const batch = classesData.slice(i, i + batchSize);
          
          const batchPromises = batch.map(async (cls) => {
            try {
              const data = await classesEnhancedApi.getAcademicPerformance(cls.id);
              return { [cls.id]: data };
            } catch (error) {
              console.error(`Error loading academic performance for class ${cls.id}:`, error);
              return { [cls.id]: { classAverage: cls.averageAcademicPerformance || 0 } };
            }
          });

          const batchResults = await Promise.all(batchPromises);
          const batchMerged = batchResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
          
          // Update state with batch results
          setAcademicPerformance(prev => ({ ...prev, ...batchMerged }));
          
          // Add delay between batches (except for the last batch)
          if (i + batchSize < classesData.length) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
          }
        }
      } catch (error) {
        console.error('Error loading academic performance:', error);
      }
    };

    loadAcademicPerformance();
  }, [classesData, classesEnhancedApi]);

  // Load class settings data with batching
  useEffect(() => {
    const loadClassSettings = async () => {
      if (classesData.length === 0 || !classesApi) return;
      
      try {
        // Process in batches of 3 with 300ms delay between batches
        const batchSize = 3;
        const delayBetweenBatches = 300;
        
        for (let i = 0; i < classesData.length; i += batchSize) {
          const batch = classesData.slice(i, i + batchSize);
          
          const batchPromises = batch.map(async (cls) => {
            try {
              const settings = await classesApi.getSettings(cls.id);
              return { [cls.id]: settings };
            } catch (error) {
              console.error(`Error loading settings for class ${cls.id}:`, error);
              return { [cls.id]: null };
            }
          });

          const batchResults = await Promise.all(batchPromises);
          const batchMerged = batchResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
          
          // Update state with batch results
          setClassSettingsMap(prev => ({ ...prev, ...batchMerged }));
          
          // Add delay between batches (except for the last batch)
          if (i + batchSize < classesData.length) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
          }
        }
      } catch (error) {
        console.error('Error loading class settings:', error);
      }
    };

    loadClassSettings();
  }, [classesData, classesApi]);

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

  // Save column visibility to localStorage
  useEffect(() => {
    localStorage.setItem('classes_columns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Handle row click
  const handleRowClick = (item) => {
    if (item.type === 'child') {
      navigate(`/classes/${item.data.id}`);
    }
  };

  // Toggle column visibility
  const toggleColumn = (key) => {
    setVisibleColumns(prev =>
      prev.map(col =>
        col.fixed ? col : col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  // Get visible columns
  const getVisibleColumns = () => visibleColumns.filter(col => col.visible);

  // Handle assign teacher
  const handleAssignTeacher = (cls) => {
    setSelectedClassForTeacher(cls);
    setAssignTeacherModal(true);
  };

  // Handle class actions
  const handleClassActions = (cls, e) => {
    e.stopPropagation();
    setSelectedClassForActions(cls);
    setActionsModal(true);
  };

  // Handle action menu item click
  const handleActionMenuItem = (action, cls) => {
    setActionsModal(false);
    switch (action) {
      case 'view':
        navigate(`/classes/${cls.id}`);
        break;
      case 'settings':
        navigate(`/classes/${cls.id}?tab=settings`);
        break;
      case 'promote':
        navigate(`/classes/${cls.id}/promote`);
        break;
      case 'adjust-strength':
        navigate(`/classes/${cls.id}/strength`);
        break;
      case 'download-report':
        // Implement download report
        break;
      case 'send-announcement':
        navigate(`/classes/${cls.id}/announce`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6">
        {/* Left Side - Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:max-w-[350px] px-3 py-2 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
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
          <button
            onClick={() => setShowColumnModal(true)}
            className="p-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer"
            title="Edit Columns"
          >
            <Settings size={16} className="text-default-400" />
          </button>
        </div>
      </div>

      {/* Table */}
      <Table
        aria-label="Classes list"
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        removeWrapper
        radius="none"
        classNames={{
          base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0",
          thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12",
          th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors cursor-pointer [&_svg]:text-default-300 [&:hover_svg]:text-default-500 [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default",
          td: "py-0 border-b border-default-200 group-data-[last=true]:border-none last:pr-6",
          tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-0",
          tr: "",
        }}
      >
        <TableHeader>
          {getVisibleColumns().map(col => (
            <TableColumn
              key={col.key}
              allowsSorting={col.key !== 'actions'}
              style={{ width: col.width }}
            >
              {col.label}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody items={visibleItems} emptyContent="No classes found">
          {(item) => {
            if (item.type === 'parent') {
              const group = item.data;
              const isExpanded = expandedClasses.has(group.classNum);
              const pendingCount = group.totalPendingFees;

              return (
                <TableRow
                  key={`parent-${group.classNum}`}
                  className="hover:bg-default-50 cursor-pointer"
                  onClick={() => toggleClassExpansion(group.classNum)}
                >
                  {/* Class Details - Parent */}
                  <TableCell>
                    <div className="flex items-center gap-3 py-5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleClassExpansion(group.classNum);
                        }}
                        className="p-1 hover:bg-default-200 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-default-500" />
                        ) : (
                          <ChevronRight size={16} className="text-default-500" />
                        )}
                      </button>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">{group.classNum}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-default-900 font-semibold text-base">
                          Class {group.classNum}
                        </span>
                        <span className="text-default-500 text-xs">
                          {group.sections.length} section{group.sections.length > 1 ? 's' : ''} • {group.totalStudents} students
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Class Teacher - Parent */}
                  {visibleColumns.find(c => c.key === 'teacher')?.visible && (
                    <TableCell>
                      <div className="flex items-center gap-2 py-5">
                        {group.sections.length > 0 && group.sections[0]?.teacher ? (
                          <>
                            <span className="text-default-600 text-sm">
                              {group.sections[0].teacher}
                            </span>
                            {group.sections.length > 1 && (
                              <span className="text-default-400 text-xs">
                                +{group.sections.length - 1} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-default-400 text-sm">Unassigned</span>
                        )}
                      </div>
                    </TableCell>
                  )}

                  {/* Subjects - Parent */}
                  {visibleColumns.find(c => c.key === 'subjects')?.visible && (
                    <TableCell>
                      <div className="py-5">
                        <span className="text-default-600 text-sm">
                          {group.sections[0]?.subjects?.length || 0}
                        </span>
                      </div>
                    </TableCell>
                  )}

                  {/* Strength - Parent */}
                  {visibleColumns.find(c => c.key === 'strength')?.visible && (
                    <TableCell>
                      <div className="py-5">
                        <span className="text-default-900 font-semibold text-lg">{group.totalStudents}</span>
                        <span className="text-default-500 text-xs"> students</span>
                      </div>
                    </TableCell>
                  )}

                  {/* Academic Performance - Parent */}
                  {visibleColumns.find(c => c.key === 'academic')?.visible && (
                    <TableCell>
                      <div className="flex items-center gap-2 py-5">
                        <Progress
                          aria-label="Academic performance"
                          value={group.averageAcademic}
                          size="sm"
                          className="max-w-[100px]"
                          color={group.averageAcademic >= 80 ? "success" : group.averageAcademic >= 60 ? "warning" : "danger"}
                          classNames={{
                            indicator: group.averageAcademic >= 80
                              ? "bg-success-300"
                              : group.averageAcademic >= 60
                                ? "bg-warning-300"
                                : "bg-danger-300",
                            track: "bg-default-100"
                          }}
                        />
                        <span className="text-xs font-semibold text-default-700 min-w-[32px]">{group.averageAcademic}%</span>
                      </div>
                    </TableCell>
                  )}

                  {/* Attendance - Parent */}
                  {visibleColumns.find(c => c.key === 'attendance')?.visible && (
                    <TableCell>
                      <div className="flex items-center gap-2 py-5">
                        <Progress
                          aria-label="Attendance"
                          value={group.averageAttendance}
                          size="sm"
                          className="max-w-[100px]"
                          classNames={{
                            indicator: group.averageAttendance >= 90
                              ? "bg-emerald-300"
                              : group.averageAttendance >= 75
                                ? "bg-amber-300"
                                : "bg-rose-300",
                            track: "bg-default-100"
                          }}
                        />
                        <span className="text-xs font-semibold text-default-700 min-w-[32px]">{group.averageAttendance}%</span>
                      </div>
                    </TableCell>
                  )}

                  {/* Fee Status - Parent */}
                  {visibleColumns.find(c => c.key === 'status')?.visible && (
                    <TableCell>
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-medium ${
                        pendingCount > 5
                          ? "bg-danger-50 border-danger-200 text-danger-700"
                          : pendingCount > 0
                            ? "bg-warning-50 border-warning-200 text-warning-700"
                            : "bg-success-50 border-success-200 text-success-700"
                      }`}>
                        {pendingCount > 0 ? `${pendingCount} Pending` : "All Clear"}
                      </div>
                    </TableCell>
                  )}

                  {/* Actions - Parent */}
                  <TableCell>
                    <div className="flex justify-end py-5">
                      <button
                        className="p-2 hover:bg-default-100 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleClassExpansion(group.classNum);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp size={18} className="text-default-500" />
                        ) : (
                          <ChevronDown size={18} className="text-default-500" />
                        )}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            } else {
              // Child row - individual section
              const cls = item.data;
              const classKey = `${cls.name}-${cls.section}`;
              const pendingCount = feeDefaulters.filter(s => s.class === classKey).length;
              const attendance = cls.averageAttendance || cls.attendance || 85;
              const academicData = academicPerformance[cls.id] || {};
              const academicAverage = academicData.classAverage || cls.averageAcademicPerformance || 0;
              const classSettings = classSettingsMap[cls.id];

              return (
                <TableRow
                  key={cls.id}
                  className="cursor-pointer hover:bg-default-50 bg-default-50/50"
                  onClick={() => handleRowClick(item)}
                >
                  {/* Class Details - Child */}
                  <TableCell>
                    <div className="flex items-center gap-3 py-3 pl-8">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center ml-6">
                        <span className="text-secondary font-semibold text-xs">{cls.section}</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/classes/${cls.id}`}
                            className="text-default-700 font-medium text-sm hover:text-primary transition-colors cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Section {cls.section}
                          </Link>
                          {classSettings?.classTag && (
                            <Chip size="sm" variant="flat" color="primary" className="text-xs">
                              {classSettings.classTag}
                            </Chip>
                          )}
                        </div>
                        <span className="text-default-500 text-xs">
                          {cls.studentCount || cls.strength || 0} students
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Class Teacher - Child */}
                  {visibleColumns.find(c => c.key === 'teacher')?.visible && (
                    <TableCell>
                      <div className="flex items-center gap-3 py-3">
                        <img
                          src={`https://i.pravatar.cc/150?u=${cls.id}`}
                          alt={cls.teacher || "Teacher"}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex flex-col">
                          {cls.classTeacherId ? (
                            <Link
                              to={`/staffs/${cls.classTeacherId}`}
                              className="text-default-700 font-medium text-sm hover:text-primary transition-colors cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {cls.teacher || "Unassigned"}
                            </Link>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAssignTeacher(cls); }}
                              className="text-primary font-medium text-xs hover:underline flex items-center gap-1"
                            >
                              <UserPlus size={10} />
                              Assign
                            </button>
                          )}
                          <span className="text-default-500 text-xs">Class Teacher</span>
                        </div>
                      </div>
                    </TableCell>
                  )}

                  {/* Subjects - Child */}
                  {visibleColumns.find(c => c.key === 'subjects')?.visible && (
                    <TableCell>
                      <div className="py-3">
                        <span className="text-default-700 text-sm">{cls.subjects?.length || 0}</span>
                      </div>
                    </TableCell>
                  )}

                  {/* Strength - Child */}
                  {visibleColumns.find(c => c.key === 'strength')?.visible && (
                    <TableCell>
                      <div className="py-3">
                        <span className="text-default-700 font-semibold text-base">{cls.studentCount || cls.strength || 0}</span>
                        <span className="text-default-500 text-xs">
                          {cls.strengthLimit?.current ? `/${cls.strengthLimit.current}` : ''}
                        </span>
                      </div>
                    </TableCell>
                  )}

                  {/* Academic Performance - Child */}
                  {visibleColumns.find(c => c.key === 'academic')?.visible && (
                    <TableCell>
                      <div className="flex items-center gap-2 py-3">
                        <Progress
                          aria-label="Academic performance"
                          value={academicAverage}
                          size="sm"
                          className="max-w-[100px]"
                          color={academicAverage >= 80 ? "success" : academicAverage >= 60 ? "warning" : "danger"}
                          classNames={{
                            indicator: academicAverage >= 80
                              ? "bg-success-300"
                              : academicAverage >= 60
                                ? "bg-warning-300"
                                : "bg-danger-300",
                            track: "bg-default-100"
                          }}
                        />
                        <span className="text-xs font-semibold text-default-700 min-w-[32px]">{academicAverage}%</span>
                      </div>
                    </TableCell>
                  )}

                  {/* Attendance - Child */}
                  {visibleColumns.find(c => c.key === 'attendance')?.visible && (
                    <TableCell>
                      <div className="flex items-center gap-2 py-3">
                        <Progress
                          aria-label="Attendance"
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
                  )}

                  {/* Fee Status - Child */}
                  {visibleColumns.find(c => c.key === 'status')?.visible && (
                    <TableCell>
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-medium ${
                        pendingCount > 2
                          ? "bg-danger-50 border-danger-200 text-danger-700"
                          : pendingCount > 0
                            ? "bg-warning-50 border-warning-200 text-warning-700"
                            : "bg-success-50 border-success-200 text-success-700"
                      }`}>
                        {pendingCount > 0 ? `${pendingCount}` : "0"}
                      </div>
                    </TableCell>
                  )}

                  {/* Actions - Child */}
                  <TableCell>
                    <div className="flex justify-end py-3" onClick={(e) => e.stopPropagation()}>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light" className="text-default-400">
                            <MoreVertical size={18} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Class actions" onAction={(key) => handleActionMenuItem(key, cls)}>
                          <DropdownItem
                            key="view"
                            startContent={<Eye size={14} />}
                          >
                            View Details
                          </DropdownItem>
                          <DropdownItem
                            key="settings"
                            startContent={<Settings size={14} />}
                          >
                            Class Settings
                          </DropdownItem>
                          <DropdownItem
                            key="promote"
                            startContent={"📈"}
                          >
                            Promote Class
                          </DropdownItem>
                          <DropdownItem
                            key="adjust-strength"
                            startContent={"👥"}
                          >
                            Adjust Strength Limit
                          </DropdownItem>
                          <DropdownItem
                            key="download-report"
                            startContent={"📥"}
                          >
                            Download Report
                          </DropdownItem>
                          <DropdownItem
                            key="send-announcement"
                            startContent={<MessageSquare size={14} />}
                          >
                            Send Announcement
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }
          }}
        </TableBody>
      </Table>

      {/* Lazy Loading Indicator */}
      <div ref={loaderRef} className="flex justify-center py-4">
        {isLoading && <Spinner size="sm" color="primary" />}
        {!hasMore && visibleItems.length > ITEMS_PER_LOAD && (
          <span className="text-default-400 text-sm">All classes loaded</span>
        )}
      </div>

      {/* Edit Columns Modal */}
      <Modal isOpen={showColumnModal} onClose={() => setShowColumnModal(false)} size="sm">
        <ModalContent>
          <ModalHeader>Edit Columns</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-2">
              {AVAILABLE_COLUMNS.map(col => (
                <Checkbox
                  key={col.key}
                  isSelected={col.visible}
                  isDisabled={col.fixed}
                  onValueChange={() => toggleColumn(col.key)}
                >
                  {col.label}
                </Checkbox>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={() => setShowColumnModal(false)}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Assign Teacher Modal - Placeholder for future implementation */}
      <Modal isOpen={assignTeacherModal} onClose={() => setAssignTeacherModal(false)} size="md">
        <ModalContent>
          <ModalHeader>Assign Class Teacher</ModalHeader>
          <ModalBody>
            <p>Assign class teacher for {selectedClassForTeacher?.name} - Section {selectedClassForTeacher?.section}</p>
            <p className="text-default-500 text-sm">This feature will be implemented in the next phase.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setAssignTeacherModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={() => setAssignTeacherModal(false)}>
              Assign
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
