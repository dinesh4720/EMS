import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, BookUp, AlertTriangle, Clock, BookmarkCheck, IndianRupee } from "lucide-react";
import { libraryApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { CardGridPageSkeleton } from '../../components/skeletons/PageSkeletons';

function StatCard({ icon: Icon, label, value, color, onClick }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    gray: "bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400",
  };

  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-zinc-900/50 text-left hover:shadow-md transition-shadow w-full"
    >
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-zinc-400">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">{value}</p>
        </div>
      </div>
    </button>
  );
}

export default function LibraryDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [mostBorrowed, setMostBorrowed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [statsData, reportsData] = await Promise.all([
          libraryApi.getStats(),
          libraryApi.getReports(),
        ]);
        setStats(statsData);
        setMostBorrowed(reportsData.mostBorrowed || []);
      } catch (error) {
        console.error('Failed to load library stats:', error);
        toast.error(t('toast.error.failedToLoadLibraryStats'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <CardGridPageSkeleton cards={6} columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-6" />;

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={BookOpen} label={t('pages.totalBooks')} value={stats.totalBooks} color="blue" onClick={() => navigate("/library/books")} />
        <StatCard icon={BookOpen} label={t('pages.totalCopies')} value={stats.totalCopies} color="gray" />
        <StatCard icon={BookmarkCheck} label={t('pages.available')} value={stats.availableCopies} color="green" />
        <StatCard icon={BookUp} label={t('pages.issued')} value={stats.issued} color="purple" onClick={() => navigate("/library/issued")} />
        <StatCard icon={AlertTriangle} label={t('pages.overdue1')} value={stats.overdue} color="red" onClick={() => navigate("/library/issued?status=overdue")} />
        <StatCard icon={Clock} label={t('pages.reserved')} value={stats.reserved} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock alert */}
        <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-zinc-900/50">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">{t('pages.lowStockBooks')}</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{stats.lowStock}</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('pages.booksWith2OrFewerAvailableCopies')}</p>
        </div>

        {/* Accrued fines */}
        <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-zinc-900/50">
          <div className="flex items-center gap-2 mb-4">
            <IndianRupee size={16} className="text-red-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.totalAccruedFines')}</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">₹{stats.totalAccruedFines?.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('pages.fromCurrentlyOverdueBooks')}</p>
        </div>
      </div>

      {/* Most borrowed books */}
      <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-zinc-900/50">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">{t('pages.mostBorrowedBooks')}</h3>
        {mostBorrowed.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-zinc-500">{t('pages.noCirculationDataYet')}</p>
        ) : (
          <ol className="space-y-2">
            {mostBorrowed.slice(0, 5).map((book, index) => (
              <li key={book._id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-medium text-gray-400 dark:text-zinc-500 w-4 shrink-0">{index + 1}</span>
                  <span className="text-sm text-gray-800 dark:text-zinc-200 truncate">{book.bookTitle}</span>
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0">{book.count}x</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
