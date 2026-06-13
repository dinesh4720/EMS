import { useState, useEffect, useId } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Textarea,
} from "@heroui/react";
import { libraryApi } from "../../services/api";
import { studentsApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

export default function IssueBookModal({ isOpen, onClose, onSaved, book: preselectedBook }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ bookId: "", studentId: "", dueDate: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [bookSearch, setBookSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  // Persist the selected student object so the input doesn't blank out after selection
  const [selectedStudentObj, setSelectedStudentObj] = useState(null);

  // Active option index for keyboard navigation of suggestion lists
  const [activeBookIndex, setActiveBookIndex] = useState(-1);
  const [activeStudentIndex, setActiveStudentIndex] = useState(-1);

  const bookInputId = useId();
  const bookListboxId = `${bookInputId}-listbox`;
  const studentInputId = useId();
  const studentListboxId = `${studentInputId}-listbox`;

  const showBookList = !form.bookId && books.length > 0 && bookSearch;
  const showStudentList = !form.studentId && students.length > 0 && studentSearch;

  useEffect(() => {
    if (isOpen) {
      setForm({ bookId: preselectedBook?._id || "", studentId: "", dueDate: defaultDueDate(), notes: "" });
      setBookSearch("");
      setStudentSearch("");
      setSelectedStudentObj(null);
      setActiveBookIndex(-1);
      setActiveStudentIndex(-1);
      if (!preselectedBook) fetchBooks();
      fetchStudents();
    }
  }, [isOpen, preselectedBook]);

  function defaultDueDate() {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  }

  const fetchBooks = async (search = "") => {
    try {
      const data = await libraryApi.getBooks({ search, limit: 20 });
      setBooks(data.books || []);
      setActiveBookIndex(-1);
    } catch { /* ignore */ }
  };

  const fetchStudents = async (search = "") => {
    try {
      const data = await studentsApi.getAll({ search, limit: 20 });
      setStudents(data.students || []);
      setActiveStudentIndex(-1);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!bookSearch) { setBooks([]); return; }
    const timer = setTimeout(() => fetchBooks(bookSearch), 300);
    return () => clearTimeout(timer);
  }, [bookSearch]);

  useEffect(() => {
    if (!studentSearch) { setStudents([]); return; }
    const timer = setTimeout(() => fetchStudents(studentSearch), 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  const selectedBook = books.find((b) => b._id === form.bookId);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
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

  const handleBookKeyDown = (e) => {
    if (!showBookList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveBookIndex((prev) => Math.min(prev + 1, books.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveBookIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeBookIndex >= 0) {
      e.preventDefault();
      const b = books[activeBookIndex];
      if (b) { setForm((f) => ({ ...f, bookId: b._id })); setBookSearch(""); }
    } else if (e.key === "Escape") {
      setBooks([]);
    }
  };

  const handleStudentKeyDown = (e) => {
    if (!showStudentList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveStudentIndex((prev) => Math.min(prev + 1, students.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveStudentIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeStudentIndex >= 0) {
      e.preventDefault();
      const s = students[activeStudentIndex];
      if (s) { setSelectedStudentObj(s); setForm((f) => ({ ...f, studentId: s._id })); setStudentSearch(""); }
    } else if (e.key === "Escape") {
      setStudents([]);
    }
  };

  const activeBookDescendant =
    showBookList && activeBookIndex >= 0 ? `${bookListboxId}-option-${activeBookIndex}` : undefined;
  const activeStudentDescendant =
    showStudentList && activeStudentIndex >= 0 ? `${studentListboxId}-option-${activeStudentIndex}` : undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{t('pages.issueBook')}</ModalHeader>
        <ModalBody className="gap-4">
          {/* Book selector */}
          <div>
            <label htmlFor={bookInputId} className="text-sm font-medium text-fg mb-1 block">Book *</label>
            {preselectedBook ? (
              <Input
                id={bookInputId}
                value={`${preselectedBook.title} (${preselectedBook.isbn || "No ISBN"})`}
                isReadOnly
                size="sm"
                aria-label="Selected book"
              />
            ) : (
              <>
                <Input
                  id={bookInputId}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={showBookList}
                  aria-haspopup="listbox"
                  aria-controls={bookListboxId}
                  aria-activedescendant={activeBookDescendant}
                  placeholder={t('pages.searchBooksByTitleOrIsbn')}
                  value={selectedBook ? `${selectedBook.title} (${selectedBook.isbn || "No ISBN"})` : bookSearch}
                  onValueChange={(v) => { setBookSearch(v); setForm((f) => ({ ...f, bookId: "" })); }}
                  onFocus={() => { if (form.bookId) { setBookSearch(""); setForm((f) => ({ ...f, bookId: "" })); } }}
                  onKeyDown={handleBookKeyDown}
                  size="sm"
                />
                {showBookList && (
                  <div
                    id={bookListboxId}
                    role="listbox"
                    aria-label="Book suggestions"
                    className="border border-border-token rounded-lg mt-1 max-h-40 overflow-y-auto bg-surface"
                  >
                    {books.map((b, idx) => (
                      <button
                        key={b._id}
                        id={`${bookListboxId}-option-${idx}`}
                        type="button"
                        role="option"
                        aria-selected={form.bookId === b._id}
                        onClick={() => { setForm((f) => ({ ...f, bookId: b._id })); setBookSearch(""); }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          idx === activeBookIndex ? "bg-surface-2" : "hover:bg-surface-2"
                        }`}
                      >
                        <span className="font-medium text-fg">{b.title}</span>
                        <span className="text-fg-muted ml-2">({b.availableCopies || 0} available)</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Student selector */}
          <div>
            <label htmlFor={studentInputId} className="text-sm font-medium text-fg mb-1 block">Student *</label>
            <Input
              id={studentInputId}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showStudentList}
              aria-haspopup="listbox"
              aria-controls={studentListboxId}
              aria-activedescendant={activeStudentDescendant}
              placeholder={t('pages.searchStudentsByNameOrAdmissionNo')}
              value={selectedStudentObj ? `${selectedStudentObj.name} (${selectedStudentObj.admissionNo || ""})` : studentSearch}
              onValueChange={(v) => { setStudentSearch(v); setSelectedStudentObj(null); setForm((f) => ({ ...f, studentId: "" })); }}
              onFocus={() => { if (form.studentId) { setStudentSearch(""); setSelectedStudentObj(null); setForm((f) => ({ ...f, studentId: "" })); } }}
              onKeyDown={handleStudentKeyDown}
              size="sm"
            />
            {showStudentList && (
              <div
                id={studentListboxId}
                role="listbox"
                aria-label="Student suggestions"
                className="border border-border-token rounded-lg mt-1 max-h-40 overflow-y-auto bg-surface"
              >
                {students.map((s, idx) => (
                  <button
                    key={s._id}
                    id={`${studentListboxId}-option-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={form.studentId === s._id}
                    onClick={() => { setSelectedStudentObj(s); setForm((f) => ({ ...f, studentId: s._id })); setStudentSearch(""); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      idx === activeStudentIndex ? "bg-surface-2" : "hover:bg-surface-2"
                    }`}
                  >
                    <span className="font-medium text-fg">{s.name}</span>
                    <span className="text-fg-muted ml-2">{s.admissionNo || ""}</span>
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
          <Button color="primary" isLoading={saving} onPress={handleSubmit}>
            Issue Book
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
