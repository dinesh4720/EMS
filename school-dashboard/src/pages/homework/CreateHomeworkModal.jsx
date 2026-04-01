import { useState, useEffect } from 'react';
import { Select, SelectItem, Input, Button, Textarea, Divider } from '@heroui/react';
import { Calendar, BookOpen, Paperclip, Plus, X } from 'lucide-react';
import { homeworkApi, classesApi, subjectsApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const CreateHomeworkModal = ({ onClose, onSuccess, editingHomework }) => {
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [errors, setErrors] = useState({});
  const isEditMode = !!editingHomework;

  const [formData, setFormData] = useState(() => {
    if (editingHomework) {
      const classIdValue = editingHomework.classId?._id || editingHomework.classId?.id || editingHomework.classId || '';
      return {
        title: editingHomework.title || '',
        description: editingHomework.description || '',
        subject: editingHomework.subject ? new Set([editingHomework.subject]) : new Set([]),
        classId: classIdValue ? new Set([classIdValue]) : new Set([]),
        dueDate: editingHomework.dueDate ? new Date(editingHomework.dueDate).toISOString().split('T')[0] : '',
        totalMarks: editingHomework.totalMarks ?? 100,
        sentToParents: editingHomework.sentToParents ?? true,
        attachments: editingHomework.attachments || [],
      };
    }
    return {
      title: '',
      description: '',
      subject: new Set([]),
      classId: new Set([]),
      dueDate: '',
      totalMarks: 100,
      sentToParents: true,
      attachments: [],
    };
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
      const seenNames = new Set();
      (classesData || []).forEach(cls => {
        const id = cls.id || cls._id;
        const displayName = cls.displayName || (cls.section ? `${cls.name}-${cls.section}` : cls.name);
        // Deduplicate by both ID and display name to prevent duplicate entries
        if (id && !uniqueClasses.has(id) && !seenNames.has(displayName)) {
          seenNames.add(displayName);
          uniqueClasses.set(id, { id, name: displayName });
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
    // HeroUI Select can pass "all" string or a Set — always normalize to Set
    const normalizedValue = value === "all" ? new Set() : (value instanceof Set ? value : new Set(value ? [value] : []));
    setFormData(prev => ({ ...prev, [field]: normalizedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddAttachment = () => {
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, { name: '', url: '' }],
    }));
  };

  const handleAttachmentChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.attachments];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, attachments: updated };
    });
  };

  const handleRemoveAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.subject.size === 0) newErrors.subject = 'Please select a subject';
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
      const subjectName = Array.from(formData.subject)[0];

      // Filter out attachments with empty URLs
      const validAttachments = formData.attachments.filter(a => a.url?.trim());

      const payload = {
        title: formData.title,
        description: formData.description,
        subject: subjectName,
        classId,
        teacherId: user?.id || user?._id,
        dueDate: formData.dueDate,
        totalMarks: Number(formData.totalMarks) || 100,
        sentToParents: formData.sentToParents,
        ...(validAttachments.length > 0 && { attachments: validAttachments }),
      };

      if (isEditMode) {
        const homeworkId = editingHomework._id || editingHomework.id;
        await homeworkApi.update(homeworkId, payload);
        toast.success(t('toast.success.homeworkUpdatedSuccessfully', 'Homework updated successfully'));
      } else {
        await homeworkApi.create(payload);
        toast.success(t('toast.success.homeworkCreatedSuccessfully'));
      }
      onSuccess?.();
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} homework:`, error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} homework: ` + (error.message || 'Unknown error'));
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
            placeholder={t('homework.titlePlaceholder')}
            value={formData.title}
            onValueChange={(value) => handleInputChange('title', value)}
            isInvalid={!!errors.title}
            errorMessage={errors.title}
            isRequired
            classNames={{ inputWrapper: 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600' }}
          />

          <Select
            label={t('pages.subject2')}
            labelPlacement="outside"
            placeholder={loadingData ? 'Loading...' : 'Select subject'}
            selectedKeys={formData.subject}
            onSelectionChange={handleSelectionChange('subject')}
            isInvalid={!!errors.subject}
            errorMessage={errors.subject}
            isRequired
            isDisabled={loadingData}
            classNames={{ trigger: 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600' }}
          >
            {subjects.map((sub) => (
              <SelectItem key={sub.name} value={sub.name}>
                {sub.name}
              </SelectItem>
            ))}
          </Select>

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

          <Input
            type="number"
            label="Total Marks"
            labelPlacement="outside"
            placeholder={t('homework.totalMarksPlaceholder')}
            value={String(formData.totalMarks)}
            onValueChange={(value) => handleInputChange('totalMarks', value)}
            min={0}
            max={1000}
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

      {/* Attachments */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
          <Paperclip size={16} className="text-gray-400 dark:text-zinc-500" />
          Attachments
        </h4>
        {formData.attachments.map((attachment, index) => (
          <div key={attachment._key || `attachment-${index}`} className="flex items-start gap-2 mb-2">
            <Input
              size="sm"
              placeholder={t('homework.fileNamePlaceholder')}
              value={attachment.name}
              onValueChange={(value) => handleAttachmentChange(index, 'name', value)}
              className="flex-1"
              classNames={{ inputWrapper: 'border-gray-200 dark:border-zinc-700' }}
            />
            <Input
              size="sm"
              placeholder={t('homework.urlPlaceholder')}
              value={attachment.url}
              onValueChange={(value) => handleAttachmentChange(index, 'url', value)}
              className="flex-[2]"
              classNames={{ inputWrapper: 'border-gray-200 dark:border-zinc-700' }}
            />
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={() => handleRemoveAttachment(index)}
            >
              <X size={14} />
            </Button>
          </div>
        ))}
        <Button
          size="sm"
          variant="flat"
          startContent={<Plus size={14} />}
          onPress={handleAddAttachment}
          className="text-gray-600 dark:text-zinc-400"
        >
          Add Attachment
        </Button>
      </div>

      <Divider className="dark:border-zinc-800" />

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
          {isEditMode ? 'Update Homework' : 'Create Homework'}
        </Button>
      </div>
    </form>
  );
};

export default CreateHomeworkModal;
