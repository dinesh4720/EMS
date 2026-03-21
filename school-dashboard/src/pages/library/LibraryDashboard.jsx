import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, BookUp, AlertTriangle, Clock, BookmarkCheck, IndianRupee } from "lucide-react";
import { libraryApi } from "../../services/api";
import toast from "react-hot-toast";

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
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await libraryApi.getStats();
        setStats(data);
      } catch {
        toast.error("Failed to load library stats");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={BookOpen} label="Total Books" value={stats.totalBooks} color="blue" onClick={() => navigate("/library/books")} />
        <StatCard icon={BookOpen} label="Total Copies" value={stats.totalCopies} color="gray" />
        <StatCard icon={BookmarkCheck} label="Available" value={stats.availableCopies} color="green" />
        <StatCard icon={BookUp} label="Issued" value={stats.issued} color="purple" onClick={() => navigate("/library/issued")} />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} color="red" onClick={() => navigate("/library/issued?status=overdue")} />
        <StatCard icon={Clock} label="Reserved" value={stats.reserved} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock alert */}
        <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-zinc-900/50">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">Low Stock Books</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{stats.lowStock}</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Books with 2 or fewer available copies</p>
        </div>

        {/* Accrued fines */}
        <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-zinc-900/50">
          <div className="flex items-center gap-2 mb-4">
            <IndianRupee size={16} className="text-red-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Total Accrued Fines</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">₹{stats.totalAccruedFines?.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">From currently overdue books</p>
        </div>
      </div>
    </div>
  );
}
