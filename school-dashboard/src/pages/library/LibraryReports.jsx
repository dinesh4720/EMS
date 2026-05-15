import { useState, useEffect, useMemo, useCallback } from "react";
import { BookOpen, AlertTriangle, IndianRupee } from "lucide-react";
import { libraryApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { CardGridPageSkeleton } from '../../components/skeletons/PageSkeletons';
import { Card, EmptyState, ErrorState } from '../../components/ui';

export default function LibraryReports() {
  const { t } = useTranslation();
  const categoryLabels = useMemo(() => ({
    textbook: t('constants.library.categories.textbook'),
    reference: t('constants.library.categories.reference'),
    fiction: t('constants.library.categories.fiction'),
    "non-fiction": t('constants.library.categories.nonFiction'),
    periodical: t('constants.library.categories.periodical'),
    digital: t('constants.library.categories.digital'),
    other: t('constants.library.categories.other'),
  }), [t]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await libraryApi.getReports();
      setReport(data);
    } catch (err) {
      setLoadError(err);
      toast.error(t('toast.error.failedToLoadReports'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <CardGridPageSkeleton title={false} cards={3} columns="grid-cols-1" />;

  if (loadError) return <ErrorState error={loadError} onRetry={load} />;

  if (!report) return null;

  const maxBorrowed = report.mostBorrowed?.[0]?.count || 1;

  return (
    <div className="space-y-6">
      <Card padding="md" radius="lg">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-blue-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-fg">{t('pages.mostBorrowedBooks')}</h3>
        </div>
        {report.mostBorrowed?.length ? (
          <div className="space-y-3">
            {report.mostBorrowed.map((item, i) => (
              <div key={item._id || i} className="flex items-center gap-3">
                <span className="text-xs text-fg-faint w-5 text-right">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-fg truncate">{item.bookTitle || "Unknown"}</p>
                  <div className="mt-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 dark:bg-blue-400"
                      style={{ width: `${(item.count / maxBorrowed) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-fg w-10 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState size="sm" icon={BookOpen} title={t('pages.noDataYet')} />
        )}
      </Card>

      <Card padding="md" radius="lg">
        <h3 className="text-sm font-semibold text-fg mb-4">{t('pages.booksByCategory')}</h3>
        {report.categoryStats?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider">
                  <th className="text-left py-2 font-medium text-fg-muted">{t('pages.category1')}</th>
                  <th className="text-right py-2 font-medium text-fg-muted">{t('pages.books')}</th>
                  <th className="text-right py-2 font-medium text-fg-muted">{t('pages.totalCopies')}</th>
                  <th className="text-right py-2 font-medium text-fg-muted">{t('pages.available')}</th>
                </tr>
              </thead>
              <tbody>
                {report.categoryStats.map((cat) => (
                  <tr key={cat._id} className="border-b border-gray-50 dark:border-zinc-800 last:border-0">
                    <td className="py-2 text-fg capitalize">{categoryLabels[cat._id] || cat._id || "Other"}</td>
                    <td className="py-2 text-right text-fg">{cat.totalBooks}</td>
                    <td className="py-2 text-right text-fg">{cat.totalCopies}</td>
                    <td className="py-2 text-right text-fg">{cat.availableCopies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState size="sm" title={t('pages.noDataYet')} />
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md" radius="lg">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-500" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-fg">{t('pages.topOverdueStudents')}</h3>
          </div>
          {report.overdueByStudent?.length ? (
            <div className="space-y-2">
              {report.overdueByStudent.map((student, i) => (
                <div key={student._id || i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm text-fg">{student.studentName || "Unknown"}</p>
                    <p className="text-xs text-fg-muted">{student.admissionNo || ""}</p>
                  </div>
                  <span className="text-xs font-medium bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                    {student.count} books
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState size="sm" icon={AlertTriangle} title={t('pages.noOverdueBooks')} />
          )}
        </Card>

        <Card padding="md" radius="lg">
          <div className="flex items-center gap-2 mb-4">
            <IndianRupee size={16} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-fg">{t('pages.unpaidFines')}</h3>
          </div>
          <p className="text-3xl font-semibold text-fg">₹{report.unpaidFines?.total?.toLocaleString() || 0}</p>
          <p className="text-sm text-fg-muted mt-1">{report.unpaidFines?.count || 0} unpaid records</p>
        </Card>
      </div>
    </div>
  );
}
