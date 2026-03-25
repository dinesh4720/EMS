import { useState, useEffect, useCallback } from "react";
import { Button, Select, SelectItem, Chip, useDisclosure } from "@heroui/react";
import { BookUp, RotateCcw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { libraryApi } from "../../services/api";
import toast from "react-hot-toast";
import IssueBookModal from "./IssueBookModal";
import ReturnBookModal from "./ReturnBookModal";
import { getDateLocale } from '../../i18n/index';
import { useTranslation } from 'react-i18next';


const STATUS_OPTIONS = [
  { key: "all", label: "All Statuses" },
  { key: "issued", label: "Issued" },
  { key: "overdue", label: "Overdue" },
  { key: "returned", label: "Returned" },
  { key: "reserved", label: "Reserved" },
];

function statusColor(status) {
  const map = {
    issued: "primary",
    overdue: "danger",
    returned: "success",
    reserved: "warning",
    cancelled: "default",
  };
  return map[status] || "default";
}

export default function IssuedBooksList() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  const [issues, setIssues] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [returnIssue, setReturnIssue] = useState(null);

  const issueModal = useDisclosure();
  const returnModal = useDisclosure();

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 25 };
      if (status === "overdue") params.overdue = "true";
      else if (status !== "all") params.status = status;
      const data = await libraryApi.getIssues(params);
      setIssues(data.issues || []);
      setTotal(data.total || 0);
    } catch {
      toast.error(t('toast.error.failedToLoadIssuedBooks'));
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    let cancelled = false;
    const params = { page, limit: 25 };
    if (status === "overdue") params.overdue = "true";
    else if (status !== "all") params.status = status;

    setLoading(true);
    libraryApi.getIssues(params)
      .then(data => {
        if (!cancelled) {
          setIssues(data.issues || []);
          setTotal(data.total || 0);
        }
      })
      .catch(() => { if (!cancelled) toast.error(t('toast.error.failedToLoadIssuedBooks')); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [status, page]);

  const handleReturn = (issue) => {
    setReturnIssue(issue);
    returnModal.onOpen();
  };

  const handleReturned = () => {
    returnModal.onClose();
    setReturnIssue(null);
    fetchIssues();
  };

  const handleIssued = () => {
    issueModal.onClose();
    fetchIssues();
  };

  const totalPages = Math.ceil(total / 25);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString(getDateLocale(), { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const isOverdue = (issue) => {
    return (issue.status === "issued" || issue.status === "overdue") && new Date(issue.dueDate) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Select
          selectedKeys={[status]}
          onSelectionChange={(keys) => { setStatus([...keys][0]); setPage(1); }}
          size="sm"
          className="max-w-[180px]"
        >
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s.key}>{s.label}</SelectItem>
          ))}
        </Select>
        <Button size="sm" className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-200" startContent={<BookUp size={16} />} onPress={issueModal.onOpen}>
          Issue Book
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm dark:shadow-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">{t('pages.book')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">{t('pages.student')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">{t('pages.issueDate')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">{t('pages.dueDate')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">{t('pages.status2')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">{t('pages.fine')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">{t('pages.actions1')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-zinc-800 animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <BookUp size={40} className="mx-auto text-gray-300 dark:text-zinc-600 mb-3" />
                    <p className="text-gray-500 dark:text-zinc-400">{t('pages.noIssuedBooksFound')}</p>
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue._id} className="border-b border-gray-50 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-zinc-100 truncate max-w-[180px]">{issue.bookId?.title || issue.bookTitle}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{issue.bookId?.isbn || issue.bookIsbn || ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 dark:text-zinc-300">{issue.studentId?.name || "—"}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{issue.studentId?.admissionNo || ""}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{formatDate(issue.issueDate)}</td>
                    <td className="px-4 py-3">
                      <span className={isOverdue(issue) ? "text-red-600 dark:text-red-400 font-medium" : "text-gray-600 dark:text-zinc-400"}>
                        {formatDate(issue.dueDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Chip size="sm" color={statusColor(issue.status)} variant="flat" className="capitalize">{issue.status}</Chip>
                      {isOverdue(issue) && issue.status === "issued" && (
                        <Chip size="sm" color="danger" variant="flat" className="ml-1 bg-red-50 dark:bg-red-950">{t('pages.overdue1')}</Chip>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-zinc-300">
                      {(issue.accruedFine || issue.fineAmount) ? `₹${issue.accruedFine || issue.fineAmount}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(issue.status === "issued" || issue.status === "overdue") && (
                        <Button size="sm" variant="flat" color="success" startContent={<RotateCcw size={14} />} onPress={() => handleReturn(issue)}>
                          Return
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-zinc-800">
            <p className="text-sm text-gray-500 dark:text-zinc-400">{total} records total</p>
            <div className="flex gap-1">
              <Button size="sm" variant="flat" isDisabled={page <= 1} onPress={() => setPage(page - 1)}>{t('pages.prev')}</Button>
              <span className="text-sm text-gray-600 dark:text-zinc-400 flex items-center px-2">{page} / {totalPages}</span>
              <Button size="sm" variant="flat" isDisabled={page >= totalPages} onPress={() => setPage(page + 1)}>{t('pages.next')}</Button>
            </div>
          </div>
        )}
      </div>

      <IssueBookModal isOpen={issueModal.isOpen} onClose={issueModal.onClose} onSaved={handleIssued} />
      <ReturnBookModal isOpen={returnModal.isOpen} onClose={() => { returnModal.onClose(); setReturnIssue(null); }} issue={returnIssue} onSaved={handleReturned} />
    </div>
  );
}
