import { useState, useEffect } from 'react';
import { Select, SelectItem, Input, Button, Textarea, Divider } from '@heroui/react';
import { Calendar, Award, BookOpen } from 'lucide-react';
import { examsApi, subjectsApi, classesApi } from '../../services/api';
import { getStoredUser } from '../../utils/authSession';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';

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
      console.error('Error fetching initial data:', error);
      toast.error(t('toast.error.failedToLoadFormData'));
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSelectionChange = (field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Exam name is required';
    }
    if (formData.classId.size === 0) {
      newErrors.classId = 'Please select a class';
    }
    if (formData.subjectId.size === 0) {
      newErrors.subjectId = 'Please select a subject';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (formData.startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }
    if (parseInt(formData.maxMarks) <= 0) {
      newErrors.maxMarks = 'Max marks must be greater than 0';
    }
    if (parseInt(formData.passingMarks) > parseInt(formData.maxMarks)) {
      newErrors.passingMarks = 'Passing marks cannot exceed max marks';
    }
    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date cannot be before start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      console.error('Error creating exam:', error);
      toast.error('Failed to create exam: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
          <BookOpen size={16} className="text-gray-400 dark:text-zinc-500" />
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
              inputWrapper: 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700',
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
              trigger: 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700',
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
              trigger: 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700',
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
              trigger: 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700',
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
            startContent={<Calendar size={16} className="text-gray-400 dark:text-zinc-500" />}
            classNames={{
              inputWrapper: 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700',
            }}
          />
        </div>
      </div>

      <Divider />

      {/* Schedule */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-gray-400 dark:text-zinc-500" />
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
              inputWrapper: 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700',
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
            classNames={{
              inputWrapper: 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700',
            }}
          />

          <Select
            label="Term"
            labelPlacement="outside"
            placeholder={t('academics.selectTermPlaceholder')}
            selectedKeys={formData.term}
            onSelectionChange={handleSelectionChange('term')}
            classNames={{
              trigger: 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700',
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
              inputWrapper: 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700',
            }}
          />
        </div>
      </div>

      <Divider />

      {/* Marks Configuration */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
          <Award size={16} className="text-gray-400 dark:text-zinc-500" />
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
              inputWrapper: 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700',
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
              inputWrapper: 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700',
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
              inputWrapper: 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700',
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
              trigger: 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700',
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
            inputWrapper: 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700',
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
          className="bg-gray-900 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Create Exam
        </Button>
      </div>
    </form>
  );
};

export default CreateExamModal;
