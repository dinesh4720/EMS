import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
  Input,
} from "@heroui/react";
import { Trash2, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { request } from "../../services/api";

const CATEGORY_DEFS = [
  { key: "students", label: "Students", icon: "S", color: "primary" },
  { key: "staff", label: "Staff", icon: "T", color: "secondary" },
  { key: "classes", label: "Classes", icon: "C", color: "success" },
  { key: "attendance", label: "Attendance", icon: "A", color: "warning" },
  { key: "results", label: "Results", icon: "R", color: "danger" },
];

const EMPTY_COUNTS = {
  students: 0,
  staff: 0,
  classes: 0,
  attendance: 0,
  results: 0,
};

export default function DataCleanupSettings() {
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [countsError, setCountsError] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState(null);
  const cancelledRef = useRef(false);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      setCountsError(false);
      const data = await request("/data-cleanup/preview");
      if (cancelledRef.current) return;
      if (data && typeof data === "object" && Object.keys(data).length > 0) {
        setCounts({
          students: data.students ?? 0,
          staff: data.staff ?? 0,
          classes: data.classes ?? 0,
          attendance: data.attendance ?? 0,
          results: data.results ?? 0,
        });
      }
    } catch {
      if (cancelledRef.current) return;
      setCountsError(true);
      setCounts(EMPTY_COUNTS);
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    cancelledRef.current = false;
    fetchCounts();
    return () => { cancelledRef.current = true; };
  }, []);

  const totalSelected = Array.from(selected).reduce(
    (sum, key) => sum + (counts[key] || 0),
    0
  );

  const toggleCategory = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(CATEGORY_DEFS.map((c) => c.key)));
  };

  const handleRemove = () => {
    if (selected.size === 0) {
      toast.error("Please select at least one category");
      return;
    }
    setConfirmText("");
    setIsModalOpen(true);
  };

  const confirmRemove = async () => {
    try {
      setCleaning(true);
      const categories = Array.from(selected);
      const response = await request("/data-cleanup/execute", {
        method: "POST",
        body: JSON.stringify({ categories }),
      });

      const movedTotal =
        response?.moved ||
        categories.reduce((sum, cat) => sum + (counts[cat] || 0), 0);
      const categoryResults = {};
      categories.forEach((cat) => {
        categoryResults[cat] =
          response?.categories?.[cat] || counts[cat] || 0;
      });

      setResult({
        total: movedTotal,
        categories: categoryResults,
      });
      setIsModalOpen(false);
      toast.success("Data moved to trash successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to remove data");
    } finally {
      setCleaning(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-fg">
            Remove All Data
          </h2>
          <p className="text-sm text-fg-muted mt-1">
            Move selected data to trash for 30 days before permanent deletion
          </p>
        </div>

        <Card className="border border-[var(--ok-border)] bg-[var(--ok-bg)]">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[var(--ok-bg)] rounded-full">
                <CheckCircle size={24} className="text-[var(--ok)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--ok)]">
                Moved to Trash!
              </h3>
            </div>
            <p className="text-sm text-fg-muted mb-4">
              {result.total} records have been moved to trash. They will be permanently deleted after 30 days.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(result.categories).map(([cat, count]) => {
                const def = CATEGORY_DEFS.find((c) => c.key === cat);
                return (
                  <div
                    key={cat}
                    className="bg-surface rounded-lg p-4 border border-border-token"
                  >
                    <p className="text-sm text-fg-muted">
                      {def?.label || cat}
                    </p>
                    <p className="text-2xl font-bold text-fg">
                      {count}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Button
          variant="flat"
          color="primary"
          onPress={() => {
            setResult(null);
            setSelected(new Set());
            fetchCounts();
          }}
        >
          Back to Data Cleanup
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-fg">
          Remove All Data
        </h2>
        <p className="text-sm text-fg-muted mt-1">
          Move selected data to trash for 30 days before permanent deletion
        </p>
      </div>

      {/* Error Banner */}
      {countsError && (
        <Card className="border-2 border-[var(--warn-border)] bg-[var(--warn-bg)]">
          <CardBody className="p-4">
            <p className="text-sm text-[var(--warn)] font-medium">
              Failed to load data counts from the server. Counts shown as 0 to prevent accidental deletions. Please refresh the page to try again.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Danger Zone Banner */}
      <Card className="border-2 border-[var(--danger-border)] bg-[var(--danger-bg)]">
        <CardBody className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[var(--danger-bg)] rounded-lg mt-0.5">
              <ShieldAlert size={20} className="text-[var(--danger)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--danger)]">
                Danger Zone
              </h3>
              <p className="text-sm text-[var(--danger)] mt-1">
                This action will move it to Trash where it will be kept for 30 days
                before being permanently deleted. Please make sure you have a backup
                before proceeding.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Select Data Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-fg">
            Select data to remove
          </h3>
          <Button
            size="sm"
            variant="flat"
            onPress={selectAll}
          >
            Select All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_DEFS.map((cat) => {
            const isSelected = selected.has(cat.key);
            const count = counts[cat.key] || 0;
            return (
              <Card
                key={cat.key}
                isPressable
                onPress={() => toggleCategory(cat.key)}
                className={`border transition-all ${
                  isSelected
                    ? "border-[var(--danger-border)] bg-[var(--danger-bg)]"
                    : "border-border-token"
                }`}
              >
                <CardBody className="p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      isSelected={isSelected}
                      onChange={() => toggleCategory(cat.key)}
                      size="sm"
                      aria-label={`Select ${cat.label} (${count} records)`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-fg">
                          {cat.label}
                        </h4>
                        <Chip size="sm" variant="flat" color={cat.color}>
                          {count}
                        </Chip>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Remove Button */}
      <div className="flex justify-end">
        <Button
          color="danger"
          size="lg"
          startContent={<Trash2 size={18} />}
          onPress={handleRemove}
          isDisabled={selected.size === 0 || countsError}
        >
          Remove All Data
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <ModalContent>
          <ModalHeader>Confirm Data Removal</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[var(--danger-bg)] rounded-lg mt-0.5">
                  <AlertTriangle size={20} className="text-[var(--danger)]" />
                </div>
                <div>
                  <p className="text-sm text-fg-muted">
                    You are about to move <strong>{totalSelected}</strong> records
                    to trash across <strong>{selected.size}</strong> categories.
                  </p>
                </div>
              </div>

              <div className="bg-surface-2 rounded-lg p-3">
                <p className="text-sm font-medium text-fg mb-2">
                  Selected for removal:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selected).map((key) => {
                    const def = CATEGORY_DEFS.find((c) => c.key === key);
                    return (
                      <Chip key={key} size="sm" variant="flat" color="danger">
                        {def?.label} ({counts[key]})
                      </Chip>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm text-fg-muted mb-2">
                  Type <strong>REMOVE ALL DATA</strong> to confirm:
                </p>
                <Input
                  placeholder="REMOVE ALL DATA"
                  aria-label="Type REMOVE ALL DATA to confirm"
                  value={confirmText}
                  onValueChange={setConfirmText}
                  variant="bordered"
                  size="sm"
                  classNames={{
                    inputWrapper: "bg-surface",
                  }}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={confirmRemove}
              isLoading={cleaning}
              isDisabled={confirmText !== "REMOVE ALL DATA"}
            >
              Move to Trash
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
