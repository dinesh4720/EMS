import { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, SelectItem, Textarea,
} from "@heroui/react";
import { libraryApi } from "../../services/api";
import toast from "react-hot-toast";

const CATEGORIES = [
  { key: "textbook", label: "Textbook" },
  { key: "reference", label: "Reference" },
  { key: "fiction", label: "Fiction" },
  { key: "non-fiction", label: "Non-Fiction" },
  { key: "periodical", label: "Periodical" },
  { key: "digital", label: "Digital" },
  { key: "other", label: "Other" },
];

const emptyForm = {
  title: "", author: "", isbn: "", publisher: "", publishedYear: "",
  edition: "", category: "textbook", subject: "", language: "",
  description: "", totalCopies: "1", rackNumber: "", shelfNumber: "",
  digitalUrl: "", finePerDay: "", coverImageUrl: "",
};

export default function AddBookModal({ isOpen, onClose, book, onSaved }) {
  const isEdit = !!book;
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (book) {
        setForm({
          title: book.title || "",
          author: book.author || "",
          isbn: book.isbn || "",
          publisher: book.publisher || "",
          publishedYear: book.publishedYear?.toString() || "",
          edition: book.edition || "",
          category: book.category || "textbook",
          subject: book.subject || "",
          language: book.language || "",
          description: book.description || "",
          totalCopies: book.totalCopies?.toString() || "1",
          rackNumber: book.rackNumber || "",
          shelfNumber: book.shelfNumber || "",
          digitalUrl: book.digitalUrl || "",
          finePerDay: book.finePerDay?.toString() || "",
          coverImageUrl: book.coverImageUrl || "",
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [isOpen, book]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.author.trim()) {
      toast.error("Title and author are required");
      return;
    }
    const copies = parseInt(form.totalCopies);
    if (!copies || copies < 1) {
      toast.error("Total copies must be at least 1");
      return;
    }

    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      totalCopies: copies,
    };
    if (form.isbn.trim()) payload.isbn = form.isbn.trim();
    if (form.publisher.trim()) payload.publisher = form.publisher.trim();
    if (form.publishedYear) payload.publishedYear = parseInt(form.publishedYear);
    if (form.edition.trim()) payload.edition = form.edition.trim();
    if (form.category) payload.category = form.category;
    if (form.subject.trim()) payload.subject = form.subject.trim();
    if (form.language.trim()) payload.language = form.language.trim();
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.rackNumber.trim()) payload.rackNumber = form.rackNumber.trim();
    if (form.shelfNumber.trim()) payload.shelfNumber = form.shelfNumber.trim();
    if (form.digitalUrl.trim()) payload.digitalUrl = form.digitalUrl.trim();
    if (form.finePerDay) payload.finePerDay = parseFloat(form.finePerDay);
    if (form.coverImageUrl.trim()) payload.coverImageUrl = form.coverImageUrl.trim();

    try {
      setSaving(true);
      if (isEdit) {
        await libraryApi.updateBook(book._id, payload);
        toast.success("Book updated");
      } else {
        await libraryApi.createBook(payload);
        toast.success("Book added");
      }
      onSaved?.();
    } catch (err) {
      toast.error(err?.message || "Failed to save book");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{isEdit ? "Edit Book" : "Add Book"}</ModalHeader>
        <ModalBody className="gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Title" isRequired value={form.title} onValueChange={(v) => updateField("title", v)} />
            <Input label="Author" isRequired value={form.author} onValueChange={(v) => updateField("author", v)} />
            <Input label="ISBN" value={form.isbn} onValueChange={(v) => updateField("isbn", v)} />
            <Input label="Publisher" value={form.publisher} onValueChange={(v) => updateField("publisher", v)} />
            <Input label="Published Year" type="number" value={form.publishedYear} onValueChange={(v) => updateField("publishedYear", v)} />
            <Input label="Edition" value={form.edition} onValueChange={(v) => updateField("edition", v)} />
            <Select label="Category" selectedKeys={[form.category]} onSelectionChange={(keys) => updateField("category", [...keys][0])}>
              {CATEGORIES.map((c) => <SelectItem key={c.key}>{c.label}</SelectItem>)}
            </Select>
            <Input label="Subject" value={form.subject} onValueChange={(v) => updateField("subject", v)} />
            <Input label="Language" value={form.language} onValueChange={(v) => updateField("language", v)} />
            <Input label="Total Copies" isRequired type="number" min={1} value={form.totalCopies} onValueChange={(v) => updateField("totalCopies", v)} />
            <Input label="Rack Number" value={form.rackNumber} onValueChange={(v) => updateField("rackNumber", v)} />
            <Input label="Shelf Number" value={form.shelfNumber} onValueChange={(v) => updateField("shelfNumber", v)} />
            <Input label="Fine Per Day (₹)" type="number" min={0} value={form.finePerDay} onValueChange={(v) => updateField("finePerDay", v)} />
            <Input label="Cover Image URL" value={form.coverImageUrl} onValueChange={(v) => updateField("coverImageUrl", v)} />
          </div>
          <Input label="Digital URL" value={form.digitalUrl} onValueChange={(v) => updateField("digitalUrl", v)} />
          <Textarea label="Description" value={form.description} onValueChange={(v) => updateField("description", v)} minRows={2} />
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>Cancel</Button>
          <Button className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900" isLoading={saving} onPress={handleSubmit}>
            {isEdit ? "Update" : "Add Book"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
