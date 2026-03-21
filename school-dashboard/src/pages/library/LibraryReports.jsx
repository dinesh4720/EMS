import { useState, useEffect } from "react";
import { BookOpen, AlertTriangle, IndianRupee } from "lucide-react";
import { libraryApi } from "../../services/api";
import toast from "react-hot-toast";

const categoryLabels = {
  textbook: "Textbook",
  reference: "Reference",
  fiction: "Fiction",
  "non-fiction": "Non-Fiction",
  periodical: "Periodical",
  digital: "Digital",
  other: "Other",
};

export default function LibraryReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await libraryApi.getReports();
        setReport(data);
      } catch {
        toast.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!report) return null;

  const maxBorrowed = report.mostBorrowed?.[0]?.count || 1;

  return (
    <div className="space-y-6">
      {/* Most Borrowed Books */}
      <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-zinc-900/50">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Most Borrowed Books</h3>
        </div>
        {report.mostBorrowed?.length ? (
          <div className="space-y-3">
            {report.mostBorrowed.map((item, i) => (
              <div key={item._id || i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 dark:text-zinc-500 w-5 text-right">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{item.bookTitle || "Unknown"}</p>
                  <div className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 dark:bg-blue-400"
                      style={{ width: `${(item.count / maxBorrowed) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 w-10 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-zinc-400">No data yet</p>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-zinc-900/50">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">Books by Category</h3>
        {report.categoryStats?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800">
                  <th className="text-left py-2 font-medium text-gray-500 dark:text-zinc-400">Category</th>
                  <th className="text-right py-2 font-medium text-gray-500 dark:text-zinc-400">Books</th>
                  <th className="text-right py-2 font-medium text-gray-500 dark:text-zinc-400">Total Copies</th>
                  <th className="text-right py-2 font-medium text-gray-500 dark:text-zinc-400">Available</th>
                </tr>
              </thead>
              <tbody>
                {report.categoryStats.map((cat) => (
                  <tr key={cat._id} className="border-b border-gray-50 dark:border-zinc-800">
                    <td className="py-2 text-gray-900 dark:text-zinc-100 capitalize">{categoryLabels[cat._id] || cat._id || "Other"}</td>
                    <td className="py-2 text-right text-gray-700 dark:text-zinc-300">{cat.totalBooks}</td>
                    <td className="py-2 text-right text-gray-700 dark:text-zinc-300">{cat.totalCopies}</td>
                    <td className="py-2 text-right text-gray-700 dark:text-zinc-300">{cat.availableCopies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-zinc-400">No data yet</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue by Student */}
        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-zinc-900/50">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Top Overdue Students</h3>
          </div>
          {report.overdueByStudent?.length ? (
            <div className="space-y-2">
              {report.overdueByStudent.map((s, i) => (
                <div key={s._id || i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-zinc-100">{s.studentName || "Unknown"}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{s.admissionNo || ""}</p>
                  </div>
                  <span className="text-sm font-medium bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                    {s.count} books
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-zinc-400">No overdue books</p>
          )}
        </div>

        {/* Unpaid Fines */}
        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-zinc-900/50">
          <div className="flex items-center gap-2 mb-4">
            <IndianRupee size={16} className="text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Unpaid Fines</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">₹{report.unpaidFines?.total?.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{report.unpaidFines?.count || 0} unpaid records</p>
        </div>
      </div>
    </div>
  );
}
