import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Button, Progress, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Checkbox, Select, SelectItem
} from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { Eye, MessageSquare, Search, Filter, ArrowUpDown, X, MoreVertical, Settings, UserPlus, ChevronRight, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PhotoAvatar from "../../components/PhotoAvatar";
import ClassTeacherAssignmentModal from "./components/ClassTeacherAssignmentModal";


const ITEMS_PER_LOAD = 10;
const SEARCH_DEBOUNCE_MS = 300;

// Available columns configuration
const AVAILABLE_COLUMNS = [
  { key: 'class', label: 'CLASS DETAILS', width: 180, visible: true, fixed: true },
  { key: 'teacher', label: 'CLASS TEACHER', width: 200, visible: true },
  { key: 'subjects', label: 'SUBJECTS', width: 100, visible: true },
  { key: 'strength', label: 'STRENGTH', width: 120, visible: true },
  { key: 'academic', label: 'ACADEMIC PERFORMANCE', width: 160, visible: true },
  { key: 'attendance', label: 'AVG ATTENDANCE', width: 150, visible: true },
  { key: 'status', label: 'FEE STATUS', width: 140, visible: true },
  { key: 'actions', label: 'ACTIONS', width: 80, visible: true, fixed: true },
];

export default function ClassesList() {
  const navigate = useNavigate();
  const { classesWithTeachers: classesData, feeDefaulters, classesEnhancedApi, classesApi, staff, updateClassLocal, refetch } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
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

  // Attendance data state
  const [attendanceData, setAttendanceData] = useState({});

  // Class settings data state (for tags)
  const [classSettingsMap, setClassSettingsMap] = useState({});

  // Assign teacher modal state
  const [assignTeacherModal, setAssignTeacherModal] = useState(false);
  const [selectedClassForTeacher, setSelectedClassForTeacher] = useState(null);

  // Actions modal state
  const [actionsModal, setActionsModal] = useState(false);
  const [selectedClassForActions, setSelectedClassForActions] = useState(null);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Extract class number from name
  const extractClassNum = (name) => {
    const match = name?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Group classes by class number
  const groupedClasses = useMemo(() => {
    try {
      const groups = {};

      classesData.forEach((cls) => {
        // Skip null/undefined classes
        if (!cls || !cls.name) return;

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
        const pendingCount = feeDefaulters?.filter(s => s?.class === classKey)?.length || 0;
        groups[classNum].totalPendingFees += pendingCount;

        // For average calculations, we'll collect values - use real attendance data if available
        const attendance = cls.averageAttendance || cls.attendance || null;
        const academic = cls.averageAcademicPerformance || 0;
        groups[classNum].averageAttendance = (groups[classNum].averageAttendance || 0) + attendance;
        groups[classNum].averageAcademic = (groups[classNum].averageAcademic || 0) + academic;
      });

      // Calculate averages
      Object.values(groups).forEach(group => {
        const sectionCount = group.sections?.length || 0;
        group.averageAttendance = sectionCount > 0 ? Math.round((group.averageAttendance || 0) / sectionCount) : 0;
        group.averageAcademic = sectionCount > 0 ? Math.round((group.averageAcademic || 0) / sectionCount) : 0;
      });

      return Object.values(groups).sort((a, b) => a.classNum - b.classNum);
    } catch (error) {
      console.error('Error grouping classes:', error);
      return [];
    }
  }, [classesData, feeDefaulters]);

  // Filter grouped classes
  const filteredGroupedClasses = useMemo(() => {
    try {
      if (!debouncedSearchQuery) return groupedClasses || [];

      const search = debouncedSearchQuery.toLowerCase();
      const keywords = search.split(' ').filter(k => k.length > 0);

      return (groupedClasses || []).filter((group) => {
        if (!group || !group.sections) return false;

        // Check if any section in this group matches the search
        return group.sections.some((cls) => {
          if (!cls) return false;

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
    } catch (error) {
      console.error('Error filtering grouped classes:', error);
      return groupedClasses || [];
    }
  }, [groupedClasses, debouncedSearchQuery]);

  // Flatten for display - include parent rows and expanded children
  const visibleItems = useMemo(() => {
    try {
      const items = [];
      let count = 0;

      if (!filteredGroupedClasses || !Array.isArray(filteredGroupedClasses)) {
        console.warn('filteredGroupedClasses is not an array:', filteredGroupedClasses);
        return [];
      }

      for (const group of filteredGroupedClasses) {
        // Skip null/undefined groups
        if (!group || typeof group !== 'object') {
          console.warn('Skipping invalid group:', group);
          continue;
        }

        if (count >= visibleCount) break;

        // Add parent row with required 'type' property
        items.push({ type: 'parent', data: group });
        count++;

        // Add child rows if expanded
        if (expandedClasses.has(group.classNum) && group.sections && Array.isArray(group.sections)) {
          for (const section of group.sections) {
            // Skip null/undefined sections
            if (!section || typeof section !== 'object') {
              console.warn('Skipping invalid section:', section);
              continue;
            }

            if (count >= visibleCount) break;
            // Add child row with required 'type' property
            items.push({ type: 'child', data: section });
            count++;
          }
        }
      }

      console.log('Visible items generated:', items.length, 'items');
      return items;
    } catch (error) {
      console.error('Error in visibleItems useMemo:', error);
      return [];
    }
  }, [filteredGroupedClasses, expandedClasses, visibleCount]);

  const hasMore = useMemo(() => {
    try {
      if (!filteredGroupedClasses || !groupedClasses) return false;

      const totalItems = (filteredGroupedClasses.length || 0) +
        Array.from(expandedClasses).reduce((sum, classNum) => {
          const group = groupedClasses.find(g => g && g.classNum === classNum);
          return sum + (group?.sections?.length || 0);
        }, 0);

      return visibleItems.length < totalItems;
    } catch (error) {
      console.error('Error calculating hasMore:', error);
      return false;
    }
  }, [visibleItems.length, filteredGroupedClasses, groupedClasses, expandedClasses]);

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

  // Load academic performance and class settings data with batching (sequenced)
  useEffect(() => {
    const loadClassData = async () => {
      if (classesData.length === 0) return;

      try {
        // Process in batches of 2 with 500ms delay between batches to prevent rate limiting
        const batchSize = 2;
        const delayBetweenBatches = 500;

        // Load both academic performance and settings in coordinated batches
        for (let i = 0; i < classesData.length; i += batchSize) {
          const batch = classesData.slice(i, i + batchSize);

          // Load academic performance
          const academicPromises = batch.map(async (cls) => {
            try {
              const data = await classesEnhancedApi.getAcademicPerformance(cls.id);
              return { academic: { [cls.id]: data } };
            } catch (error) {
              console.error(`Error loading academic performance for class ${cls.id}:`, error);
              return { academic: { [cls.id]: { classAverage: cls.averageAcademicPerformance || 0 } } };
            }
          });

          // Load attendance analytics
          const attendancePromises = batch.map(async (cls) => {
            try {
              const data = await classesEnhancedApi.getAttendanceAnalytics(cls.id, 'month');
              return { attendance: { [cls.id]: data } };
            } catch (error) {
              console.error(`Error loading attendance analytics for class ${cls.id}:`, error);
              return { attendance: { [cls.id]: null } };
            }
          });

          // Load class settings
          const settingsPromises = batch.map(async (cls) => {
            try {
              const settings = await classesApi.getSettings(cls.id);
              return { settings: { [cls.id]: settings } };
            } catch (error) {
              console.error(`Error loading settings for class ${cls.id}:`, error);
              return { settings: { [cls.id]: null } };
            }
          });

          // Execute both batches in parallel within each batch group
          const [academicResults, settingsResults, attendanceResults] = await Promise.all([
            Promise.all(academicPromises),
            Promise.all(settingsPromises),
            Promise.all(attendancePromises)
          ]);

          const academicMerged = academicResults.reduce((acc, curr) => ({ ...acc, ...curr.academic }), {});
          const settingsMerged = settingsResults.reduce((acc, curr) => ({ ...acc, ...curr.settings }), {});
          const attendanceMerged = attendanceResults.reduce((acc, curr) => ({ ...acc, ...curr.attendance }), {});

          // Update state with batch results
          setAcademicPerformance(prev => ({ ...prev, ...academicMerged }));
          setClassSettingsMap(prev => ({ ...prev, ...settingsMerged }));
          setAttendanceData(prev => ({ ...prev, ...attendanceMerged }));

          // Add delay between batches (except for the last batch)
          if (i + batchSize < classesData.length) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
          }
        }
      } catch (error) {
        console.error('Error loading class data:', error);
      }
    };

    loadClassData();
  }, [classesData, classesEnhancedApi, classesApi]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [debouncedSearchQuery, sortDescriptor]);

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

  // Toggle column visibility - safely handle column state
  const toggleColumn = (key) => {
    setVisibleColumns(prev => {
      try {
        if (!prev || !Array.isArray(prev)) {
          return AVAILABLE_COLUMNS.map(col => ({ ...col }));
        }
        return prev.map(col => {
          if (!col) {
            const found = AVAILABLE_COLUMNS.find(c => c.key === key);
            return found || AVAILABLE_COLUMNS[0]; // Never return null
          }
          if (col.fixed) return col;
          if (col.key === key) return { ...col, visible: !col.visible };
          return col;
        }).filter(col => col != null); // Remove any null columns
      } catch (error) {
        console.error('Error toggling column:', error);
        return AVAILABLE_COLUMNS.map(col => ({ ...col }));
      }
    });
  };

  // Get visible columns - ensure we always return a valid array with no nulls
  const getVisibleColumns = () => {
    try {
      if (!visibleColumns || !Array.isArray(visibleColumns)) {
        return AVAILABLE_COLUMNS.filter(col => col && typeof col === 'object' && col.visible);
      }
      const filtered = visibleColumns.filter(col => col && typeof col === 'object' && col.visible && col.key);
      // Fallback to defaults if no valid columns
      return filtered.length > 0 ? filtered : AVAILABLE_COLUMNS.filter(col => col && typeof col === 'object' && col.visible);
    } catch (error) {
      console.error('Error getting visible columns:', error);
      return AVAILABLE_COLUMNS.filter(col => col && typeof col === 'object' && col.visible);
    }
  };

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
              type="search"
              name="class-search-query"
              placeholder="Search classes..."
              className="flex-1 bg-transparent outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              data-form-type="other"
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
        key={`table-${visibleColumns.map(c => c?.key).join('-')}`}
        aria-label="Classes list"
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        removeWrapper
        radius="none"
        classNames={{
          base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0 [&_table]:select-text",
          thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12",
          th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors cursor-pointer [&_svg]:text-default-300 [&:hover_svg]:text-default-500 [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default select-none",
          td: "py-0 border-b border-default-200 group-data-[last=true]:border-none last:pr-6 select-text",
          tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-0",
          tr: "",
        }}
      >
        <TableHeader>
          {getVisibleColumns()
            .filter(col => col && typeof col === 'object' && col.key && col.visible)
            .map((col) => (
              <TableColumn
                key={col.key}
                allowsSorting={col.key !== 'actions'}
                style={{ width: col.width }}
              >
                {col.label || ''}
              </TableColumn>
            ))
          }
        </TableHeader>
        <TableBody
          items={visibleItems.filter(item => item && item.type && item.data)}
          emptyContent="No classes found"
        >
          {(item) => {
            // Safety check - ensure item has type and data
            if (!item || !item.type || !item.data) {
              console.warn('Invalid item in TableBody:', item);
              return null;
            }

            if (item.type === 'parent') {
              const group = item.data;
              if (!group) {
                console.warn('Parent item has no data:', item);
                return null;
              }

              const isExpanded = expandedClasses.has(group?.classNum);
              const pendingCount = group?.totalPendingFees || 0;

              return (
                <TableRow
                  key={`parent-${group.classNum}`}
                  className="hover:bg-default-50 cursor-pointer"
                  onClick={(e) => {
                    // Don't toggle if clicking on interactive elements
                    if (e.target.closest("button") || e.target.closest("a")) return;

                    // Don't toggle if text is being selected
                    const selection = window.getSelection();
                    if (selection && selection.toString().length > 0) return;

                    toggleClassExpansion(group.classNum);
                  }}
                >
                  {/* Class Details - Parent */}
                  <TableCell>
                    <div className="flex items-center gap-3 py-5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (group?.classNum) toggleClassExpansion(group.classNum);
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
                        <span className="text-primary font-semibold text-sm">{group?.classNum || '-'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-default-900 font-semibold text-base">
                          Class {group?.classNum || '-'}
                        </span>
                        <span className="text-default-500 text-xs">
                          {group?.sections?.length || 0} section{(group?.sections?.length || 0) > 1 ? 's' : ''} • {group?.totalStudents || 0} students
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Class Teacher - Parent */}
                  {getVisibleColumns().find(c => c?.key === 'teacher')?.visible && (
                    <TableCell>
                      <div className="flex items-center gap-2 py-5">
                        {group?.sections?.length > 0 && group.sections[0]?.teacher ? (
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
                  {getVisibleColumns().find(c => c?.key === 'subjects')?.visible && (
                    <TableCell>
                      <div className="py-5">
                        <span className="text-default-600 text-sm">
                          {group?.sections?.[0]?.subjects?.length || 0}
                        </span>
                      </div>
                    </TableCell>
                  )}

                  {/* Strength - Parent */}
                  {getVisibleColumns().find(c => c?.key === 'strength')?.visible && (
                    <TableCell>
                      <div className="py-5">
                        <span className="text-default-900 font-semibold text-lg">{group?.totalStudents || 0}</span>
                        <span className="text-default-500 text-xs"> students</span>
                      </div>
                    </TableCell>
                  )}

                  {/* Academic Performance - Parent */}
                  {getVisibleColumns().find(c => c?.key === 'academic')?.visible && (
                    <TableCell>
                      <div className="flex items-center gap-2 py-5">
                        <Progress
                          aria-label="Academic performance"
                          value={group?.averageAcademic || 0}
                          size="sm"
                          className="max-w-[100px]"
                          color={(group?.averageAcademic || 0) >= 80 ? "success" : (group?.averageAcademic || 0) >= 60 ? "warning" : "danger"}
                          classNames={{
                            indicator: (group?.averageAcademic || 0) >= 80
                              ? "bg-success-300"
                              : (group?.averageAcademic || 0) >= 60
                                ? "bg-warning-300"
                                : "bg-danger-300",
                            track: "bg-default-100"
                          }}
                        />
                        <span className="text-xs font-semibold text-default-700 min-w-[32px]">{group?.averageAcademic || 0}%</span>
                      </div>
                    </TableCell>
                  )}

                  {/* Attendance - Parent */}
                  {getVisibleColumns().find(c => c?.key === 'attendance')?.visible && (
                    <TableCell>
                      <div className="flex items-center gap-2 py-5">
                        {group?.averageAttendance != null ? (
                          <>
                            <Progress
                              aria-label="Attendance"
                              value={group?.averageAttendance || 0}
                              size="sm"
                              className="max-w-[100px]"
                              classNames={{
                                indicator: (group?.averageAttendance || 0) >= 90
                                  ? "bg-emerald-300"
                                  : (group?.averageAttendance || 0) >= 75
                                    ? "bg-amber-300"
                                    : "bg-rose-300",
                                track: "bg-default-100"
                              }}
                            />
                            <span className="text-xs font-semibold text-default-700 min-w-[32px]">{group?.averageAttendance || 0}%</span>
                          </>
                        ) : (
                          <span className="text-xs text-default-400">—</span>
                        )}
                      </div>
                    </TableCell>
                  )}

                  {/* Fee Status - Parent */}
                  {getVisibleColumns().find(c => c?.key === 'status')?.visible && (
                    <TableCell>
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-medium ${pendingCount > 5
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
                          if (group?.classNum) toggleClassExpansion(group.classNum);
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
              if (!cls || !cls.id) {
                console.warn('Child item has invalid data:', item);
                return null;
              }

              const classKey = `${cls?.name || ''}-${cls?.section || ''}`;
              const pendingCount = feeDefaulters?.filter(s => s?.class === classKey)?.length || 0;
              // Use real attendance data from API when available, fallback to class data
              const classAttendanceData = attendanceData?.[cls?.id];
              const attendanceValue = classAttendanceData?.overallPercentage || classAttendanceData?.attendanceRate || cls?.averageAttendance || cls?.attendance || null;
              const academicData = academicPerformance?.[cls?.id] || {};
              const academicAverage = academicData?.classAverage || cls?.averageAcademicPerformance || 0;
              const classSettings = classSettingsMap?.[cls?.id];

              return (
                <TableRow
                  key={cls?.id || 'child-unknown'}
                  className="cursor-pointer hover:bg-default-50 bg-default-50/50"
                  onClick={(e) => {
                    // Don't navigate if clicking on interactive elements
                    if (e.target.closest("button") || e.target.closest("label") || e.target.closest("input") || e.target.closest("a")) return;

                    // Don't navigate if text is being selected
                    const selection = window.getSelection();
                    if (selection && selection.toString().length > 0) return;

                    item && handleRowClick(item);
                  }}
                >
                  {/* Class Details - Child */}
                  <TableCell>
                    <div className="flex items-center gap-3 py-3 pl-8">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center ml-6">
                        <span className="text-secondary font-semibold text-xs">{cls?.section || '-'}</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Link
                            to={cls?.id ? `/classes/${cls.id}` : '#'}
                            className="text-default-700 font-medium text-sm hover:text-primary transition-colors cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Section {cls?.section || '-'}
                          </Link>
                          {classSettings?.classTag && (
                            <Chip size="sm" variant="flat" color="primary" className="text-xs">
                              {classSettings.classTag}
                            </Chip>
                          )}
                        </div>
                        <span className="text-default-500 text-xs">
                          {cls?.studentCount || cls?.strength || 0} students
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Class Teacher - Child */}
                  {getVisibleColumns().find(c => c?.key === 'teacher')?.visible && (
                    <TableCell>
                      <div className="flex items-center gap-3 py-3">
                        {cls?.classTeacherId ? (
                          <PhotoAvatar
                            src={cls?.teacherPhoto}
                            alt={cls?.teacher || "Teacher"}
                            name={cls?.teacher || "Unassigned"}
                            size="sm"
                            type="staff"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-default-200 flex items-center justify-center">
                            <UserPlus size={14} className="text-default-400" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          {cls?.classTeacherId ? (
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/staffs/${cls.classTeacherId}`}
                                className="text-default-700 font-medium text-sm hover:text-primary transition-colors cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {cls?.teacher || "Unassigned"}
                              </Link>
                              <button
                                onClick={(e) => { e.stopPropagation(); if (cls) handleAssignTeacher(cls); }}
                                className="text-default-400 hover:text-primary transition-colors"
                                title="Change class teacher"
                              >
                                <RefreshCw size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); if (cls) handleAssignTeacher(cls); }}
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
                  {getVisibleColumns().find(c => c?.key === 'subjects')?.visible && (
                    <TableCell>
                      <div className="py-3">
                        <span className="text-default-700 text-sm">{cls?.subjects?.length || 0}</span>
                      </div>
                    </TableCell>
                  )}

                  {/* Strength - Child */}
                  {getVisibleColumns().find(c => c?.key === 'strength')?.visible && (
                    <TableCell>
                      <div className="py-3">
                        <span className="text-default-700 font-semibold text-base">{cls?.studentCount || cls?.strength || 0}</span>
                        <span className="text-default-500 text-xs">
                          {cls?.strengthLimit?.current ? `/${cls.strengthLimit.current}` : ''}
                        </span>
                      </div>
                    </TableCell>
                  )}

                  {/* Academic Performance - Child */}
                  {getVisibleColumns().find(c => c?.key === 'academic')?.visible && (
                    <TableCell>
                      <div className="flex items-center gap-2 py-3">
                        <Progress
                          aria-label="Academic performance"
                          value={academicAverage || 0}
                          size="sm"
                          className="max-w-[100px]"
                          color={(academicAverage || 0) >= 80 ? "success" : (academicAverage || 0) >= 60 ? "warning" : "danger"}
                          classNames={{
                            indicator: (academicAverage || 0) >= 80
                              ? "bg-success-300"
                              : (academicAverage || 0) >= 60
                                ? "bg-warning-300"
                                : "bg-danger-300",
                            track: "bg-default-100"
                          }}
                        />
                        <span className="text-xs font-semibold text-default-700 min-w-[32px]">{academicAverage || 0}%</span>
                      </div>
                    </TableCell>
                  )}

                  {/* Attendance - Child */}
                  {getVisibleColumns().find(c => c?.key === 'attendance')?.visible && (
                    <TableCell>
                      <div className="flex items-center gap-2 py-3">
                        {attendanceValue != null ? (
                          <>
                            <Progress
                              aria-label="Attendance"
                              value={attendanceValue || 0}
                              size="sm"
                              className="max-w-[100px]"
                              classNames={{
                                indicator: (attendanceValue || 0) >= 90
                                  ? "bg-emerald-300"
                                  : (attendanceValue || 0) >= 75
                                    ? "bg-amber-300"
                                    : "bg-rose-300",
                                track: "bg-default-100"
                              }}
                            />
                            <span className="text-xs font-semibold text-default-700 min-w-[32px]">{attendanceValue || 0}%</span>
                          </>
                        ) : (
                          <span className="text-xs text-default-400">—</span>
                        )}
                      </div>
                    </TableCell>
                  )}

                  {/* Fee Status - Child */}
                  {getVisibleColumns().find(c => c?.key === 'status')?.visible && (
                    <TableCell>
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-medium ${pendingCount > 2
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
                        <DropdownMenu aria-label="Class actions" onAction={(key) => cls && handleActionMenuItem(key, cls)}>
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
              {AVAILABLE_COLUMNS.filter(col => col && typeof col === 'object' && col.key).map(col => (
                <Checkbox
                  key={col.key}
                  isSelected={getVisibleColumns().find(c => c?.key === col.key)?.visible ?? true}
                  isDisabled={col.fixed}
                  onValueChange={() => col?.key && toggleColumn(col.key)}
                >
                  {col.label || col.key}
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

      {/* Assign Teacher Modal - Enhanced */}
      <ClassTeacherAssignmentModal
        isOpen={assignTeacherModal}
        onClose={() => setAssignTeacherModal(false)}
        classId={selectedClassForTeacher?.id}
        className={selectedClassForTeacher?.name}
        section={selectedClassForTeacher?.section}
        currentTeacherId={selectedClassForTeacher?.classTeacherId}
      />
    </div>
  );
}
