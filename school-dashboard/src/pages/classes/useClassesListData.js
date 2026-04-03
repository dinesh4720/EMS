import { useState, useMemo, useEffect, useRef } from "react";
import logger from "../../utils/logger";
import { useApp } from "../../context/AppContext";
import {
  ITEMS_PER_LOAD,
  SEARCH_DEBOUNCE_MS,
  CLASS_DETAILS_BATCH_SIZE,
  CLASS_DETAILS_BATCH_DELAY_MS,
  hasOwnKey,
} from './classesListConstants';

/**
 * Custom hook that encapsulates all data fetching, grouping, filtering,
 * sorting, and lazy-loading logic for the ClassesList page.
 */
export function useClassesListData() {
  const { classesWithTeachers: classesData, feeDefaulters, classesEnhancedApi, classesApi } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef(null);
  const [sortDescriptor, setSortDescriptor] = useState({ column: "name", direction: "ascending" });
  const [expandedClasses, setExpandedClasses] = useState(new Set([]));

  // Academic performance data state
  const [academicPerformance, setAcademicPerformance] = useState({});
  // Attendance data state
  const [attendanceData, setAttendanceData] = useState({});
  // Class settings data state (for tags)
  const [classSettingsMap, setClassSettingsMap] = useState({});

  const classDetailsRequestStateRef = useRef(new Map());

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

        groups[classNum].totalStudents += cls.studentCount || cls.strength || 0;

        const classKey = `${cls.name}-${cls.section}`;
        const pendingCount = feeDefaulters?.filter(s => s?.class === classKey)?.length || 0;
        groups[classNum].totalPendingFees += pendingCount;

        const attendance = cls.averageAttendance || cls.attendance || null;
        const academic = cls.averageAcademicPerformance || 0;
        groups[classNum].averageAttendance = (groups[classNum].averageAttendance || 0) + attendance;
        groups[classNum].averageAcademic = (groups[classNum].averageAcademic || 0) + academic;
      });

      Object.values(groups).forEach(group => {
        const sectionCount = group.sections?.length || 0;
        group.averageAttendance = sectionCount > 0 ? Math.round((group.averageAttendance || 0) / sectionCount) : 0;
        group.averageAcademic = sectionCount > 0 ? Math.round((group.averageAcademic || 0) / sectionCount) : 0;
      });

      const sorted = Object.values(groups);
      sorted.sort((a, b) => {
        let cmp = 0;
        switch (sortDescriptor.column) {
          case 'class':
          case 'name':
            cmp = a.classNum - b.classNum;
            break;
          case 'strength':
            cmp = (a.totalStudents || 0) - (b.totalStudents || 0);
            break;
          case 'academic':
            cmp = (a.averageAcademic || 0) - (b.averageAcademic || 0);
            break;
          case 'attendance':
            cmp = (a.averageAttendance || 0) - (b.averageAttendance || 0);
            break;
          case 'status':
            cmp = (a.totalPendingFees || 0) - (b.totalPendingFees || 0);
            break;
          default:
            cmp = a.classNum - b.classNum;
        }
        return sortDescriptor.direction === 'descending' ? -cmp : cmp;
      });
      return sorted;
    } catch (error) {
      logger.error('Error grouping classes:', error);
      return [];
    }
  }, [classesData, feeDefaulters, sortDescriptor]);

  // Filter grouped classes
  const filteredGroupedClasses = useMemo(() => {
    try {
      if (!debouncedSearchQuery) return groupedClasses || [];

      const search = debouncedSearchQuery.toLowerCase();
      const keywords = search.split(' ').filter(k => k.length > 0);

      return (groupedClasses || []).filter((group) => {
        if (!group || !group.sections) return false;

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
      logger.error('Error filtering grouped classes:', error);
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
        if (!group || typeof group !== 'object') {
          console.warn('Skipping invalid group:', group);
          continue;
        }

        if (count >= visibleCount) break;

        items.push({ id: `parent-${group.classNum}`, type: 'parent', data: group });
        count++;

        if (expandedClasses.has(group.classNum) && group.sections && Array.isArray(group.sections)) {
          for (const section of group.sections) {
            if (!section || typeof section !== 'object') {
              console.warn('Skipping invalid section:', section);
              continue;
            }

            if (count >= visibleCount) break;
            items.push({ id: section.id || `child-${group.classNum}-${section.section || count}`, type: 'child', data: section });
            count++;
          }
        }
      }

      return items;
    } catch (error) {
      logger.error('Error in visibleItems useMemo:', error);
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
      logger.error('Error calculating hasMore:', error);
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

  const visibleChildClassIds = useMemo(() => (
    visibleItems
      .filter((item) => item?.type === 'child' && item?.data?.id)
      .map((item) => String(item.data.id))
  ), [visibleItems]);

  // Only fetch detail data for section rows the user can actually see.
  useEffect(() => {
    if (visibleChildClassIds.length === 0) {
      return undefined;
    }

    let cancelled = false;

    const loadVisibleClassDetails = async () => {
      const pendingIds = visibleChildClassIds.filter((classId) => {
        const requestState = classDetailsRequestStateRef.current.get(classId);
        const hasAcademic = hasOwnKey(academicPerformance, classId);
        const hasAttendance = hasOwnKey(attendanceData, classId);
        const hasSettings = hasOwnKey(classSettingsMap, classId);

        if (hasAcademic && hasAttendance && hasSettings) {
          classDetailsRequestStateRef.current.set(classId, 'loaded');
          return false;
        }

        return requestState !== 'loading';
      });

      for (let i = 0; i < pendingIds.length; i += CLASS_DETAILS_BATCH_SIZE) {
        const batch = pendingIds.slice(i, i + CLASS_DETAILS_BATCH_SIZE);

        await Promise.all(batch.map(async (classId) => {
          const cls = classesData.find((classItem) => String(classItem?.id) === classId);

          if (!cls) {
            classDetailsRequestStateRef.current.delete(classId);
            return;
          }

          classDetailsRequestStateRef.current.set(classId, 'loading');

          const needsAcademic = !hasOwnKey(academicPerformance, classId);
          const needsAttendance = !hasOwnKey(attendanceData, classId);
          const needsSettings = !hasOwnKey(classSettingsMap, classId);

          const [academic, attendance, settings] = await Promise.all([
            needsAcademic
              ? classesEnhancedApi.getAcademicPerformance(classId).catch((error) => {
                  logger.error(`Error loading academic performance for class ${classId}:`, error);
                  return { classAverage: cls.averageAcademicPerformance || 0 };
                })
              : Promise.resolve(academicPerformance[classId]),
            needsAttendance
              ? classesEnhancedApi.getAttendanceAnalytics(classId, 'month').catch((error) => {
                  logger.error(`Error loading attendance analytics for class ${classId}:`, error);
                  return null;
                })
              : Promise.resolve(attendanceData[classId]),
            needsSettings
              ? classesApi.getSettings(classId).catch((error) => {
                  logger.error(`Error loading settings for class ${classId}:`, error);
                  return null;
                })
              : Promise.resolve(classSettingsMap[classId]),
          ]);

          if (cancelled) {
            return;
          }

          if (needsAcademic) {
            setAcademicPerformance((prev) => (
              hasOwnKey(prev, classId) ? prev : { ...prev, [classId]: academic }
            ));
          }

          if (needsAttendance) {
            setAttendanceData((prev) => (
              hasOwnKey(prev, classId) ? prev : { ...prev, [classId]: attendance }
            ));
          }

          if (needsSettings) {
            setClassSettingsMap((prev) => (
              hasOwnKey(prev, classId) ? prev : { ...prev, [classId]: settings }
            ));
          }

          classDetailsRequestStateRef.current.set(classId, 'loaded');
        }));

        if (cancelled) {
          return;
        }

        if (i + CLASS_DETAILS_BATCH_SIZE < pendingIds.length) {
          await new Promise((resolve) => setTimeout(resolve, CLASS_DETAILS_BATCH_DELAY_MS));
        }
      }
    };

    loadVisibleClassDetails();

    return () => {
      cancelled = true;
    };
  }, [
    academicPerformance,
    attendanceData,
    classSettingsMap,
    classesApi,
    classesData,
    classesEnhancedApi,
    visibleChildClassIds,
  ]);

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

  return {
    // Search
    searchQuery,
    setSearchQuery,
    // Sort
    sortDescriptor,
    setSortDescriptor,
    // Display data
    visibleItems,
    hasMore,
    isLoading,
    loaderRef,
    // Expansion
    expandedClasses,
    toggleClassExpansion,
    // Detail data for child rows
    feeDefaulters,
    attendanceData,
    academicPerformance,
    classSettingsMap,
  };
}
