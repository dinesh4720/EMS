import { useState, useEffect, useCallback } from "react";
import { Button, Select, SelectItem, Chip, useDisclosure } from "@heroui/react";
import { BookUp, RotateCcw, Printer, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { libraryApi } from "../../services/api";
import toast from "react-hot-toast";
import IssueBookModal from "./IssueBookModal";
import ReturnBookModal from "./ReturnBookModal";
import { getDateLocale } from "../../i18n/index";
import { useTranslation } from "react-i18next";
import {
  EmptyState,
  ErrorState,
  SkeletonTable,
  Button as UIButton,
} from "../../components/ui";
import ExportMenu from "../../components/ui/ExportMenu";
import PrintPreviewModal from "../../components/ui/PrintPreviewModal";
import Input from "../../components/ui/Input";

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
  const [loadError, setLoadError] = useState(null);
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [returnIssue, setReturnIssue] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [printOpen, setPrintOpen] = useState(false);

  const issueModal = useDisclosure();
  const returnModal = useDisclosure();

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const params = { page, limit: 25 };
      if (status === "overdue") params.overdue = "true";
      else if (status !== "all") params.status = status;
      if (search.trim()) params.q = search.trim();
      const data = await libraryApi.getIssues(params);
      setIssues(data.issues || []);
      setTotal(data.total || 0);
    } catch (err) {
      setLoadError(err);
      toast.error(t("toast.error.failedToLoadIssuedBooks"));
    } finally {
      setLoading(false);
    }
  }, [status, page, search, t]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString(getDateLocale(), {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const isOverdue = (issue) => {
    return (
      (issue.status === "issued" || issue.status === "overdue") &&
      new Date(issue.dueDate) < new Date()
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 w-full sm:w-auto flex-wrap">
          <Input
            placeholder="Search student or book…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            startContent={
              <Search size={16} className="text-fg-faint" aria-hidden="true" />
            }
            className="max-w-xs"
            size="sm"
            aria-label="Search issued books by student or book"
          />
          <Select
            selectedKeys={[status]}
            onSelectionChange={(keys) => {
              setStatus([...keys][0]);
              setPage(1);
            }}
            size="sm"
            className="max-w-[180px]"
            aria-label={t("pages.status2")}
          >
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.key}>{opt.label}</SelectItem>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            rows={issues}
            columns={[
              {
                key: "book",
                label: "Book",
                accessor: (i) => i.bookId?.title || i.bookTitle || "—",
              },
              {
                key: "student",
                label: "Student",
                accessor: (i) => i.studentId?.name || i.studentName || "—",
              },
              {
                key: "issueDate",
                label: "Issue Date",
                accessor: (i) =>
                  i.issueDate
                    ? new Date(i.issueDate).toLocaleDateString()
                    : "—",
              },
              {
                key: "dueDate",
                label: "Due Date",
                accessor: (i) =>
                  i.dueDate ? new Date(i.dueDate).toLocaleDateString() : "—",
              },
              { key: "status", label: "Status" },
              {
                key: "fine",
                label: "Fine",
                accessor: (i) => i.accruedFine || i.fineAmount || "—",
              },
            ]}
            filename="issued-books"
            title="Issued Books"
          />
          <UIButton
            variant="outline"
            size="sm"
            icon={<Printer size={14} aria-hidden="true" />}
            onClick={() => setPrintOpen(true)}
            aria-label="Print preview"
          />
          <Button
            size="sm"
            color="primary"
            startContent={<BookUp size={16} />}
            onPress={issueModal.onOpen}
          >
            Issue Book
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonTable rows={6} columns={7} />
      ) : loadError ? (
        <ErrorState error={loadError} onRetry={fetchIssues} />
      ) : issues.length === 0 ? (
        <EmptyState
          icon={BookUp}
          title={t("pages.noIssuedBooksFound")}
          action={
            <Button
              size="sm"
              color="primary"
              startContent={<BookUp size={14} />}
              onPress={issueModal.onOpen}
            >
              Issue Book
            </Button>
          }
        />
      ) : (
        <div className="bg-surface border border-divider rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm"
              aria-label={t("pages.issuedBooks")}
            >
              <thead>
                <tr className="bg-surface-2 border-b border-divider">
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-medium text-fg-muted"
                  >
                    {t("pages.book")}
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-medium text-fg-muted"
                  >
                    {t("pages.student")}
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-medium text-fg-muted"
                  >
                    {t("pages.issueDate")}
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-medium text-fg-muted"
                  >
                    {t("pages.dueDate")}
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-medium text-fg-muted"
                  >
                    {t("pages.status2")}
                  </th>
                  <th
                    scope="col"
                    className="text-right px-4 py-3 font-medium text-fg-muted"
                  >
                    {t("pages.fine")}
                  </th>
                  <th
                    scope="col"
                    className="text-right px-4 py-3 font-medium text-fg-muted"
                  >
                    {t("pages.actions1")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr
                    key={issue._id}
                    className="border-b border-divider last:border-0 hover:bg-surface-2/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-fg truncate max-w-[180px]">
                        {issue.bookId?.title || issue.bookTitle}
                      </p>
                      <p className="text-xs text-fg-muted">
                        {issue.bookId?.isbn || issue.bookIsbn || ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-fg">
                        {issue.studentId?.name || issue.studentName || "—"}
                      </p>
                      <p className="text-xs text-fg-muted">
                        {issue.studentId?.admissionNo ||
                          issue.studentAdmissionNo ||
                          ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-fg-muted">
                      {formatDate(issue.issueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          isOverdue(issue)
                            ? "text-danger-token font-medium"
                            : "text-fg-muted"
                        }
                      >
                        {formatDate(issue.dueDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Chip
                        size="sm"
                        color={statusColor(issue.status)}
                        variant="flat"
                        className="capitalize"
                      >
                        {issue.status}
                      </Chip>
                      {isOverdue(issue) && issue.status === "issued" && (
                        <Chip
                          size="sm"
                          color="danger"
                          variant="flat"
                          className="ml-1"
                        >
                          {t("pages.overdue1")}
                        </Chip>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-fg">
                      {issue.accruedFine || issue.fineAmount
                        ? `₹${issue.accruedFine || issue.fineAmount}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(issue.status === "issued" ||
                        issue.status === "overdue") && (
                        <Button
                          size="sm"
                          variant="flat"
                          color="success"
                          startContent={<RotateCcw size={14} />}
                          onPress={() => handleReturn(issue)}
                          aria-label={t("pages.returnBook")}
                        >
                          Return
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-divider">
              <p className="text-sm text-fg-muted">{total} records total</p>
              <div className="flex gap-1 items-center">
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={page <= 1}
                  onPress={() => setPage(page - 1)}
                >
                  {t("pages.prev")}
                </Button>
                <span className="text-sm text-fg-muted px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={page >= totalPages}
                  onPress={() => setPage(page + 1)}
                >
                  {t("pages.next")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <IssueBookModal
        isOpen={issueModal.isOpen}
        onClose={issueModal.onClose}
        onSaved={handleIssued}
      />
      <ReturnBookModal
        isOpen={returnModal.isOpen}
        onClose={() => {
          returnModal.onClose();
          setReturnIssue(null);
        }}
        issue={returnIssue}
        onSaved={handleReturned}
      />

      <PrintPreviewModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        title="Issued Books"
      >
        <div className="p-6">
          <h1 className="text-lg font-semibold mb-4">Issued Books</h1>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Book</th>
                <th className="text-left py-2 px-3">Student</th>
                <th className="text-left py-2 px-3">Issue Date</th>
                <th className="text-left py-2 px-3">Due Date</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Fine</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue._id} className="border-b">
                  <td className="py-2 px-3">
                    {issue.bookId?.title || issue.bookTitle || "—"}
                  </td>
                  <td className="py-2 px-3">
                    {issue.studentId?.name || issue.studentName || "—"}
                  </td>
                  <td className="py-2 px-3">{formatDate(issue.issueDate)}</td>
                  <td className="py-2 px-3">{formatDate(issue.dueDate)}</td>
                  <td className="py-2 px-3">{issue.status}</td>
                  <td className="py-2 px-3">
                    {issue.accruedFine || issue.fineAmount
                      ? `₹${issue.accruedFine || issue.fineAmount}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PrintPreviewModal>
    </div>
  );
}
