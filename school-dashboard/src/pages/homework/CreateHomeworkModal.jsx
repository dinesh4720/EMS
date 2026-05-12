import { useState, useEffect } from 'react';
import { Calendar, BookOpen, Paperclip, Plus, X } from 'lucide-react';
import { homeworkApi, classesApi, subjectsApi } from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import logger from '../../utils/logger';
import {
  Input, Select, Textarea, Checkbox, Button, IconButton, Divider,
} from '../../components/ui';
import { homeworkSchema, parseFormSchema } from '../../validators/formSchemas';

const initialState = (editingHomework, defaultClassId) => {
  if (editingHomework) {
    const classIdValue = editingHomework.classId?._id || editingHomework.classId?.id || editingHomework.classId || '';
    return {
      title: editingHomework.title || '',
      description: editingHomework.description || '',
      subject: editingHomework.subject || '',
      classId: classIdValue || '',
      dueDate: editingHomework.dueDate ? new Date(editingHomework.dueDate).toISOString().split('T')[0] : '',
      totalMarks: editingHomework.totalMarks ?? 100,
      sentToParents: editingHomework.sentToParents ?? true,
      attachments: editingHomework.attachments || [],
    };
  }
  return {
    title: '',
    description: '',
    subject: '',
    classId: defaultClassId || '',
    dueDate: '',
    totalMarks: 100,
    sentToParents: true,
    attachments: [],
  };
};

const CreateHomeworkModal = ({ onClose, onSuccess, editingHomework, defaultClassId }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [errors, setErrors] = useState({});
  const isEditMode = !!editingHomework;

  const [formData, setFormData] = useState(() => initialState(editingHomework, defaultClassId));

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingData(true);
      try {
        const [classesData, subjectsData] = await Promise.all([
          classesApi.getPublic ? classesApi.getPublic() : (classesApi.getAll ? classesApi.getAll() : Promise.resolve([])),
          subjectsApi.getAll(),
        ]);

        const uniqueClasses = new Map();
        const seenNames = new Set();
        (classesData || []).forEach((cls) => {
          const id = cls.id || cls._id;
          const displayName = cls.displayName || (cls.section ? `${cls.name}-${cls.section}` : cls.name);
          if (id && !uniqueClasses.has(id) && !seenNames.has(displayName)) {
            seenNames.add(displayName);
            uniqueClasses.set(id, { id, name: displayName });
          }
        });
        setClasses(Array.from(uniqueClasses.values()));
        setSubjects(subjectsData || []);
      } catch (err) {
        logger.error('Error fetching form data:', err);
        toast.error(t('toast.error.failedToLoadFormData'));
      } finally {
        setLoadingData(false);
      }
    };
    fetchInitialData();
  }, [t]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleAddAttachment = () => {
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, { name: '', url: '' }],
    }));
  };

  const handleAttachmentChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.attachments];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, attachments: updated };
    });
  };

  const handleRemoveAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validAttachments = formData.attachments.filter((att) => att.url?.trim());
    const candidate = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      subject: formData.subject,
      classId: formData.classId,
      dueDate: formData.dueDate,
      totalMarks: Number(formData.totalMarks) || 100,
      sentToParents: formData.sentToParents,
      attachments: validAttachments,
    };

    const { success, errors: fieldErrors } = parseFormSchema(homeworkSchema, candidate);
    if (!success) {
      setErrors(fieldErrors);
      toast.error(t('toast.error.pleaseFixTheErrorsInTheForm'));
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const payload = {
        ...candidate,
        ...(validAttachments.length === 0 ? { attachments: undefined } : {}),
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
    } catch (err) {
      logger.error(`Error ${isEditMode ? 'updating' : 'creating'} homework:`, err);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} homework: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-fg mb-3 flex items-center gap-2">
          <BookOpen size={16} className="text-fg-faint" aria-hidden="true" />
          Assignment Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('pages.title1')}
            placeholder={t('homework.titlePlaceholder')}
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            error={errors.title}
            required
          />

          <Select
            label={t('pages.subject2')}
            placeholder={loadingData ? 'Loading…' : 'Select subject'}
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            error={errors.subject}
            disabled={loadingData}
            required
            options={subjects.map((sub) => ({ value: sub.name, label: sub.name }))}
          />

          <Select
            label={t('pages.class1')}
            placeholder={loadingData ? 'Loading…' : 'Select class'}
            value={formData.classId}
            onChange={(e) => handleInputChange('classId', e.target.value)}
            error={errors.classId}
            disabled={loadingData}
            required
            options={classes.map((cls) => ({ value: cls.id, label: cls.name }))}
          />

          <Input
            type="date"
            label={t('pages.dueDate')}
            value={formData.dueDate}
            onChange={(e) => handleInputChange('dueDate', e.target.value)}
            error={errors.dueDate}
            startContent={<Calendar size={16} aria-hidden="true" />}
            required
          />

          <Input
            type="number"
            label="Total Marks"
            placeholder={t('homework.totalMarksPlaceholder')}
            value={String(formData.totalMarks)}
            onChange={(e) => handleInputChange('totalMarks', e.target.value)}
            error={errors.totalMarks}
            min={0}
            max={1000}
          />
        </div>
      </div>

      <Divider />

      <Textarea
        label={t('pages.description1')}
        placeholder={t('pages.enterHomeworkInstructionsAndDetails')}
        value={formData.description}
        onChange={(e) => handleInputChange('description', e.target.value)}
        error={errors.description}
        rows={4}
        required
      />

      <div>
        <h4 className="text-sm font-medium text-fg mb-3 flex items-center gap-2">
          <Paperclip size={16} className="text-fg-faint" aria-hidden="true" />
          Attachments
        </h4>
        {formData.attachments.map((attachment, index) => (
          <div key={`attachment-${index}`} className="flex items-end gap-2 mb-2">
            <Input
              size="sm"
              wrapperClassName="flex-1"
              placeholder={t('homework.fileNamePlaceholder')}
              value={attachment.name || ''}
              onChange={(e) => handleAttachmentChange(index, 'name', e.target.value)}
            />
            <Input
              size="sm"
              wrapperClassName="flex-[2]"
              placeholder={t('homework.urlPlaceholder')}
              value={attachment.url || ''}
              onChange={(e) => handleAttachmentChange(index, 'url', e.target.value)}
            />
            <IconButton
              size="sm"
              variant="danger"
              aria-label="Remove attachment"
              icon={<X size={14} />}
              onClick={() => handleRemoveAttachment(index)}
            />
          </div>
        ))}
        <Button
          size="sm"
          variant="secondary"
          type="button"
          icon={<Plus size={14} />}
          onClick={handleAddAttachment}
        >
          Add Attachment
        </Button>
      </div>

      <Divider />

      <Checkbox
        checked={formData.sentToParents}
        onChange={(e) => handleInputChange('sentToParents', e.target.checked)}
        label={t('pages.notifyParentsAboutThisHomework')}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={loading}>
          {isEditMode ? 'Update Homework' : 'Create Homework'}
        </Button>
      </div>
    </form>
  );
};

export default CreateHomeworkModal;
