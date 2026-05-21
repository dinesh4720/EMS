import { useState, useEffect, useCallback } from "react";
import { BookOpen, BookUp, AlertTriangle, Clock, BookmarkCheck, IndianRupee } from "lucide-react";
import { libraryApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { CardGridPageSkeleton } from '../../components/skeletons/PageSkeletons';
import { Card, StatCard, ErrorState, EmptyState } from '../../components/ui';

export default function LibraryDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [mostBorrowed, setMostBorrowed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [statsData, reportsData] = await Promise.all([
        libraryApi.getStats(),
        libraryApi.getReports(),
      ]);
      setStats(statsData);
      setMostBorrowed(reportsData.mostBorrowed || []);
    } catch (error) {
      setLoadError(error);
      toast.error(t('toast.error.failedToLoadLibraryStats'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <CardGridPageSkeleton cards={6} columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-6" />;
  }

  if (loadError) {
    return <ErrorState error={loadError} onRetry={load} />;
  }

  if (!stats) return null;

  const maxBorrowed = mostBorrowed[0]?.count || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={BookOpen} label={t('pages.totalBooks')} value={stats.totalBooks} color="blue" href="/library/books" />
        <StatCard icon={BookOpen} label={t('pages.totalCopies')} value={stats.totalCopies} color="gray" />
        <StatCard icon={BookmarkCheck} label={t('pages.available')} value={stats.availableCopies} color="green" />
        <StatCard icon={BookUp} label={t('pages.issued')} value={stats.issued} color="purple" href="/library/issued" />
        <StatCard icon={AlertTriangle} label={t('pages.overdue1')} value={stats.overdue} color="red" href="/library/issued?status=overdue" />
        <StatCard icon={Clock} label={t('pages.reserved')} value={stats.reserved} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md" radius="lg">
          <h3 className="text-sm font-semibold text-fg mb-4">{t('pages.lowStockBooks')}</h3>
          <p className="text-3xl font-semibold text-fg">{stats.lowStock}</p>
          <p className="text-sm text-fg-muted mt-1">{t('pages.booksWith2OrFewerAvailableCopies')}</p>
        </Card>

        <Card padding="md" radius="lg">
          <div className="flex items-center gap-2 mb-4">
            <IndianRupee size={16} className="text-danger-token" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-fg">{t('pages.totalAccruedFines')}</h3>
          </div>
          <p className="text-3xl font-semibold text-fg">₹{stats.totalAccruedFines?.toLocaleString() || 0}</p>
          <p className="text-sm text-fg-muted mt-1">{t('pages.fromCurrentlyOverdueBooks')}</p>
        </Card>
      </div>

      <Card padding="md" radius="lg">
        <h3 className="text-sm font-semibold text-fg mb-4">{t('pages.mostBorrowedBooks')}</h3>
        {mostBorrowed.length === 0 ? (
          <EmptyState size="sm" icon={BookOpen} title={t('pages.noCirculationDataYet')} />
        ) : (
          <ol className="space-y-3">
            {mostBorrowed.slice(0, 5).map((book, index) => (
              <li key={book._id} className="flex items-center gap-3">
                <span className="text-xs font-medium text-fg-faint w-5 text-right shrink-0">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-fg truncate">{book.bookTitle}</p>
                  <div className="mt-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-info-token"
                      style={{ width: `${(book.count / maxBorrowed) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-semibold text-info-token shrink-0">{book.count}x</span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
