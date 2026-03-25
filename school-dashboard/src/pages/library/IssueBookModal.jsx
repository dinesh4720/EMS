import { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Textarea,
} from "@heroui/react";
import { libraryApi } from "../../services/api";
import { studentsApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

export default function IssueBookModal({ isOpen, onClose, onSaved }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ bookId: "", studentId: "", dueDate: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [bookSearch, setBookSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      setForm({ bookId: "", studentId: "", dueDate: defaultDueDate(), notes: "" });
      setBookSearch("");
      setStudentSearch("");
      fetchBooks();
      fetchStudents();
    }
  }, [isOpen]);

  function defaultDueDate() {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  }

  const fetchBooks = async (search = "") => {
    try {
      const data = await libraryApi.getBooks({ search, limit: 20 });
      setBooks(data.books || []);
    } catch { /* ignore */ }
  };

  const fetchStudents = async (search = "") => {
    try {
      const data = await studentsApi.getAll({ search, limit: 20 });
      setStudents(data.students || []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const t = setTimeout(() => { if (bookSearch) fetchBooks(bookSearch); }, 300);
    return () => clearTimeout(t);
  }, [bookSearch]);

  useEffect(() => {
    const t = setTimeout(() => { if (studentSearch) fetchStudents(studentSearch); }, 300);
    return () => clearTimeout(t);
  }, [studentSearch]);

  const selectedBook = books.find((b) => b._id === form.bookId);
  const selectedStudent = students.find((s) => s._id === form.studentId);

  const handleSubmit = async () => {
    if (!form.bookId || !form.studentId || !form.dueDate) {
      toast.error(t('toast.error.bookStudentAndDueDateAreRequired'));
      return;
    }

    try {
      setSaving(true);
      await libraryApi.issueBook({
        bookId: form.bookId,
        studentId: form.studentId,
        dueDate: form.dueDate,
        ...(form.notes.trim() && { notes: form.notes.trim() }),
      });
      toast.success(t('toast.success.bookIssuedSuccessfully'));
      onSaved?.();
    } catch (err) {
      toast.error(err?.message || "Failed to issue book");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{t('pages.issueBook')}</ModalHeader>
        <ModalBody className="gap-4">
          {/* Book selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1 block">Book *</label>
            <Input
              placeholder={t('pages.searchBooksByTitleOrIsbn')}
              value={selectedBook ? `${selectedBook.title} (${selectedBook.isbn || "No ISBN"})` : bookSearch}
              onValueChange={(v) => { setBookSearch(v); setForm((f) => ({ ...f, bookId: "" })); }}
              onFocus={() => { if (form.bookId) { setBookSearch(""); setForm((f) => ({ ...f, bookId: "" })); } }}
              size="sm"
            />
            {!form.bookId && books.length > 0 && bookSearch && (
              <div className="border border-gray-200 dark:border-zinc-700 rounded-lg mt-1 max-h-40 overflow-y-auto bg-white dark:bg-zinc-900">
                {books.map((b) => (
                  <button
                    key={b._id}
                    onClick={() => { setForm((f) => ({ ...f, bookId: b._id })); setBookSearch(""); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="font-medium text-gray-900 dark:text-zinc-100">{b.title}</span>
                    <span className="text-gray-500 dark:text-zinc-400 ml-2">({b.availableCopies || 0} available)</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Student selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1 block">Student *</label>
            <Input
              placeholder={t('pages.searchStudentsByNameOrAdmissionNo')}
              value={selectedStudent ? `${selectedStudent.name} (${selectedStudent.admissionNo || ""})` : studentSearch}
              onValueChange={(v) => { setStudentSearch(v); setForm((f) => ({ ...f, studentId: "" })); }}
              onFocus={() => { if (form.studentId) { setStudentSearch(""); setForm((f) => ({ ...f, studentId: "" })); } }}
              size="sm"
            />
            {!form.studentId && students.length > 0 && studentSearch && (
              <div className="border border-gray-200 dark:border-zinc-700 rounded-lg mt-1 max-h-40 overflow-y-auto bg-white dark:bg-zinc-900">
                {students.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => { setForm((f) => ({ ...f, studentId: s._id })); setStudentSearch(""); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="font-medium text-gray-900 dark:text-zinc-100">{s.name}</span>
                    <span className="text-gray-500 dark:text-zinc-400 ml-2">{s.admissionNo || ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Input
            label={t('pages.dueDate')}
            type="date"
            isRequired
            value={form.dueDate}
            onValueChange={(v) => setForm((f) => ({ ...f, dueDate: v }))}
          />

          <Textarea
            label={t('pages.notes1')}
            value={form.notes}
            onValueChange={(v) => setForm((f) => ({ ...f, notes: v }))}
            minRows={2}
            placeholder={t('pages.optionalNotes1')}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>{t('pages.cancel2')}</Button>
          <Button className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900" isLoading={saving} onPress={handleSubmit}>
            Issue Book
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
