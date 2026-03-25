import { useState, useEffect } from 'react';
import { Select, SelectItem, Input, Button, Textarea, Divider } from '@heroui/react';
import { Calendar, BookOpen } from 'lucide-react';
import { homeworkApi, classesApi, subjectsApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const CreateHomeworkModal = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    classId: new Set([]),
    dueDate: '',
    sentToParents: true,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoadingData(true);
    try {
      const [classesData, subjectsData] = await Promise.all([
        classesApi.getPublic ? classesApi.getPublic() : (classesApi.getAll ? classesApi.getAll() : Promise.resolve([])),
        subjectsApi.getAll(),
      ]);

      const uniqueClasses = new Map();
      (classesData || []).forEach(cls => {
        const id = cls.id || cls._id;
        if (id && !uniqueClasses.has(id)) {
          uniqueClasses.set(id, {
            id,
            name: cls.displayName || (cls.section ? `${cls.name}-${cls.section}` : cls.name),
          });
        }
      });
      setClasses(Array.from(uniqueClasses.values()));
      setSubjects(subjectsData || []);
    } catch (error) {
      console.error('Error fetching form data:', error);
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
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (formData.classId.size === 0) newErrors.classId = 'Please select a class';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
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
      const classId = Array.from(formData.classId)[0];

      const payload = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        classId,
        teacherId: user?.id || user?._id,
        dueDate: formData.dueDate,
        sentToParents: formData.sentToParents,
      };

      await homeworkApi.create(payload);
      toast.success(t('toast.success.homeworkCreatedSuccessfully'));
      onSuccess?.();
    } catch (error) {
      console.error('Error creating homework:', error);
      toast.error('Failed to create homework: ' + (error.message || 'Unknown error'));
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
          Assignment Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('pages.title1')}
            labelPlacement="outside"
            placeholder="e.g., Chapter 5 Practice Problems"
            value={formData.title}
            onValueChange={(value) => handleInputChange('title', value)}
            isInvalid={!!errors.title}
            errorMessage={errors.title}
            isRequired
            classNames={{ inputWrapper: 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600' }}
          />

          <Input
            label={t('pages.subject2')}
            labelPlacement="outside"
            placeholder="e.g., Mathematics"
            value={formData.subject}
            onValueChange={(value) => handleInputChange('subject', value)}
            isInvalid={!!errors.subject}
            errorMessage={errors.subject}
            isRequired
            classNames={{ inputWrapper: 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600' }}
          />

          <Select
            label={t('pages.class1')}
            labelPlacement="outside"
            placeholder={loadingData ? 'Loading...' : 'Select class'}
            selectedKeys={formData.classId}
            onSelectionChange={handleSelectionChange('classId')}
            isInvalid={!!errors.classId}
            errorMessage={errors.classId}
            isRequired
            isDisabled={loadingData}
            classNames={{ trigger: 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600' }}
          >
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </Select>

          <Input
            type="date"
            label={t('pages.dueDate')}
            labelPlacement="outside"
            value={formData.dueDate}
            onValueChange={(value) => handleInputChange('dueDate', value)}
            isInvalid={!!errors.dueDate}
            errorMessage={errors.dueDate}
            isRequired
            startContent={<Calendar size={16} className="text-gray-400 dark:text-zinc-500" />}
            classNames={{ inputWrapper: 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600' }}
          />
        </div>
      </div>

      <Divider className="dark:border-zinc-800" />

      {/* Description */}
      <div>
        <Textarea
          label={t('pages.description1')}
          labelPlacement="outside"
          placeholder={t('pages.enterHomeworkInstructionsAndDetails')}
          value={formData.description}
          onValueChange={(value) => handleInputChange('description', value)}
          isInvalid={!!errors.description}
          errorMessage={errors.description}
          isRequired
          minRows={3}
          classNames={{ inputWrapper: 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600' }}
        />
      </div>

      {/* Notify parents toggle */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.sentToParents}
            onChange={(e) => handleInputChange('sentToParents', e.target.checked)}
            className="rounded border-gray-300 dark:border-zinc-600"
          />
          <span className="text-sm text-gray-700 dark:text-zinc-300">{t('pages.notifyParentsAboutThisHomework')}</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="light" onPress={onClose} isDisabled={loading}>
          Cancel
        </Button>
        <Button color="primary" type="submit" isLoading={loading} className="bg-gray-900 dark:bg-zinc-100 dark:text-zinc-900">
          Create Homework
        </Button>
      </div>
    </form>
  );
};

export default CreateHomeworkModal;
