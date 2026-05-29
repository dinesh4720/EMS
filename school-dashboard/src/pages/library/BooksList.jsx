import { useState, useEffect, useCallback, useMemo } from "react";
import { Input, Button, Select, SelectItem, Chip, useDisclosure } from "@heroui/react";
import { Plus, Search, BookOpen, BookUp, Printer } from "lucide-react";
import { libraryApi } from "../../services/api";
import toast from "react-hot-toast";
import AddBookModal, { BOOK_CATEGORIES } from "./AddBookModal";
import IssueBookModal from "./IssueBookModal";
import { useTranslation } from 'react-i18next';
import { ConfirmDialog, EmptyState, ErrorState, SkeletonTable } from '../../components/ui';
import ExportMenu from '../../components/ui/ExportMenu';
import PrintPreviewModal from '../../components/ui/PrintPreviewModal';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const CATEGORIES = [
  { key: "all", label: "All Categories" },
  ...BOOK_CATEGORIES,
];

export default function BooksList() {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [printOpen, setPrintOpen] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [issueBook, setIssueBook] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isIssueOpen, onOpen: onIssueOpen, onClose: onIssueClose } = useDisclosure();

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await libraryApi.getBooks({
        search: search || undefined,
        category: category !== "all" ? category : undefined,
        page,
        limit: 25,
      });
      setBooks(data.books || []);
      setTotal(data.total || 0);
    } catch (err) {
      setLoadError(err);
      toast.error(t('toast.error.failedToLoadBooks'));
    } finally {
      setLoading(false);
    }
  }, [search, category, page, t]);

  const authors = useMemo(() => {
    const set = new Set(books.map((b) => b.author).filter(Boolean));
    return [...set].sort();
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      if (authorFilter !== "all" && b.author !== authorFilter) return false;
      if (availabilityFilter === "available" && b.availableCopies <= 0) return false;
      if (availabilityFilter === "out-of-stock" && b.availableCopies > 0) return false;
      return true;
    });
  }, [books, authorFilter, availabilityFilter]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Book',
      message: t('confirm.deleteBook'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await libraryApi.deleteBook(id);
          toast.success(t('toast.success.bookDeleted'));
          fetchBooks();
        } catch (err) {
          toast.error(err.message || "Failed to delete");
        }
      },
    });
  };

  const handleEdit = (book) => {
    setEditBook(book);
    onOpen();
  };

  const handleAdd = () => {
    setEditBook(null);
    onOpen();
  };

  const handleSaved = () => {
    onClose();
    setEditBook(null);
    fetchBooks();
  };

  const handleIssueBook = (book) => {
    setIssueBook(book);
    onIssueOpen();
  };

  const handleIssued = () => {
    onIssueClose();
    setIssueBook(null);
    fetchBooks();
  };

  const totalPages = Math.ceil(total / 25);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 w-full sm:w-auto flex-wrap">
          <Input
            placeholder={t('pages.searchBooks')}
            value={searchInput}
            onValueChange={setSearchInput}
            startContent={<Search size={16} className="text-fg-faint" aria-hidden="true" />}
            size="sm"
            className="max-w-xs"
            aria-label={t('pages.searchBooks')}
          />
          <Select
            selectedKeys={[category]}
            onSelectionChange={(keys) => { setCategory([...keys][0]); setPage(1); }}
            size="sm"
            className="max-w-[180px]"
            aria-label={t('pages.category1')}
          >
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.key}>{cat.label}</SelectItem>
            ))}
          </Select>
          <Select
            selectedKeys={[authorFilter]}
            onSelectionChange={(keys) => { setAuthorFilter([...keys][0]); setPage(1); }}
            size="sm"
            className="max-w-[180px]"
            aria-label="Filter by author"
          >
            <SelectItem key="all">All Authors</SelectItem>
            {authors.map((a) => (
              <SelectItem key={a}>{a}</SelectItem>
            ))}
          </Select>
          <Select
            selectedKeys={[availabilityFilter]}
            onSelectionChange={(keys) => { setAvailabilityFilter([...keys][0]); setPage(1); }}
            size="sm"
            className="max-w-[180px]"
            aria-label="Filter by availability"
          >
            <SelectItem key="all">All Availability</SelectItem>
            <SelectItem key="available">Available</SelectItem>
            <SelectItem key="out-of-stock">Out of Stock</SelectItem>
          </Select>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            rows={filteredBooks}
            columns={[
              { key: "title", label: "Title" },
              { key: "author", label: "Author" },
              { key: "category", label: "Category" },
              { key: "totalCopies", label: "Total Copies" },
              { key: "availableCopies", label: "Available" },
              { key: "isbn", label: "ISBN" },
            ]}
            filename="books-catalog"
            title="Books Catalog"
          />
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setPrintOpen(true)}
            aria-label="Print preview"
          >
            <Printer size={14} aria-hidden />
          </button>
          <Button size="sm" color="primary" startContent={<Plus size={16} />} onPress={handleAdd}>
            {t('pages.addBook')}
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonTable rows={6} columns={7} />
      ) : loadError ? (
        <ErrorState error={loadError} onRetry={fetchBooks} />
      ) : filteredBooks.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t('pages.noBooksFound')}
          action={
            <Button size="sm" color="primary" startContent={<Plus size={14} />} onPress={handleAdd}>
              {t('pages.addBook')}
            </Button>
          }
        />
      ) : (
        <div className="bg-surface border border-divider rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="listbox" aria-label={t('pages.books')}>
              <thead>
                <tr className="bg-surface-2 border-b border-divider">
                  <th scope="col" className="text-left px-4 py-3 font-medium text-fg-muted">{t('pages.title1')}</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-fg-muted">{t('pages.author')}</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-fg-muted">{t('pages.category1')}</th>
                  <th scope="col" className="text-center px-4 py-3 font-medium text-fg-muted">{t('pages.total2')}</th>
                  <th scope="col" className="text-center px-4 py-3 font-medium text-fg-muted">{t('pages.available')}</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-fg-muted">{t('pages.iSBN')}</th>
                  <th scope="col" className="text-right px-4 py-3 font-medium text-fg-muted">{t('pages.actions1')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr key={book._id} className="border-b border-divider last:border-0 hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-10 bg-surface-2 rounded flex items-center justify-center flex-shrink-0">
                          <BookOpen size={14} className="text-fg-faint" aria-hidden="true" />
                        </div>
                        <span className="font-medium text-fg truncate max-w-[200px]">{book.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-fg">{book.author}</td>
                    <td className="px-4 py-3">
                      <Chip size="sm" variant="flat" className="capitalize">{book.category || "other"}</Chip>
                    </td>
                    <td className="px-4 py-3 text-center text-fg">{book.totalCopies}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={book.availableCopies === 0 ? "text-danger-token font-medium" : "text-ok font-medium"}>
                        {book.availableCopies}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-fg-muted">{book.isbn || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        {book.availableCopies > 0 && (
                          <Button size="sm" variant="flat" color="primary" startContent={<BookUp size={13} />} onPress={() => handleIssueBook(book)}>{t('pages.issue1')}</Button>
                        )}
                        <Button size="sm" variant="light" onPress={() => handleEdit(book)} aria-label={t('pages.edit1')}>{t('pages.edit1')}</Button>
                        <Button size="sm" variant="light" color="danger" onPress={() => handleDelete(book._id)} aria-label={t('pages.delete1')}>{t('pages.delete1')}</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(totalPages > 1 || authorFilter !== "all" || availabilityFilter !== "all") && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-divider">
              <p className="text-sm text-fg-muted">{filteredBooks.length} of {total} books</p>
              <div className="flex gap-1 items-center">
                <Button size="sm" variant="flat" isDisabled={page <= 1} onPress={() => setPage(page - 1)}>{t('pages.prev')}</Button>
                <span className="text-sm text-fg-muted px-2">{page} / {totalPages}</span>
                <Button size="sm" variant="flat" isDisabled={page >= totalPages} onPress={() => setPage(page + 1)}>{t('pages.next')}</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <AddBookModal isOpen={isOpen} onClose={() => { onClose(); setEditBook(null); }} book={editBook} onSaved={handleSaved} />
      <IssueBookModal isOpen={isIssueOpen} onClose={() => { onIssueClose(); setIssueBook(null); }} book={issueBook} onSaved={handleIssued} />

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />

      <PrintPreviewModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        title="Books Catalog"
      >
        <div className="p-6">
          <h1 className="text-lg font-semibold mb-4">Books Catalog</h1>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Title</th>
                <th className="text-left py-2 px-3">Author</th>
                <th className="text-left py-2 px-3">Category</th>
                <th className="text-left py-2 px-3">Total Copies</th>
                <th className="text-left py-2 px-3">Available</th>
                <th className="text-left py-2 px-3">ISBN</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => (
                <tr key={book._id} className="border-b">
                  <td className="py-2 px-3">{book.title}</td>
                  <td className="py-2 px-3">{book.author}</td>
                  <td className="py-2 px-3">{book.category || "other"}</td>
                  <td className="py-2 px-3">{book.totalCopies}</td>
                  <td className="py-2 px-3">{book.availableCopies}</td>
                  <td className="py-2 px-3">{book.isbn || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PrintPreviewModal>
    </div>
  );
}
