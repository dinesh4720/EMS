/**
 * useStudentsListFilters
 * Extracted from useStudentsListData.js — manages all filter state,
 * filter presets, filter counts, and persistence to sessionStorage.
 */
import { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

/**
 * @param {Array} students - Current list of student objects
 * @param {Array} classes - Available class objects
 * @param {string} currentAcademicYear - Current academic year string
 */
export function useStudentsListFilters(students, classes, currentAcademicYear) {
  const { t } = useTranslation();

  // ── Filter state (restored from sessionStorage) ──
  const [classFilter, setClassFilter] = useState(() => sessionStorage.getItem('students-filter-class') || 'all');
  const [feeStatusFilter, setFeeStatusFilter] = useState(() => sessionStorage.getItem('students-filter-feeStatus') || 'all');
  const [statusFilter, setStatusFilter] = useState(() => sessionStorage.getItem('students-filter-status') || 'active');
  const [academicYearFilter, setAcademicYearFilter] = useState(() => sessionStorage.getItem('students-filter-academicYear') || 'all');
  const [academicPerformanceFilter, setAcademicPerformanceFilter] = useState(() => sessionStorage.getItem('students-filter-academicPerformance') || 'all');
  const [attendanceFilter, setAttendanceFilter] = useState(() => sessionStorage.getItem('students-filter-attendance') || 'all');

  // ── Derived class helpers ──
  const uniqueClasses = useMemo(
    () => [...new Set(classes.map(cls => (cls.section ? `${cls.name}-${cls.section}` : cls.name)).filter(Boolean))].sort(),
    [classes]
  );

  const selectedClassId = useMemo(() => {
    if (classFilter === 'all') return null;
    const found = classes.find(cls => {
      const label = cls.section ? `${cls.name}-${cls.section}` : cls.name;
      return label === classFilter;
    });
    return found?._id || found?.id || null;
  }, [classFilter, classes]);

  const uniqueAcademicYears = useMemo(
    () => [...new Set([currentAcademicYear, ...students.map(s => s.academicYear || currentAcademicYear)])].sort(),
    [students, currentAcademicYear]
  );

  // ── Attendance helper ──
  const getAttendancePercentage = (student) => {
    if (student.attendancePercentage != null) return student.attendancePercentage;
    return null;
  };

  // ── Status counts ──
  const statusCounts = useMemo(() => {
    let active = 0, inactive = 0, alumni = 0, graduated = 0, transferred = 0;
    for (const student of students) {
      const status = student.status || 'active';
      if (status === 'active') active++;
      else if (status === 'inactive') inactive++;
      else if (status === 'alumni') alumni++;
      else if (status === 'graduated') graduated++;
      else if (status === 'transferred') transferred++;
    }
    return { all: students.length, active, inactive, alumni, graduated, transferred };
  }, [students]);

  // ── Client-side filters ──
  const filteredItems = useMemo(() => {
    let filtered = students;
    if (academicPerformanceFilter !== 'all') {
      filtered = filtered.filter(student => {
        if (!student.examResults || !Array.isArray(student.examResults) || student.examResults.length === 0) return false;
        const total = student.examResults.reduce((sum, e) => (e.percentage != null ? sum + e.percentage : sum), 0);
        const avg = total / student.examResults.length;
        switch (academicPerformanceFilter) {
          case 'excellent': return avg >= 90;
          case 'good': return avg >= 75 && avg < 90;
          case 'average': return avg >= 50 && avg < 75;
          case 'below_average': return avg < 50;
          default: return true;
        }
      });
    }
    if (attendanceFilter !== 'all') {
      filtered = filtered.filter(student => {
        const att = getAttendancePercentage(student);
        if (att == null) return false;
        switch (attendanceFilter) {
          case 'excellent': return att >= 90;
          case 'good': return att >= 75 && att < 90;
          case 'average': return att >= 50 && att < 75;
          case 'below': return att < 50;
          default: return true;
        }
      });
    }
    return filtered;
  }, [students, academicPerformanceFilter, attendanceFilter]);

  // ── Active filter count ──
  const activeFiltersCount =
    (classFilter !== 'all' ? 1 : 0) +
    (feeStatusFilter !== 'all' ? 1 : 0) +
    (academicYearFilter !== 'all' ? 1 : 0) +
    (academicPerformanceFilter !== 'all' ? 1 : 0) +
    (attendanceFilter !== 'all' ? 1 : 0);

  // ── Filter change handler ──
  const handleFilterChange = useCallback((filterKey, value) => {
    switch (filterKey) {
      case 'class': setClassFilter(value); break;
      case 'feeStatus': setFeeStatusFilter(value); break;
      case 'academicYear': setAcademicYearFilter(value); break;
      case 'academicPerformance': setAcademicPerformanceFilter(value); break;
      case 'attendance': setAttendanceFilter(value); break;
    }
    sessionStorage.setItem(`students-filter-${filterKey}`, value);
  }, []);

  // ── Clear all filters ──
  const clearAllFilters = useCallback(() => {
    setClassFilter('all');
    setFeeStatusFilter('all');
    setStatusFilter('all');
    setAcademicYearFilter('all');
    setAcademicPerformanceFilter('all');
    setAttendanceFilter('all');
    ['class', 'feeStatus', 'academicYear', 'academicPerformance', 'attendance', 'status'].forEach(
      k => sessionStorage.removeItem(`students-filter-${k}`)
    );
    toast.success(t('toast.success.allFiltersCleared'));
  }, [t]);

  // ── Filter presets ──
  const filterPresets = [
    { id: 'fee-defaulters', label: 'Fee Defaulters', icon: '💰', applied: feeStatusFilter === 'overdue', filters: { feeStatus: 'overdue' } },
    { id: 'low-attendance', label: 'Low Attendance', icon: '📉', applied: attendanceFilter === 'below', filters: { attendance: 'below' } },
    { id: 'high-performers', label: 'High Performers', icon: '⭐', applied: academicPerformanceFilter === 'excellent', filters: { academicPerformance: 'excellent' } },
    { id: 'needs-attention', label: 'Needs Attention', icon: '⚠️', applied: feeStatusFilter === 'overdue' && attendanceFilter === 'below', filters: { feeStatus: 'overdue', attendance: 'below' } },
  ];

  const handlePresetClick = useCallback((preset) => {
    // Reset all filters first, then apply preset
    setClassFilter('all');
    setFeeStatusFilter('all');
    setAcademicYearFilter('all');
    setAcademicPerformanceFilter('all');
    setAttendanceFilter('all');
    if (preset.filters.feeStatus) setFeeStatusFilter(preset.filters.feeStatus);
    if (preset.filters.attendance) setAttendanceFilter(preset.filters.attendance);
    if (preset.filters.academicPerformance) setAcademicPerformanceFilter(preset.filters.academicPerformance);
    if (preset.filters.class) setClassFilter(preset.filters.class);
    if (preset.filters.academicYear) setAcademicYearFilter(preset.filters.academicYear);
  }, []);

  // ── Filter config for FiltersBar ──
  const filterCounts = useMemo(() => {
    const classCounts = {}, feeStatusCounts = {}, academicYearCounts = {}, academicPerformanceCounts = {}, attendanceCounts = {};
    for (const student of students) {
      if (student.class) classCounts[student.class] = (classCounts[student.class] || 0) + 1;
      if (student.feeStatus) feeStatusCounts[student.feeStatus] = (feeStatusCounts[student.feeStatus] || 0) + 1;
      const yr = student.academicYear || currentAcademicYear;
      academicYearCounts[yr] = (academicYearCounts[yr] || 0) + 1;
      if (student.academicPerformance) academicPerformanceCounts[student.academicPerformance] = (academicPerformanceCounts[student.academicPerformance] || 0) + 1;
      const att = getAttendancePercentage(student);
      if (att != null) {
        let cat = 'below';
        if (att >= 90) cat = 'excellent';
        else if (att >= 75) cat = 'good';
        else if (att >= 50) cat = 'average';
        attendanceCounts[cat] = (attendanceCounts[cat] || 0) + 1;
      }
    }
    return { class: classCounts, feeStatus: feeStatusCounts, academicYear: academicYearCounts, academicPerformance: academicPerformanceCounts, attendance: attendanceCounts };
  }, [students, currentAcademicYear]);

  const filtersConfig = useMemo(() => {
    const feeStatusOpts = ['paid', 'pending', 'overdue', 'partial'];
    return {
      class: { label: 'Class', value: classFilter, options: ['all', ...uniqueClasses], counts: { all: students.length, ...filterCounts.class }, displayLabels: { all: 'All Classes' } },
      feeStatus: { label: 'Fee Status', value: feeStatusFilter, options: ['all', ...feeStatusOpts], counts: { all: students.length, ...filterCounts.feeStatus }, displayLabels: { all: 'All Fee Status', paid: 'Paid', pending: 'Pending', overdue: 'Overdue', partial: 'Partial' } },
      academicYear: { label: 'Academic Year', value: academicYearFilter, options: ['all', ...uniqueAcademicYears], counts: { all: students.length, ...filterCounts.academicYear }, displayLabels: { all: 'All Years' } },
      academicPerformance: { label: 'Academic Performance', value: academicPerformanceFilter, options: ['all', 'excellent', 'good', 'average', 'below_average'], counts: { all: students.length, ...filterCounts.academicPerformance }, displayLabels: { all: 'All Performance', excellent: 'Excellent (90%+)', good: 'Good (75-89%)', average: 'Average (50-74%)', below_average: 'Below Average (<50%)' } },
      attendance: { label: 'Attendance', value: attendanceFilter, options: ['all', 'excellent', 'good', 'average', 'below'], counts: { all: students.length, ...filterCounts.attendance }, displayLabels: { all: 'All Attendance', excellent: 'Excellent (90%+)', good: 'Good (75-89%)', average: 'Average (50-74%)', below: 'Below Average (<50%)' } },
    };
  }, [classFilter, feeStatusFilter, academicYearFilter, academicPerformanceFilter, attendanceFilter, uniqueClasses, uniqueAcademicYears, filterCounts, students.length]);

  return {
    // Filter state
    statusFilter, setStatusFilter,
    classFilter, feeStatusFilter, academicYearFilter,
    // Derived
    selectedClassId, uniqueClasses, uniqueAcademicYears, statusCounts,
    filteredItems,
    // Filter management
    filtersConfig, filterPresets, activeFiltersCount,
    handleFilterChange, handlePresetClick, clearAllFilters,
  };
}
