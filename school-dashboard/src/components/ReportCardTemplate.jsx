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
  const containerStyle = forPrint ? {
    width: '210mm',
    minHeight: '297mm',
    padding: '15mm',
    backgroundColor: 'white',
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
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
  const publishedResults = results.filter(r => r.isPublished && r.marksObtained !== null);
  const totalMarksObtained = publishedResults.reduce((sum, r) => sum + r.marksObtained, 0);
  const totalMaxMarks = publishedResults.reduce((sum, r) => sum + r.maxMarks, 0);
  const overallPercentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks * 100) : 0;

  return (
    <div style={containerStyle} className={forPrint ? '' : 'max-w-4xl mx-auto'}>
      {/* School Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-default-900">
          {schoolInfo.name || 'School Management System'}
        </h1>
        <p className="text-sm text-default-500">
          {schoolInfo.address || 'Academic Excellence Through Innovation'}
        </p>
        {schoolInfo.logo && (
          <img
            src={schoolInfo.logo}
            alt="School Logo"
            className="w-16 h-16 mx-auto mt-2 object-contain"
          />
        )}
        <Divider className="my-4" />
        <h2 className="text-xl font-bold text-default-900">ACADEMIC REPORT CARD</h2>
      </div>

      {/* Student Information */}
      <Card shadow="none" className="border border-default-200 mb-6">
        <CardBody className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-default-500">Student Name</p>
              <p className="font-semibold text-default-900">{student?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-default-500">Class / Section</p>
              <p className="font-semibold text-default-900">{student?.class || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-default-500">Roll Number</p>
              <p className="font-semibold text-default-900">{student?.rollNo || student?.id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-default-500">Academic Year</p>
              <p className="font-semibold text-default-900">{performance?.academicYear || new Date().getFullYear()}</p>
            </div>
            <div>
              <p className="text-xs text-default-500">Father's Name</p>
              <p className="font-semibold text-default-900">{student?.fatherName || student?.guardianName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-default-500">Date of Birth</p>
              <p className="font-semibold text-default-900">{student?.dob || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-default-500">Term</p>
              <p className="font-semibold text-default-900">{performance?.term || 'Full Year'}</p>
            </div>
            <div>
              <p className="text-xs text-default-500">Admission No.</p>
              <p className="font-semibold text-default-900">{student?.admissionNo || 'N/A'}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Overall Performance Summary */}
      <Card shadow="none" className="border border-default-200 mb-6">
        <CardBody className="p-4">
          <h3 className="font-semibold text-default-900 mb-4 flex items-center gap-2">
            <Award className="text-yellow-500" size={18} />
            Overall Performance
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {performance?.overallGrade || 'N/A'}
              </p>
              <p className="text-xs text-blue-600">Grade</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {performance?.overallPercentage?.toFixed(1) || overallPercentage.toFixed(1)}%
              </p>
              <p className="text-xs text-green-600">Percentage</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {performance?.overallGPA?.toFixed(2) || 'N/A'}
              </p>
              <p className="text-xs text-purple-600">GPA</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                #{performance?.classRank || 'N/A'}
              </p>
              <p className="text-xs text-orange-600">Class Rank</p>
            </div>
            <div className="text-center p-3 bg-cyan-50 rounded-lg">
              <p className="text-2xl font-bold text-cyan-600">
                {performance?.totalStudents || 'N/A'}
              </p>
              <p className="text-xs text-cyan-600">Total Students</p>
            </div>
          </div>

          {performance?.trend && (
            <div className="mt-4 flex items-center gap-2 justify-center">
              <TrendingUp size={16} className={
                performance.trend === 'improving' ? 'text-success' :
                performance.trend === 'declining' ? 'text-danger' : 'text-default-400'
              } />
              <span className="text-sm text-default-600">
                Performance Trend: <span className="font-semibold capitalize">{performance.trend}</span>
                {performance.trendData?.difference && (
                  <span className="ml-2">
                    ({performance.trendData.difference > 0 ? '+' : ''}{performance.trendData.difference}%)
                  </span>
                )}
              </span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Subject-wise Results Table */}
      <Card shadow="none" className="border border-default-200 mb-6">
        <CardBody className="p-4">
          <h3 className="font-semibold text-default-900 mb-4 flex items-center gap-2">
            <BookOpen className="text-blue-500" size={18} />
            Subject-wise Performance
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default-200">
                <th className="text-left py-2 px-3 text-default-600 font-medium">Subject</th>
                <th className="text-center py-2 px-3 text-default-600 font-medium">Max Marks</th>
                <th className="text-center py-2 px-3 text-default-600 font-medium">Obtained</th>
                <th className="text-center py-2 px-3 text-default-600 font-medium">Percentage</th>
                <th className="text-center py-2 px-3 text-default-600 font-medium">Grade</th>
                <th className="text-center py-2 px-3 text-default-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {publishedResults.length > 0 ? (
                publishedResults.map((result, idx) => (
                  <tr key={idx} className="border-b border-default-100">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span>{getSubjectIcon(result.subjectName)}</span>
                        <span className="font-medium">{result.subjectName}</span>
                      </div>
                    </td>
                    <td className="text-center py-2 px-3">{result.maxMarks}</td>
                    <td className="text-center py-2 px-3 font-medium">{result.marksObtained}</td>
                    <td className="text-center py-2 px-3">
                      {result.percentage?.toFixed(1) || '-'}%
                    </td>
                    <td className="text-center py-2 px-3">
                      <Chip
                        size="sm"
                        color={calculateGradeColor(result.grade)}
                        variant="flat"
                      >
                        {result.grade || 'N/A'}
                      </Chip>
                    </td>
                    <td className="text-center py-2 px-3">
                      <Chip
                        size="sm"
                        color={result.status === 'pass' ? 'success' : 'danger'}
                        variant="flat"
                      >
                        {result.status || 'N/A'}
                      </Chip>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-default-400">
                    No published results available
                  </td>
                </tr>
              )}
              {publishedResults.length > 0 && (
                <tr className="bg-default-50 font-semibold">
                  <td className="py-2 px-3">Total</td>
                  <td className="text-center py-2 px-3">{totalMaxMarks}</td>
                  <td className="text-center py-2 px-3">{totalMarksObtained}</td>
                  <td className="text-center py-2 px-3">{overallPercentage.toFixed(1)}%</td>
                  <td className="text-center py-2 px-3">
                    <Chip
                      size="sm"
                      color={calculateGradeColor(performance?.overallGrade)}
                      variant="flat"
                    >
                      {performance?.overallGrade || 'N/A'}
                    </Chip>
                  </td>
                  <td className="text-center py-2 px-3">-</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Attendance Summary */}
      {attendance.totalDays > 0 && (
        <Card shadow="none" className="border border-default-200 mb-6">
          <CardBody className="p-4">
            <h3 className="font-semibold text-default-900 mb-4 flex items-center gap-2">
              <Calendar className="text-green-500" size={18} />
              Attendance Summary
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-default-900">{attendance.totalDays}</p>
                <p className="text-xs text-default-500">Total Days</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-success">{attendance.present}</p>
                <p className="text-xs text-default-500">Present</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-danger">{attendance.absent}</p>
                <p className="text-xs text-default-500">Absent</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-primary">
                  {((attendance.present / attendance.totalDays) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-default-500">Attendance</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Teacher Remarks */}
      <Card shadow="none" className="border border-default-200 mb-6">
        <CardBody className="p-4">
          <h3 className="font-semibold text-default-900 mb-4 flex items-center gap-2">
            <FileText className="text-purple-500" size={18} />
            Teacher Remarks
          </h3>
          <div className="space-y-3">
            <div className="border-b border-dashed border-default-200 py-4 min-h-[40px]">
              <p className="text-default-600 italic">
                {performance?.teacherRemarks || '______________________________________________________________'}
              </p>
            </div>
            <div className="border-b border-dashed border-default-200 py-4 min-h-[40px]">
              <p className="text-default-600 italic">
                ______________________________________________________________
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Signature Area */}
      <div className="grid grid-cols-3 gap-8 mt-8 pt-8">
        <div className="text-center">
          <div className="border-t border-default-400 pt-2 mb-2">
            <p className="text-sm font-medium text-default-900">Class Teacher</p>
          </div>
          <p className="text-xs text-default-500">Signature</p>
        </div>
        <div className="text-center">
          <div className="border-t border-default-400 pt-2 mb-2">
            <p className="text-sm font-medium text-default-900">Principal</p>
          </div>
          <p className="text-xs text-default-500">Signature & Seal</p>
        </div>
        <div className="text-center">
          <div className="border-t border-default-400 pt-2 mb-2">
            <p className="text-sm font-medium text-default-900">Parent/Guardian</p>
          </div>
          <p className="text-xs text-default-500">Signature</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 pt-4 border-t border-default-200">
        <p className="text-xs text-default-400">
          Generated on: {new Date().toLocaleString()}
        </p>
        <p className="text-xs text-default-400">
          This is a computer-generated report card and does not require physical signature for verification.
        </p>
      </div>
    </div>
  );
};

export default ReportCardTemplate;
