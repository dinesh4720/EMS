import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsApi } from '../../../services/api/extensions';
import { examsApi } from '../../../services/api/academics';
import EmptyState from '../../../components/ui/EmptyState';
import ErrorState from '../../../components/ui/ErrorState';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import Select from '../../../components/ui/Select';
import SectionHeading from '../../../components/ui/SectionHeading';
import Card from '../../../components/ui/Card';
import logger from '../../../utils/logger';
import ReportTable from './ReportTable';

export default function MarksTab({ academicYear }) {
  const [examId, setExamId] = useState('');
  const [exams, setExams] = useState([]);
  const [classResults, setClassResults] = useState([]);
  const [subjectAnalysis, setSubjectAnalysis] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [rankList, setRankList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = academicYear ? { academicYear } : {};
    examsApi
      .getAll(params)
      .then((data) => setExams(Array.isArray(data) ? data : []))
      .catch((err) => logger.error('Failed to load exams:', err));
  }, [academicYear]);

  const fetchData = useCallback(async () => {
    if (!examId) return;
    try {
      setLoading(true);
      setError(null);
      const params = { examId, academicYear };
      const [cr, sa, gd, rl] = await Promise.all([
        reportsApi.classResults(params),
        reportsApi.subjectAnalysis(params),
        reportsApi.gradeDistribution(params),
        reportsApi.rankList(params),
      ]);
      setClassResults(Array.isArray(cr) ? cr : []);
      setSubjectAnalysis(Array.isArray(sa) ? sa : []);
      setGradeDistribution(Array.isArray(gd) ? gd : []);
      setRankList(Array.isArray(rl) ? rl : []);
    } catch (err) {
      logger.error('Failed to load marks report:', err);
      setError(err);
      toast.error('Failed to load marks report. Refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, [examId, academicYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const classColumns = [
    {
      key: 'className',
      header: 'Class',
      render: (row) => `${row.className} ${row.classSection || ''}`.trim(),
    },
    { key: 'totalStudents', header: 'Students', align: 'center' },
    {
      key: 'passPercentage',
      header: 'Pass %',
      align: 'center',
      render: (row) => `${row.passPercentage}%`,
    },
    {
      key: 'avgPercentage',
      header: 'Avg %',
      align: 'center',
      render: (row) => `${row.avgPercentage}%`,
    },
  ];

  const subjectColumns = [
    { key: '_id', header: 'Subject' },
    { key: 'avgMarks', header: 'Avg Marks', align: 'center' },
    { key: 'highestMarks', header: 'Highest', align: 'center' },
    {
      key: 'passPercentage',
      header: 'Pass %',
      align: 'center',
      render: (row) => `${row.passPercentage}%`,
    },
  ];

  const rankColumns = [
    {
      key: 'rank',
      header: 'Rank',
      render: (_row, idx) => <span className="font-medium">#{idx + 1}</span>,
    },
    {
      key: 'student',
      header: 'Student',
      render: (row) => row.studentId?.name,
    },
    { key: 'totalMarksObtained', header: 'Marks', align: 'center' },
    {
      key: 'percentage',
      header: '%',
      align: 'center',
      render: (row) => `${row.percentage}%`,
    },
    { key: 'grade', header: 'Grade', align: 'center' },
  ];

  return (
    <div className="space-y-6" aria-live="polite" aria-busy={loading ? 'true' : undefined}>
      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Select exam"
          size="sm"
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          wrapperClassName="min-w-[240px]"
        >
          <option value="">Select an exam</option>
          {exams.map((exam) => (
            <option key={exam._id} value={exam._id}>
              {exam.name}
            </option>
          ))}
        </Select>
      </div>

      {!examId ? (
        <EmptyState
          icon={AlertTriangle}
          size="md"
          title="Select an exam to view results"
          description="Choose an exam from the dropdown above."
        />
      ) : loading ? (
        <SkeletonTable rows={6} columns={5} />
      ) : error ? (
        <ErrorState
          description="Could not load marks report."
          error={error}
          onRetry={fetchData}
        />
      ) : (
        <div className="space-y-8">
          {classResults.length > 0 && (
            <section className="space-y-3">
              <SectionHeading size="sm">Class Results</SectionHeading>
              <ReportTable
                columns={classColumns}
                rows={classResults}
                getRowKey={(row, idx) => `${row.className}-${idx}`}
                aria-label="Class results"
              />
            </section>
          )}

          {subjectAnalysis.length > 0 && (
            <section className="space-y-3">
              <SectionHeading size="sm">Subject Analysis</SectionHeading>
              <ReportTable
                columns={subjectColumns}
                rows={subjectAnalysis}
                getRowKey={(row, idx) => `${row._id}-${idx}`}
                aria-label="Subject analysis"
              />
            </section>
          )}

          {gradeDistribution.length > 0 && (
            <section className="space-y-3">
              <SectionHeading size="sm">Grade Distribution</SectionHeading>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {gradeDistribution.map((grade) => (
                  <Card key={grade._id} padding="sm" radius="lg" className="text-center">
                    <p className="text-xl font-bold text-[var(--color-text-primary)]">{grade._id}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{grade.count} students</p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {rankList.length > 0 && (
            <section className="space-y-3">
              <SectionHeading size="sm">Rank List</SectionHeading>
              <ReportTable
                columns={rankColumns}
                rows={rankList}
                getRowKey={(row, idx) => `${row.studentId?._id || idx}`}
                aria-label="Rank list"
              />
            </section>
          )}

          {classResults.length === 0 &&
            subjectAnalysis.length === 0 &&
            gradeDistribution.length === 0 &&
            rankList.length === 0 && (
              <EmptyState
                icon={AlertTriangle}
                size="md"
                title="No marks data for this exam"
                description="Results have not been published yet."
              />
            )}
        </div>
      )}
    </div>
  );
}
