import { useState, useEffect } from "react";
import {
  Card, CardBody, CardHeader, Button, Input, Select, SelectItem,
  Spinner, Chip
} from "@heroui/react";
import { Settings, Tag, BookOpen, Save, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";
import { 
  showErrorToast, 
  showSuccessToast,
  executeWithFeedback
} from "../../utils/errorHandling";

export default function ClassSettingsPanel({ classId }) {
  const { classesApi, schoolSettings } = useApp();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classTag, setClassTag] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [errors, setErrors] = useState({});
  const [originalTag, setOriginalTag] = useState("");
  const [originalSubjects, setOriginalSubjects] = useState(new Set());

  const isDirty =
    classTag !== originalTag ||
    selectedSubjects.size !== originalSubjects.size ||
    [...selectedSubjects].some(s => !originalSubjects.has(s));

  // Check if user has edit permission
  const canEdit = hasPermission('classes', 'edit');

  // Available subjects from school settings - extract names from objects
  const availableSubjects = schoolSettings?.subjects?.map(s => 
    typeof s === 'string' ? s : s.name
  ) || [
    "Mathematics",
    "Science",
    "English",
    "Hindi",
    "Social Studies",
    "Computer Science",
    "Physical Education",
    "Art",
    "Music"
  ];

  // Load class settings on mount
  useEffect(() => {
    if (classId) {
      loadClassSettings();
    }
  }, [classId]);

  const loadClassSettings = async () => {
    try {
      setLoading(true);
      const settings = await classesApi.getSettings(classId);
      
      if (settings) {
        const tag = settings.classTag || "";
        // Normalize subjects to strings (handle both string and object formats)
        const normalizedSubjects = (settings.assignedSubjects || []).map(s =>
          typeof s === 'string' ? s : s.name
        );
        const subjectsSet = new Set(normalizedSubjects);
        setClassTag(tag);
        setSelectedSubjects(subjectsSet);
        setOriginalTag(tag);
        setOriginalSubjects(subjectsSet);
      }
    } catch (error) {
      console.error("Error loading class settings:", error);
      showErrorToast(error, "Failed to load class settings");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Class tag validation (optional field, but if provided should be reasonable length)
    if (classTag && classTag.length > 50) {
      newErrors.classTag = "Class tag must be 50 characters or less";
    }
    
    // Subjects validation
    if (selectedSubjects.size === 0) {
      newErrors.subjects = "Please select at least one subject";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTagUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    await executeWithFeedback(
      async () => {
        setSaving(true);
        await classesApi.updateTag(classId, classTag);
        setErrors({});
      },
      {
        loadingMessage: 'Updating class tag...',
        successMessage: 'Class tag updated successfully!',
        errorMessage: null,
        onSuccess: () => {
          setSaving(false);
        },
        onError: () => {
          setSaving(false);
        }
      }
    );
  };

  const handleSubjectSelection = async (keys) => {
    const newSelection = new Set(keys);
    setSelectedSubjects(newSelection);
    
    // Clear subjects error when user makes a selection
    if (newSelection.size > 0 && errors.subjects) {
      setErrors(prev => ({ ...prev, subjects: undefined }));
    }
  };

  const handleSaveSubjects = async () => {
    if (!validateForm()) {
      return;
    }

    await executeWithFeedback(
      async () => {
        setSaving(true);
        const subjectsArray = Array.from(selectedSubjects);
        await classesApi.updateSubjects(classId, subjectsArray);
        setErrors({});
      },
      {
        loadingMessage: 'Updating subjects...',
        successMessage: 'Subjects updated successfully!',
        errorMessage: null,
        onSuccess: () => {
          setSaving(false);
        },
        onError: () => {
          setSaving(false);
        }
      }
    );
  };

  const handleSaveAll = async () => {
    if (!validateForm()) {
      return;
    }

    await executeWithFeedback(
      async () => {
        setSaving(true);
        
        // Update both tag and subjects
        await Promise.all([
          classesApi.updateTag(classId, classTag),
          classesApi.updateSubjects(classId, Array.from(selectedSubjects))
        ]);
        
        setErrors({});
      },
      {
        loadingMessage: 'Saving class settings...',
        successMessage: 'Class settings saved successfully!',
        errorMessage: null,
        onSuccess: () => {
          setSaving(false);
        },
        onError: () => {
          setSaving(false);
        }
      }
    );
  };

  if (loading) {
    return (
      <Card className="shadow-sm border border-default-200">
        <CardBody className="flex items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="text-default-500 mt-4">Loading class settings...</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border border-default-200">
        <CardHeader className="flex justify-between items-center px-6 py-4 border-b border-default-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-default-800">Class Settings</h3>
              <p className="text-xs text-default-500">Configure class tag and subjects</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-6 space-y-6">
          {/* Class Tag Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-default-500" />
              <label className="text-sm font-medium text-default-700">
                Class Tag
              </label>
            </div>
            <Input
              placeholder="Enter a custom tag for this class (e.g., 'Science Stream', 'Morning Batch')"
              value={classTag}
              onValueChange={setClassTag}
              isInvalid={!!errors.classTag}
              errorMessage={errors.classTag}
              variant="bordered"
              radius="lg"
              size="md"
              classNames={{
                input: "text-sm",
                inputWrapper: "border-default-200"
              }}
              endContent={
                classTag && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setClassTag("")}
                    className="min-w-6 w-6 h-6"
                  >
                    <X size={14} />
                  </Button>
                )
              }
            />
            {classTag && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-default-500">Preview:</span>
                <Chip size="sm" variant="flat" color="primary">
                  {classTag}
                </Chip>
              </div>
            )}
          </div>

          <div className="border-t border-default-200" />

          {/* Subjects Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-default-500" />
              <label className="text-sm font-medium text-default-700">
                Assigned Subjects
              </label>
            </div>
            <Select
              label="Select subjects for this class"
              placeholder="Choose subjects"
              selectionMode="multiple"
              selectedKeys={selectedSubjects}
              onSelectionChange={handleSubjectSelection}
              isInvalid={!!errors.subjects}
              errorMessage={errors.subjects}
              variant="bordered"
              radius="lg"
              size="md"
              classNames={{
                trigger: "border-default-200",
                value: "text-sm"
              }}
            >
              {availableSubjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </Select>
            
            {selectedSubjects.size > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {Array.from(selectedSubjects).map((subject) => (
                  <Chip
                    key={subject}
                    size="sm"
                    variant="flat"
                    color="secondary"
                    onClose={() => {
                      const newSelection = new Set(selectedSubjects);
                      newSelection.delete(subject);
                      setSelectedSubjects(newSelection);
                    }}
                  >
                    {subject}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-default-200" />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="flat"
              onPress={() => {
                if (!isDirty || window.confirm('Discard unsaved changes?')) {
                  loadClassSettings();
                }
              }}
              isDisabled={saving || !canEdit || !isDirty}
            >
              Reset
            </Button>
            <Button
              color="primary"
              startContent={<Save size={16} />}
              onPress={handleSaveAll}
              isLoading={saving}
              isDisabled={!canEdit}
              className="shadow-md shadow-primary/25"
            >
              Save Settings
            </Button>
          </div>
          
          {!canEdit && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex items-center gap-2">
              <span className="text-sm text-warning-700">
                You don't have permission to edit class settings. Contact an administrator for access.
              </span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm border border-default-200 hover:border-primary-200 transition-colors cursor-pointer">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-default-700">Class Tag</p>
                <p className="text-xs text-default-500 mt-1">
                  {classTag || "No tag set"}
                </p>
              </div>
              <Button
                size="sm"
                variant="flat"
                color="primary"
                onPress={handleTagUpdate}
                isLoading={saving}
                isDisabled={!classTag || !!errors.classTag || !canEdit}
              >
                Update Tag
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 hover:border-secondary-200 transition-colors cursor-pointer">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-default-700">Subjects</p>
                <p className="text-xs text-default-500 mt-1">
                  {selectedSubjects.size} subject{selectedSubjects.size !== 1 ? 's' : ''} selected
                </p>
              </div>
              <Button
                size="sm"
                variant="flat"
                color="secondary"
                onPress={handleSaveSubjects}
                isLoading={saving}
                isDisabled={selectedSubjects.size === 0 || !!errors.subjects || !canEdit}
              >
                Update Subjects
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
