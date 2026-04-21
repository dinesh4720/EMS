import { useState, useEffect, useCallback } from "react";
import { Input, Button, Select, SelectItem, Chip, useDisclosure } from "@heroui/react";
import { Plus, Search, BookOpen, BookUp } from "lucide-react";
import { libraryApi } from "../../services/api";
import toast from "react-hot-toast";
import AddBookModal, { BOOK_CATEGORIES } from "./AddBookModal";
import IssueBookModal from "./IssueBookModal";
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [editBook, setEditBook] = useState(null);
  const [issueBook, setIssueBook] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isIssueOpen, onOpen: onIssueOpen, onClose: onIssueClose } = useDisclosure();

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await libraryApi.getBooks({
        search: search || undefined,
        category: category !== "all" ? category : undefined,
        page,
        limit: 25,
      });
      setBooks(data.books || []);
      setTotal(data.total || 0);
    } catch {
      toast.error(t('toast.error.failedToLoadBooks'));
    } finally {
      setLoading(false);
    }
  }, [search, category, page]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
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
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <Input
            placeholder={t('pages.searchBooks')}
            value={searchInput}
            onValueChange={setSearchInput}
            startContent={<Search size={16} className="text-gray-400 dark:text-zinc-500" />}
            size="sm"
            className="max-w-xs"
          />
          <Select
            selectedKeys={[category]}
            onSelectionChange={(keys) => { setCategory([...keys][0]); setPage(1); }}
            size="sm"
            className="max-w-[180px]"
          >
            {CATEGORIES.map((c) => (
              <SelectItem key={c.key}>{c.label}</SelectItem>
            ))}
          </Select>
        </div>
        <Button size="sm" className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-200" startContent={<Plus size={16} />} onPress={handleAdd}>
          {t('pages.addBook')}
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm dark:shadow-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">{t('pages.title1')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">{t('pages.author')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">{t('pages.category1')}</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">{t('pages.total2')}</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">{t('pages.available')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-zinc-400">{t('pages.iSBN')}</th>
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
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <BookOpen size={40} className="mx-auto text-gray-300 dark:text-zinc-600 mb-3" />
                    <p className="text-gray-500 dark:text-zinc-400">{t('pages.noBooksFound')}</p>
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book._id} className="border-b border-gray-50 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-10 bg-gray-100 dark:bg-zinc-800 rounded flex items-center justify-center flex-shrink-0">
                          <BookOpen size={14} className="text-gray-400 dark:text-zinc-500" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-zinc-100 truncate max-w-[200px]">{book.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">{book.author}</td>
                    <td className="px-4 py-3">
                      <Chip size="sm" variant="flat" className="capitalize">{book.category || "other"}</Chip>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-zinc-300">{book.totalCopies}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={book.availableCopies === 0 ? "text-red-600 dark:text-red-400 font-medium" : "text-green-600 dark:text-green-400 font-medium"}>
                        {book.availableCopies}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-zinc-400">{book.isbn || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        {book.availableCopies > 0 && (
                          <Button size="sm" variant="flat" color="primary" startContent={<BookUp size={13} />} onPress={() => handleIssueBook(book)}>{t('pages.issue1')}</Button>
                        )}
                        <Button size="sm" variant="light" onPress={() => handleEdit(book)}>{t('pages.edit1')}</Button>
                        <Button size="sm" variant="light" color="danger" onPress={() => handleDelete(book._id)}>{t('pages.delete1')}</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-zinc-800">
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.booksTotal', { count: total })}</p>
            <div className="flex gap-1">
              <Button size="sm" variant="flat" isDisabled={page <= 1} onPress={() => setPage(page - 1)}>{t('pages.prev')}</Button>
              <span className="text-sm text-gray-600 dark:text-zinc-400 flex items-center px-2">{page} / {totalPages}</span>
              <Button size="sm" variant="flat" isDisabled={page >= totalPages} onPress={() => setPage(page + 1)}>{t('pages.next')}</Button>
            </div>
          </div>
        )}
      </div>

      <AddBookModal isOpen={isOpen} onClose={() => { onClose(); setEditBook(null); }} book={editBook} onSaved={handleSaved} />
      <IssueBookModal isOpen={isIssueOpen} onClose={() => { onIssueClose(); setIssueBook(null); }} book={issueBook} onSaved={handleIssued} />

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
