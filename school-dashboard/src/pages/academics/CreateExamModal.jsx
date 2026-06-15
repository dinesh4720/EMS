import { useState, useEffect } from 'react';
import { Select, SelectItem, Input, Button, Textarea, Divider } from '@heroui/react';
import { Calendar, Award, BookOpen } from 'lucide-react';
import { examsApi, subjectsApi, classesApi } from '../../services/api';
import { getStoredUser } from '../../utils/authSession';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import { createExamSchema, parseFormSchema } from '../../validators/formSchemas';
import logger from '../../utils/logger';


const EXAM_TYPES = [
  { value: 'unit_test', label: 'Unit Test' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'midterm', label: 'Mid Term' },
  { value: 'final', label: 'Final Exam' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half_yearly', label: 'Half Yearly' },
  { value: 'annual', label: 'Annual' },
  { value: 'practice', label: 'Practice' },
  { value: 'class_test', label: 'Class Test' },
  { value: 'assignment', label: 'Assignment' },
];

const TERM_OPTIONS = [
  { value: 'term_1', label: 'Term 1' },
  { value: 'term_2', label: 'Term 2' },
  { value: 'term_3', label: 'Term 3' },
  { value: 'final', label: 'Final' },
];

const GRADING_TYPES = [
  { value: 'numerical', label: 'Numerical (0-100)' },
  { value: 'grades', label: 'Grades (A-F)' },
  { value: 'cgpa', label: 'CGPA (1-10)' },
];

const CreateExamModal = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    type: new Set(['unit_test']),
    classId: new Set([]),
    subjectId: new Set([]),
    academicYear: '',
    startDate: '',
    endDate: '',
    maxMarks: '100',
    passingMarks: '35',
    weightage: '10',
    gradingType: new Set(['numerical']),
    term: new Set([]),
    duration: '',
    instructions: '',
  });

  useEffect(() => {
    fetchInitialData();
    // Mount-only; `fetchInitialData` is recreated each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInitialData = async () => {
    setLoadingData(true);
    try {
      const [subjectsData, classesData] = await Promise.all([
        subjectsApi.getAll(),
        classesApi.getPublic ? classesApi.getPublic() : (classesApi.getAll ? classesApi.getAll() : Promise.resolve([]))
      ]);
      setSubjects(subjectsData || []);

      // Deduplicate classes and format names properly
      const uniqueClasses = new Map();
      (classesData || []).forEach(cls => {
        const id = cls.id || cls._id;
        if (id && !uniqueClasses.has(id)) {
          uniqueClasses.set(id, {
            id,
            name: cls.displayName || (cls.section ? `${cls.name}-${cls.section}` : cls.name),
            // Keep original fields for reference
            _id: cls._id,
            section: cls.section,
            originalName: cls.name
          });
        }
      });
      setClasses(Array.from(uniqueClasses.values()));
    } catch (error) {
      logger.error('Error fetching initial data:', error);
      toast.error(t('toast.error.failedToLoadFormData'));
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Clear endDate if it's now before the new startDate
      if (field === 'startDate' && updated.endDate && updated.endDate < value) {
        updated.endDate = '';
      }
      return updated;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (field === 'startDate' && errors.endDate) {
      setErrors(prev => ({ ...prev, endDate: '' }));
    }
  };

  const handleSelectionChange = (field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const { success, errors: zodErrors } = parseFormSchema(createExamSchema, {
      name: formData.name,
      type: Array.from(formData.type)[0] || '',
      classId: Array.from(formData.classId)[0] || '',
      subjectId: Array.from(formData.subjectId)[0] || '',
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      maxMarks: formData.maxMarks,
      passingMarks: formData.passingMarks,
      weightage: formData.weightage || undefined,
      gradingType: Array.from(formData.gradingType)[0] || undefined,
      term: formData.term.size > 0 ? Array.from(formData.term)[0] : undefined,
      duration: formData.duration || undefined,
      instructions: formData.instructions || undefined,
      academicYear: formData.academicYear || undefined,
    });
    setErrors(zodErrors);
    return success;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('toast.error.pleaseFixTheErrorsInTheForm'));
      return;
    }

    setLoading(true);

    try {
      const user = getStoredUser() || {};
      const classId = Array.from(formData.classId)[0];
      const subjectId = Array.from(formData.subjectId)[0];
      const selectedSubject = subjects.find(s => (s.id || s._id) === subjectId);

      const payload = {
        name: formData.name,
        type: Array.from(formData.type)[0],
        classId: classId,
        subjectId: subjectId,
        subjectName: selectedSubject?.name || '',
        academicYear: formData.academicYear || currentAcademicYear,
        startDate: formData.startDate,
        endDate: formData.endDate,
        maxMarks: parseInt(formData.maxMarks) || 100,
        passingMarks: parseInt(formData.passingMarks) || 35,
        weightage: parseInt(formData.weightage) || 10,
        gradingType: Array.from(formData.gradingType)[0],
        instructions: formData.instructions,
        term: formData.term.size > 0 ? Array.from(formData.term)[0] : undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        createdBy: user.id,
        status: 'scheduled'
      };

      await examsApi.create(payload);
      toast.success(t('toast.success.examCreatedSuccessfully'));
      onSuccess?.();
    } catch (error) {
      logger.error('Error creating exam:', error);
      toast.error('Failed to create exam: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h4 className="text-sm font-medium text-fg mb-3 flex items-center gap-2">
          <BookOpen size={16} className="text-fg-faint" />
          Basic Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('pages.examName')}
            labelPlacement="outside"
            placeholder={t('academics.examNamePlaceholder')}
            value={formData.name}
            onValueChange={(value) => handleInputChange('name', value)}
            isInvalid={!!errors.name}
            errorMessage={errors.name}
            isRequired
            classNames={{
              inputWrapper: 'border-border-token hover:border-fg-faint',
            }}
          />

          <Select
            label={t('pages.examType')}
            labelPlacement="outside"
            placeholder={t('pages.selectExamType')}
            selectedKeys={formData.type}
            onSelectionChange={handleSelectionChange('type')}
            isRequired
            classNames={{
              trigger: 'border-border-token hover:border-fg-faint',
            }}
          >
            {EXAM_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </Select>

          <Select
            label={t('pages.class1')}
            labelPlacement="outside"
            placeholder={t('academics.selectClassPlaceholder')}
            selectedKeys={formData.classId}
            onSelectionChange={handleSelectionChange('classId')}
            isInvalid={!!errors.classId}
            errorMessage={errors.classId}
            isRequired
            isLoading={loadingData}
            isDisabled={loadingData}
            classNames={{
              trigger: 'border-border-token hover:border-fg-faint',
            }}
          >
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </Select>

          <Select
            label={t('pages.subject2')}
            labelPlacement="outside"
            placeholder={t('academics.selectSubjectPlaceholder')}
            selectedKeys={formData.subjectId}
            onSelectionChange={handleSelectionChange('subjectId')}
            isInvalid={!!errors.subjectId}
            errorMessage={errors.subjectId}
            isRequired
            isLoading={loadingData}
            isDisabled={loadingData}
            classNames={{
              trigger: 'border-border-token hover:border-fg-faint',
            }}
          >
            {subjects.map((subject) => (
              <SelectItem key={subject.id || subject._id} value={subject.id || subject._id}>
                {subject.name}
              </SelectItem>
            ))}
          </Select>

          <Input
            label={t('pages.academicYear1')}
            labelPlacement="outside"
            placeholder={`e.g., ${currentAcademicYear}`}
            value={formData.academicYear || currentAcademicYear}
            onValueChange={(value) => handleInputChange('academicYear', value)}
            startContent={<Calendar size={16} className="text-fg-faint" />}
            classNames={{
              inputWrapper: 'border-border-token hover:border-fg-faint',
            }}
          />
        </div>
      </div>

      <Divider />

      {/* Schedule */}
      <div>
        <h4 className="text-sm font-medium text-fg mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-fg-faint" />
          Schedule
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="date"
            label={t('pages.startDate1')}
            labelPlacement="outside"
            value={formData.startDate}
            onValueChange={(value) => handleInputChange('startDate', value)}
            isInvalid={!!errors.startDate}
            errorMessage={errors.startDate}
            isRequired
            classNames={{
              inputWrapper: 'border-border-token hover:border-fg-faint',
            }}
          />
          <Input
            type="date"
            label={t('pages.endDate1')}
            labelPlacement="outside"
            value={formData.endDate}
            onValueChange={(value) => handleInputChange('endDate', value)}
            isInvalid={!!errors.endDate}
            errorMessage={errors.endDate}
            min={formData.startDate || undefined}
            classNames={{
              inputWrapper: 'border-border-token hover:border-fg-faint',
            }}
          />

          <Select
            label="Term"
            labelPlacement="outside"
            placeholder={t('academics.selectTermPlaceholder')}
            selectedKeys={formData.term}
            onSelectionChange={handleSelectionChange('term')}
            classNames={{
              trigger: 'border-border-token hover:border-fg-faint',
            }}
          >
            {TERM_OPTIONS.map((term) => (
              <SelectItem key={term.value} value={term.value}>
                {term.label}
              </SelectItem>
            ))}
          </Select>

          <Input
            type="number"
            label="Duration (minutes)"
            labelPlacement="outside"
            placeholder={t('academics.durationPlaceholder')}
            value={formData.duration}
            onValueChange={(value) => handleInputChange('duration', value)}
            min={1}
            classNames={{
              inputWrapper: 'border-border-token hover:border-fg-faint',
            }}
          />
        </div>
      </div>

      <Divider />

      {/* Marks Configuration */}
      <div>
        <h4 className="text-sm font-medium text-fg mb-3 flex items-center gap-2">
          <Award size={16} className="text-fg-faint" />
          Marks Configuration
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="number"
            label={t('pages.maxMarks2')}
            labelPlacement="outside"
            placeholder={t('academics.maxMarksPlaceholder')}
            value={formData.maxMarks}
            onValueChange={(value) => handleInputChange('maxMarks', value)}
            isInvalid={!!errors.maxMarks}
            errorMessage={errors.maxMarks}
            classNames={{
              inputWrapper: 'border-border-token hover:border-fg-faint',
            }}
          />
          <Input
            type="number"
            label={t('pages.passingMarks')}
            labelPlacement="outside"
            placeholder={t('academics.passingMarksPlaceholder')}
            value={formData.passingMarks}
            onValueChange={(value) => handleInputChange('passingMarks', value)}
            isInvalid={!!errors.passingMarks}
            errorMessage={errors.passingMarks}
            classNames={{
              inputWrapper: 'border-border-token hover:border-fg-faint',
            }}
          />
          <Input
            type="number"
            label="Weightage (%)"
            labelPlacement="outside"
            placeholder={t('academics.weightagePlaceholder')}
            value={formData.weightage}
            onValueChange={(value) => handleInputChange('weightage', value)}
            classNames={{
              inputWrapper: 'border-border-token hover:border-fg-faint',
            }}
          />
        </div>

        <div className="mt-4">
          <Select
            label={t('pages.gradingType')}
            labelPlacement="outside"
            placeholder={t('pages.selectGradingType')}
            selectedKeys={formData.gradingType}
            onSelectionChange={handleSelectionChange('gradingType')}
            classNames={{
              trigger: 'border-border-token hover:border-fg-faint',
            }}
          >
            {GRADING_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <Divider />

      {/* Instructions */}
      <div>
        <Textarea
          label={t('pages.instructionsOptional')}
          labelPlacement="outside"
          placeholder={t('pages.enterExamInstructionsForStudents')}
          value={formData.instructions}
          onValueChange={(value) => handleInputChange('instructions', value)}
          minRows={3}
          classNames={{
            inputWrapper: 'border-border-token hover:border-fg-faint',
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="light"
          onPress={onClose}
          isDisabled={loading}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          type="submit"
          isLoading={loading}
          className="bg-accent text-accent-fg"
        >
          Create Exam
        </Button>
      </div>
    </form>
  );
};

export default CreateExamModal;
