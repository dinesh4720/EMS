import React from 'react';
import {
  Card, CardBody, Divider, Chip, Progress
} from '@heroui/react';
import {
  Award, User, Calendar, BookOpen, TrendingUp, FileText
} from 'lucide-react';

/**
 * Report Card Template Component
 * Used for both screen preview and PDF generation
 * Designed for 2-page print layout with spacious, minimal design
 *
 * @param {Object} student - Student information
 * @param {Object} performance - Academic performance data
 * @param {Array} results - Exam results array
 * @param {Object} schoolInfo - School branding information
 * @param {Object} attendance - Attendance summary
 */
const ReportCardTemplate = ({
  student,
  performance,
  results,
  schoolInfo = {},
  attendance = {},
  forPrint = false
}) => {
  // Print styles - 2 page layout with generous spacing
  const containerStyle = forPrint ? {
    width: '210mm',
    minHeight: '297mm',
    padding: '20mm',
    backgroundColor: 'white',
    fontFamily: 'Arial, sans-serif',
    fontSize: '11pt',
    lineHeight: '1.5',
    color: '#1a1a1a'
  } : {};

  const calculateGradeColor = (grade) => {
    if (!grade) return 'default';
    if (grade.includes('A')) return 'success';
    if (grade.includes('B')) return 'primary';
    if (grade.includes('C')) return 'warning';
    return 'danger';
  };

  const subjectIcons = {
    'math': '📐',
    'science': '🔬',
    'english': '📚',
    'social': '🌍',
    'computer': '💻',
    'physical': '⚽',
    'hindi': '🔤',
    'default': '📖'
  };

  const getSubjectIcon = (name) => {
    const lower = name?.toLowerCase() || '';
    for (const [key, icon] of Object.entries(subjectIcons)) {
      if (lower.includes(key)) return icon;
    }
    return subjectIcons.default;
  };

  // Calculate totals from results
  // Note: isPublished filter removed here because the backend route already filters by isPublished: true.
  // Using marksObtained for single-subject results, totalMarksObtained for multi-subject results.
  const publishedResults = results.filter(r => r.marksObtained !== null || (r.marks && r.marks.length > 0));
  const totalMarksObtained = publishedResults.reduce((sum, r) => {
    return sum + (r.marks?.length > 0 ? (r.totalMarksObtained || 0) : (r.marksObtained || 0));
  }, 0);
  const totalMaxMarks = publishedResults.reduce((sum, r) => {
    return sum + (r.marks?.length > 0 ? (r.totalMaxMarks || 0) : (r.maxMarks || 0));
  }, 0);
  const overallPercentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks * 100) : 0;

  return (
    <div style={containerStyle} className={forPrint ? 'print-content' : 'print-content max-w-4xl mx-auto'}>
      {/* ========== PAGE 1 ========== */}
      
      {/* School Header */}
      <div className="text-center mb-8">
        {schoolInfo.logo && (
          <img
            src={schoolInfo.logo}
            alt="School Logo"
            className="w-20 h-20 mx-auto mb-4 object-contain"
          />
        )}
        <h1 className="text-3xl font-bold text-gray-900 tracking-wide">
          {schoolInfo.name || 'School Management System'}
        </h1>
        <p className="text-base text-gray-600 mt-2">
          {schoolInfo.address || 'Academic Excellence Through Innovation'}
        </p>
        <Divider className="my-6" />
        <h2 className="text-xl font-semibold text-gray-800 uppercase tracking-widest">
          Academic Report Card
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          {performance?.academicYear || new Date().getFullYear()} • {performance?.term || 'Annual Report'}
        </p>
      </div>

      {/* Student Information - Spacious 2-column layout */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
          Student Information
        </h3>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 uppercase tracking-wide">Student Name</span>
            <span className="text-base font-semibold text-gray-900 mt-1">{student?.name || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 uppercase tracking-wide">Class / Section</span>
            <span className="text-base font-semibold text-gray-900 mt-1">{student?.class || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 uppercase tracking-wide">Roll Number</span>
            <span className="text-base font-semibold text-gray-900 mt-1">{student?.rollNo || student?.id || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 uppercase tracking-wide">Admission Number</span>
            <span className="text-base font-semibold text-gray-900 mt-1">{student?.admissionNo || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 uppercase tracking-wide">Father's Name</span>
            <span className="text-base font-semibold text-gray-900 mt-1">{student?.fatherName || student?.guardianName || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 uppercase tracking-wide">Date of Birth</span>
            <span className="text-base font-semibold text-gray-900 mt-1">{student?.dob || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Overall Performance Summary - 3 spacious columns */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
          Overall Performance
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-xl">
            <p className="text-4xl font-bold text-blue-600">
              {performance?.overallGrade || 'N/A'}
            </p>
            <p className="text-sm text-blue-500 uppercase tracking-wide mt-2">Grade</p>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-xl">
            <p className="text-4xl font-bold text-green-600">
              {performance?.overallPercentage?.toFixed(1) || overallPercentage.toFixed(1)}%
            </p>
            <p className="text-sm text-green-500 uppercase tracking-wide mt-2">Percentage</p>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-xl">
            <p className="text-4xl font-bold text-purple-600">
              #{performance?.classRank || 'N/A'}
            </p>
            <p className="text-sm text-purple-500 uppercase tracking-wide mt-2">Class Rank</p>
          </div>
        </div>

        {/* Additional metrics row */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">GPA</span>
            <span className="text-lg font-semibold text-gray-800">
              {performance?.overallGPA?.toFixed(2) || 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Total Students</span>
            <span className="text-lg font-semibold text-gray-800">
              {performance?.totalStudents || 'N/A'}
            </span>
          </div>
        </div>

        {performance?.trend && (
          <div className="mt-6 flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
            <TrendingUp size={20} className={
              performance.trend === 'improving' ? 'text-green-500' :
              performance.trend === 'declining' ? 'text-red-500' : 'text-gray-400'
            } />
            <span className="text-base text-gray-700">
              Performance Trend: <span className="font-semibold capitalize">{performance.trend}</span>
              {performance.trendData?.difference && (
                <span className="ml-2 font-medium">
                  ({performance.trendData.difference > 0 ? '+' : ''}{performance.trendData.difference}%)
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Attendance Summary */}
      {attendance.totalDays > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
            Attendance Summary
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-5 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-800">{attendance.totalDays}</p>
              <p className="text-sm text-gray-500 mt-1">Total Days</p>
            </div>
            <div className="text-center p-5 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{attendance.present}</p>
              <p className="text-sm text-green-500 mt-1">Present</p>
            </div>
            <div className="text-center p-5 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{attendance.absent}</p>
              <p className="text-sm text-red-500 mt-1">Absent</p>
            </div>
            <div className="text-center p-5 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">
                {((attendance.present / attendance.totalDays) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-blue-500 mt-1">Attendance</p>
            </div>
          </div>
        </div>
      )}

      {/* Page Break */}
      <div className="page-break-after break-after-page">
        <div className="text-center text-sm text-gray-400 mt-8 pt-4">
          — Continued on next page —
        </div>
      </div>

      {/* ========== PAGE 2 ========== */}
      
      {/* Page 2 Header */}
      <div className="mb-8 pt-4">
        <div className="flex items-center justify-between border-b-2 border-gray-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Academic Report Card</h2>
            <p className="text-sm text-gray-500">{performance?.academicYear || new Date().getFullYear()}</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold text-gray-800">{student?.name || 'Student'}</p>
            <p className="text-sm text-gray-500">{student?.class || 'Class'}</p>
          </div>
        </div>
      </div>

      {/* Subject-wise Results Table - Full width with comfortable spacing */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
          Subject-wise Performance
        </h3>
        
        {publishedResults.length > 0 ? (
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left py-4 px-4 font-semibold text-gray-700 rounded-tl-lg">Subject</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">Max Marks</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">Obtained</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">Percentage</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">Grade</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700 rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              {publishedResults.flatMap((result, idx) => {
                // Multi-subject results: expand the marks array into rows
                if (result.marks && result.marks.length > 0) {
                  return result.marks.map((mark, mIdx) => (
                    <tr key={`${result._id}-${mark.subjectName}`} className="border-b border-gray-100">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getSubjectIcon(mark.subjectName)}</span>
                          <span className="font-medium text-gray-800">{mark.subjectName}</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 text-gray-600">{mark.maxMarks}</td>
                      <td className="text-center py-4 px-4 font-semibold text-gray-800">{mark.marksObtained}</td>
                      <td className="text-center py-4 px-4 text-gray-600">
                        {mark.maxMarks > 0 ? ((mark.marksObtained / mark.maxMarks) * 100).toFixed(1) : '-'}%
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          mark.grade?.includes('A') ? 'bg-green-100 text-green-700' :
                          mark.grade?.includes('B') ? 'bg-blue-100 text-blue-700' :
                          mark.grade?.includes('C') ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {mark.grade || 'N/A'}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          mark.marksObtained >= (mark.passingMarks || 0) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {mark.marksObtained >= (mark.passingMarks || 0) ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  ));
                }
                // Single-subject results: use exam name as the label
                const examName = result.examId?.name || 'Exam';
                const pct = result.maxMarks > 0 ? ((result.marksObtained / result.maxMarks) * 100) : 0;
                return [(
                  <tr key={result._id} className="border-b border-gray-100">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getSubjectIcon(examName)}</span>
                        <span className="font-medium text-gray-800">{examName}</span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4 text-gray-600">{result.maxMarks}</td>
                    <td className="text-center py-4 px-4 font-semibold text-gray-800">{result.marksObtained}</td>
                    <td className="text-center py-4 px-4 text-gray-600">
                      {result.percentage?.toFixed(1) || pct.toFixed(1)}%
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        result.grade?.includes('A') ? 'bg-green-100 text-green-700' :
                        result.grade?.includes('B') ? 'bg-blue-100 text-blue-700' :
                        result.grade?.includes('C') ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {result.grade || 'N/A'}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        result.status === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {result.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                )];
              })}
              {/* Total Row */}
              <tr className="bg-gray-50 font-semibold">
                <td className="py-4 px-4 rounded-bl-lg">Total</td>
                <td className="text-center py-4 px-4">{totalMaxMarks}</td>
                <td className="text-center py-4 px-4">{totalMarksObtained}</td>
                <td className="text-center py-4 px-4">{overallPercentage.toFixed(1)}%</td>
                <td className="text-center py-4 px-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    performance?.overallGrade?.includes('A') ? 'bg-green-100 text-green-700' :
                    performance?.overallGrade?.includes('B') ? 'bg-blue-100 text-blue-700' :
                    performance?.overallGrade?.includes('C') ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {performance?.overallGrade || 'N/A'}
                  </span>
                </td>
                <td className="text-center py-4 px-4 rounded-br-lg">-</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg">
            <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
            <p>No published results available</p>
          </div>
        )}
      </div>

      {/* Teacher Remarks - Spacious comment areas */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
          Teacher Remarks
        </h3>
        <div className="space-y-6">
          <div className="p-5 bg-gray-50 rounded-lg min-h-[80px]">
            <p className="text-sm text-gray-500 mb-2">Class Teacher's Remarks:</p>
            <p className="text-base text-gray-700">
              {performance?.teacherRemarks || (
                <span className="text-gray-400 italic">No remarks provided</span>
              )}
            </p>
          </div>
          <div className="p-5 bg-gray-50 rounded-lg min-h-[80px]">
            <p className="text-sm text-gray-500 mb-2">Principal's Remarks:</p>
            <p className="text-base text-gray-700 italic text-gray-400">
              ____________________________________________________________________________
            </p>
          </div>
        </div>
      </div>

      {/* Signature Section - Well spaced 3 columns */}
      <div className="mt-16 mb-8">
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="border-t-2 border-gray-300 pt-4 mt-16">
              <p className="font-semibold text-gray-800">Class Teacher</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">Signature</p>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-gray-300 pt-4 mt-16">
              <p className="font-semibold text-gray-800">Principal</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">Signature & Seal</p>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-gray-300 pt-4 mt-16">
              <p className="font-semibold text-gray-800">Parent/Guardian</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">Signature</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-12 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Generated on: {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        <p className="text-xs text-gray-400 mt-2 italic">
          This is a computer-generated report card and does not require physical signature for verification.
        </p>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          .page-break-after {
            page-break-after: always;
            break-after: page;
          }
          
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .bg-blue-50 { background-color: #eff6ff !important; }
          .bg-green-50 { background-color: #f0fdf4 !important; }
          .bg-purple-50 { background-color: #faf5ff !important; }
          .bg-red-50 { background-color: #fef2f2 !important; }
          .bg-gray-50 { background-color: #f9fafb !important; }
          .bg-gray-100 { background-color: #f3f4f6 !important; }
          
          .text-blue-600 { color: #2563eb !important; }
          .text-green-600 { color: #16a34a !important; }
          .text-purple-600 { color: #9333ea !important; }
          .text-red-600 { color: #dc2626 !important; }

          /* Force light mode for print regardless of theme */
          .print-content {
            background-color: white !important;
            color: #1a1a1a !important;
          }
          .text-gray-900, .text-gray-800, .text-gray-700 { color: #1a1a1a !important; }
          .text-gray-600, .text-gray-500 { color: #4b5563 !important; }
          .border-gray-200, .border-gray-100, .border-gray-300 { border-color: #e5e7eb !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportCardTemplate;