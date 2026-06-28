import { useState, useEffect } from 'react';
import { Select, SelectItem, Input, Button } from '@heroui/react';
import { Calendar } from 'lucide-react';
import { examScheduleApi, classesApi } from '../../services/api';
import toast from 'react-hot-toast';
import { useAppMeta } from '../../context/AppContext';
import { formatShortDate } from '../../utils/dateFormatter';
import { createExamScheduleSchema, parseFormSchema } from '../../validators/formSchemas';

const EXAM_TYPES = [
  { value: 'unit_test', label: 'Unit Test' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'midterm', label: 'Mid Term' },
  { value: 'final', label: 'Final Exam' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half_yearly', label: 'Half Yearly' },
  { value: 'annual', label: 'Annual' },
];

const SESSION_TYPES = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'both', label: 'Both' },
];

const CreateExamScheduleModal = ({ onClose, onSuccess }) => {
  const { currentAcademicYear } = useAppMeta();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [classes, setClasses] = useState([]);
  const [errors, setErrors] = useState({});
  // Stores conflict details returned from 409 response to show inline
  const [conflictError, setConflictError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: new Set(['midterm']),
    classIds: new Set([]),
    startDate: '',
    endDate: '',
    sessionType: new Set(['morning']),
    defaultMaxMarks: '100',
    defaultPassingMarks: '35',
  });

  useEffect(() => {
    classesApi.getAll?.()
      .then((data) => {
        const unique = new Map();
        (data || []).forEach((cls) => {
          const id = cls._id || cls.id;
          if (id && !unique.has(id)) {
            unique.set(id, {
              id,
              name: cls.section ? `${cls.name} - ${cls.section}` : cls.name,
            });
          }
        });
        setClasses(Array.from(unique.values()));
      })
      .catch(() => toast.error('Failed to load classes'))
      .finally(() => setLoadingData(false));
  }, []);

  const handleChange = (field, value) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setConflictError(null);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const { success, errors: zodErrors } = parseFormSchema(createExamScheduleSchema, {
      name: formData.name,
      type: Array.from(formData.type)[0] || '',
      classIds: Array.from(formData.classIds),
      startDate: formData.startDate,
      endDate: formData.endDate,
      sessionType: Array.from(formData.sessionType)[0] || undefined,
      defaultMaxMarks: formData.defaultMaxMarks,
      defaultPassingMarks: formData.defaultPassingMarks,
    });
    setErrors(zodErrors);
    return success;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConflictError(null);

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      await examScheduleApi.create({
        name: formData.name.trim(),
        type: Array.from(formData.type)[0],
        classIds: Array.from(formData.classIds),
        startDate: formData.startDate,
        endDate: formData.endDate,
        sessionType: Array.from(formData.sessionType)[0],
        defaultMaxMarks: parseInt(formData.defaultMaxMarks) || 100,
        defaultPassingMarks: parseInt(formData.defaultPassingMarks) || 35,
        academicYear: currentAcademicYear,
      });
      toast.success('Exam schedule created successfully');
      onSuccess?.();
    } catch (error) {
      // 409 Conflict — show which existing schedules overlap
      if (error.status === 409 || error.type === 'ConflictError') {
        const conflicts = error.details?.conflicts;
        if (conflicts?.length > 0) {
          const names = conflicts
            .map((c) => `"${c.scheduleName}" (${formatShortDate(c.startDate)} – ${formatShortDate(c.endDate)})`)
            .join(', ');
          setConflictError(`Overlaps with: ${names}`);
          toast.error(`Schedule conflict with ${conflicts.length} existing schedule${conflicts.length > 1 ? 's' : ''}`);
        } else {
          // Duplicate name conflict (no conflicts array)
          setConflictError(error.message || 'An exam schedule with this name already exists');
          toast.error(error.message || 'Duplicate schedule name');
        }
      } else {
        toast.error('Failed to create exam schedule: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h4 className="text-sm font-medium text-fg mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-fg-faint" />
          Schedule Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Schedule Name"
            labelPlacement="outside"
            placeholder="e.g. Mid-Term March 2026"
            value={formData.name}
            onValueChange={(v) => handleChange('name', v)}
            isInvalid={!!errors.name}
            errorMessage={errors.name}
            isRequired
          />
          <Select
            label="Exam Type"
            labelPlacement="outside"
            selectedKeys={formData.type}
            onSelectionChange={(v) => handleChange('type', v)}
          >
            {EXAM_TYPES.map((t) => (
              <SelectItem key={t.value}>{t.label}</SelectItem>
            ))}
          </Select>
          <Input
            label="Start Date"
            labelPlacement="outside"
            type="date"
            value={formData.startDate}
            onValueChange={(v) => handleChange('startDate', v)}
            isInvalid={!!errors.startDate}
            errorMessage={errors.startDate}
            isRequired
          />
          <Input
            label="End Date"
            labelPlacement="outside"
            type="date"
            value={formData.endDate}
            onValueChange={(v) => handleChange('endDate', v)}
            isInvalid={!!errors.endDate}
            errorMessage={errors.endDate}
            isRequired
          />
        </div>
      </div>

      <Select
        label="Classes"
        labelPlacement="outside"
        placeholder={loadingData ? 'Loading...' : 'Select classes'}
        selectionMode="multiple"
        selectedKeys={formData.classIds}
        onSelectionChange={(v) => handleChange('classIds', v)}
        isInvalid={!!errors.classIds}
        errorMessage={errors.classIds}
        isDisabled={loadingData}
        isRequired
      >
        {classes.map((cls) => (
          <SelectItem key={cls.id}>{cls.name}</SelectItem>
        ))}
      </Select>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Session"
          labelPlacement="outside"
          selectedKeys={formData.sessionType}
          onSelectionChange={(v) => handleChange('sessionType', v)}
        >
          {SESSION_TYPES.map((s) => (
            <SelectItem key={s.value}>{s.label}</SelectItem>
          ))}
        </Select>
        <Input
          label="Max Marks"
          labelPlacement="outside"
          type="number"
          value={formData.defaultMaxMarks}
          onValueChange={(v) => handleChange('defaultMaxMarks', v)}
          isInvalid={!!errors.defaultMaxMarks}
          errorMessage={errors.defaultMaxMarks}
        />
        <Input
          label="Passing Marks"
          labelPlacement="outside"
          type="number"
          value={formData.defaultPassingMarks}
          onValueChange={(v) => handleChange('defaultPassingMarks', v)}
          isInvalid={!!errors.defaultPassingMarks}
          errorMessage={errors.defaultPassingMarks}
        />
      </div>

      {/* Conflict error — shows which schedules overlap */}
      {conflictError && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 px-4 py-3">
          <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Schedule Conflict</p>
          <p className="text-sm text-red-600 dark:text-red-300">{conflictError}</p>
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">
            Adjust the date range or select different classes to avoid the overlap.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="flat" onPress={onClose} isDisabled={loading}>
          Cancel
        </Button>
        <Button type="submit" color="primary" isLoading={loading}>
          Create Schedule
        </Button>
      </div>
    </form>
  );
};

export default CreateExamScheduleModal;
