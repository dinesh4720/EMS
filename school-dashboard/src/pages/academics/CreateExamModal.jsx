import React, { useState, useEffect } from 'react';
import { Select, SelectItem, Input, Button, Textarea, Divider } from '@heroui/react';
import { Calendar, Award, BookOpen, Users, AlertCircle } from 'lucide-react';
import { examsApi, subjectsApi, classesApi } from '../../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';

const EXAM_TYPES = [
  { value: 'unit_test', label: 'Unit Test' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'midterm', label: 'Mid Term' },
  { value: 'final', label: 'Final Exam' },
];

const GRADING_TYPES = [
  { value: 'numerical', label: 'Numerical (0-100)' },
  { value: 'grades', label: 'Grades (A-F)' },
  { value: 'cgpa', label: 'CGPA (1-10)' },
];

const CreateExamModal = ({ onClose, onSuccess }) => {
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
      toast.error('Failed to load form data');
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
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const user = JSON.parse(sessionStorage.getItem('app_user') || '{}');
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
        createdBy: user.id,
        status: 'scheduled'
      };

      await examsApi.create(payload);
      toast.success('Exam created successfully!');
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
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <BookOpen size={16} className="text-gray-400" />
          Basic Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Exam Name"
            labelPlacement="outside"
            placeholder="e.g., Unit Test 1, Mid-Term Examination"
            value={formData.name}
            onValueChange={(value) => handleInputChange('name', value)}
            isInvalid={!!errors.name}
            errorMessage={errors.name}
            isRequired
            classNames={{
              inputWrapper: 'border-gray-200 hover:border-gray-300',
            }}
          />

          <Select
            label="Exam Type"
            labelPlacement="outside"
            placeholder="Select exam type"
            selectedKeys={formData.type}
            onSelectionChange={handleSelectionChange('type')}
            isRequired
            classNames={{
              trigger: 'border-gray-200 hover:border-gray-300',
            }}
          >
            {EXAM_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="Class"
            labelPlacement="outside"
            placeholder={loadingData ? "Loading..." : "Select class"}
            selectedKeys={formData.classId}
            onSelectionChange={handleSelectionChange('classId')}
            isInvalid={!!errors.classId}
            errorMessage={errors.classId}
            isRequired
            isDisabled={loadingData}
            classNames={{
              trigger: 'border-gray-200 hover:border-gray-300',
            }}
          >
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="Subject"
            labelPlacement="outside"
            placeholder={loadingData ? "Loading..." : "Select subject"}
            selectedKeys={formData.subjectId}
            onSelectionChange={handleSelectionChange('subjectId')}
            isInvalid={!!errors.subjectId}
            errorMessage={errors.subjectId}
            isRequired
            isDisabled={loadingData}
            classNames={{
              trigger: 'border-gray-200 hover:border-gray-300',
            }}
          >
            {subjects.map((subject) => (
              <SelectItem key={subject.id || subject._id} value={subject.id || subject._id}>
                {subject.name}
              </SelectItem>
            ))}
          </Select>

          <Input
            label="Academic Year"
            labelPlacement="outside"
            placeholder={`e.g., ${currentAcademicYear}`}
            value={formData.academicYear || currentAcademicYear}
            onValueChange={(value) => handleInputChange('academicYear', value)}
            startContent={<Calendar size={16} className="text-gray-400" />}
            classNames={{
              inputWrapper: 'border-gray-200 hover:border-gray-300',
            }}
          />
        </div>
      </div>

      <Divider />

      {/* Schedule */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          Schedule
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Start Date"
            labelPlacement="outside"
            value={formData.startDate}
            onValueChange={(value) => handleInputChange('startDate', value)}
            isInvalid={!!errors.startDate}
            errorMessage={errors.startDate}
            isRequired
            classNames={{
              inputWrapper: 'border-gray-200 hover:border-gray-300',
            }}
          />
          <Input
            type="date"
            label="End Date"
            labelPlacement="outside"
            value={formData.endDate}
            onValueChange={(value) => handleInputChange('endDate', value)}
            isInvalid={!!errors.endDate}
            errorMessage={errors.endDate}
            classNames={{
              inputWrapper: 'border-gray-200 hover:border-gray-300',
            }}
          />
        </div>
      </div>

      <Divider />

      {/* Marks Configuration */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Award size={16} className="text-gray-400" />
          Marks Configuration
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="number"
            label="Max Marks"
            labelPlacement="outside"
            placeholder="100"
            value={formData.maxMarks}
            onValueChange={(value) => handleInputChange('maxMarks', value)}
            isInvalid={!!errors.maxMarks}
            errorMessage={errors.maxMarks}
            classNames={{
              inputWrapper: 'border-gray-200 hover:border-gray-300',
            }}
          />
          <Input
            type="number"
            label="Passing Marks"
            labelPlacement="outside"
            placeholder="35"
            value={formData.passingMarks}
            onValueChange={(value) => handleInputChange('passingMarks', value)}
            isInvalid={!!errors.passingMarks}
            errorMessage={errors.passingMarks}
            classNames={{
              inputWrapper: 'border-gray-200 hover:border-gray-300',
            }}
          />
          <Input
            type="number"
            label="Weightage (%)"
            labelPlacement="outside"
            placeholder="10"
            value={formData.weightage}
            onValueChange={(value) => handleInputChange('weightage', value)}
            classNames={{
              inputWrapper: 'border-gray-200 hover:border-gray-300',
            }}
          />
        </div>

        <div className="mt-4">
          <Select
            label="Grading Type"
            labelPlacement="outside"
            placeholder="Select grading type"
            selectedKeys={formData.gradingType}
            onSelectionChange={handleSelectionChange('gradingType')}
            classNames={{
              trigger: 'border-gray-200 hover:border-gray-300',
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
          label="Instructions (Optional)"
          labelPlacement="outside"
          placeholder="Enter exam instructions for students..."
          value={formData.instructions}
          onValueChange={(value) => handleInputChange('instructions', value)}
          minRows={3}
          classNames={{
            inputWrapper: 'border-gray-200 hover:border-gray-300',
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
          className="bg-gray-900"
        >
          Create Exam
        </Button>
      </div>
    </form>
  );
};

export default CreateExamModal;
