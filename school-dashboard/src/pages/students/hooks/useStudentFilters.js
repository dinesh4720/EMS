import { useState } from 'react';

export function useStudentFilters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [feeStatusFilter, setFeeStatusFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [academicPerformanceFilter, setAcademicPerformanceFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [previewFilter, setPreviewFilter] = useState("all");

  return {
    searchQuery, setSearchQuery,
    classFilter, setClassFilter,
    feeStatusFilter, setFeeStatusFilter,
    statusFilter, setStatusFilter,
    academicYearFilter, setAcademicYearFilter,
    academicPerformanceFilter, setAcademicPerformanceFilter,
    attendanceFilter, setAttendanceFilter,
    previewFilter, setPreviewFilter,
  };
}
