import { useState } from "react";
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
} from "@heroui/react";
import { Zap, Users, GraduationCap, UserCheck, CalendarCheck, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { request } from "../../services/api";

const CATEGORIES = [
  {
    key: "staff",
    label: "Staff",
    icon: UserCheck,
    description: "Generate teaching and non-teaching staff",
    color: "secondary",
    dependency: null,
  },
  {
    key: "classes",
    label: "Classes",
    icon: GraduationCap,
    description: "Generate classes with sections",
    color: "success",
    dependency: null,
  },
  {
    key: "students",
    label: "Students",
    icon: Users,
    description: "Generate student records with guardians",
    color: "primary",
    dependency: "classes",
    dependencyLabel: "Requires Classes",
  },
  {
    key: "attendance",
    label: "Attendance",
    icon: CalendarCheck,
    description: "Generate attendance records",
    color: "warning",
    dependency: "students",
    dependencyLabel: "Requires Students",
  },
];

export default function SeedDataSettings() {
  const [selected, setSelected] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

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
    setSelected(new Set(CATEGORIES.map((c) => c.key)));
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

  const handleGenerate = () => {
    if (selected.size === 0) {
      toast.error("Please select at least one category");
      return;
    }
    setIsModalOpen(true);
  };

  const confirmGenerate = async () => {
    try {
      setGenerating(true);
      const categories = Array.from(selected);
      const response = await request("/seed/generate", {
        method: "POST",
        body: JSON.stringify({ categories }),
      });

      // Build result from response
      const counts = response?.counts || response?.categories || {};
      const resultData = {
        total: 0,
        categories: {},
      };

      categories.forEach((cat) => {
        const count = counts[cat] ?? 0;
        resultData.categories[cat] = count;
        resultData.total += count;
      });

      setResult(resultData);
      setIsModalOpen(false);
      toast.success("Data generated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to generate data");
    } finally {
      setGenerating(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-fg">
            Generate Dummy Data
          </h2>
          <p className="text-sm text-fg-muted mt-1">
            Populate your school with realistic sample data
          </p>
        </div>

        <Card className="border border-[var(--ok-border)] bg-[var(--ok-bg)]">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[var(--ok-bg)] rounded-full">
                <CheckCircle size={24} className="text-[var(--ok)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--ok)]">
                Data Generated Successfully!
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {Object.entries(result.categories).map(([cat, count]) => {
                const category = CATEGORIES.find((c) => c.key === cat);
                const label = category ? category.label : cat;
                return (
                  <div
                    key={cat}
                    className="bg-surface rounded-lg p-4 border border-border-token"
                  >
                    <p className="text-sm text-fg-muted">
                      {label}
                    </p>
                    <p className="text-2xl font-bold text-fg">
                      {count}
                    </p>
                    <p className="text-xs text-[var(--ok)] mt-1">
                      Created
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
          onPress={() => setResult(null)}
        >
          Generate More Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-fg">
          Generate Dummy Data
        </h2>
        <p className="text-sm text-fg-muted mt-1">
          Populate your school with realistic sample data
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="flat"
          onPress={selectAll}
        >
          Select All
        </Button>
        <Button
          size="sm"
          variant="flat"
          onPress={deselectAll}
        >
          Deselect All
        </Button>
        <div className="flex-1" />
        <Chip size="sm" variant="flat" color="primary">
          {selected.size} selected
        </Chip>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selected.has(cat.key);
          return (
            <Card
              key={cat.key}
              isPressable
              onPress={() => toggleCategory(cat.key)}
              className={`border transition-all ${
                isSelected
                  ? "border-[var(--accent-border)] bg-[var(--accent-bg)]"
                  : "border-border-token"
              }`}
            >
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    isSelected={isSelected}
                    onChange={() => toggleCategory(cat.key)}
                    size="sm"
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon size={18} className="text-fg-muted" />
                      <h4 className="font-medium text-fg">
                        {cat.label}
                      </h4>
                    </div>
                    <p className="text-sm text-fg-muted mt-1">
                      {cat.description}
                    </p>
                    {cat.dependencyLabel && (
                      <Chip
                        size="sm"
                        variant="flat"
                        color="warning"
                        className="mt-2"
                      >
                        {cat.dependencyLabel}
                      </Chip>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button
          color="primary"
          size="lg"
          startContent={<Zap size={18} />}
          onPress={handleGenerate}
          isDisabled={selected.size === 0}
        >
          Generate All Dummy Data
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <ModalContent>
          <ModalHeader>Confirm Data Generation</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-fg-muted">
                This will generate realistic dummy data for the selected categories.
              </p>
              <div className="bg-[var(--info-bg)] border border-[var(--info-border)] rounded-lg p-3">
                <p className="text-sm text-[var(--info)]">
                  Data will be generated with realistic Indian names, phone numbers,
                  and addresses. This is ideal for demos and testing.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-fg mb-2">
                  Selected categories:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selected).map((key) => {
                    const cat = CATEGORIES.find((c) => c.key === key);
                    return (
                      <Chip key={key} size="sm" variant="flat" color="primary">
                        {cat?.label || key}
                      </Chip>
                    );
                  })}
                </div>
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
              color="primary"
              onPress={confirmGenerate}
              isLoading={generating}
            >
              Generate Data
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
