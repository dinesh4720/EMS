import { useState } from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ptmApi } from '../../services/api';
import { Input, Select, Textarea, Button, SectionHeading, Divider } from '../../components/ui';
import { ptmSessionSchema, parseFormSchema } from '../../validators/formSchemas';

const EMPTY_FORM = {
  title: '',
  description: '',
  sessionDate: '',
  startTime: '',
  endTime: '',
  slotDuration: 15,
  classId: '',
  staffId: '',
  venue: '',
};

const CreatePTMSessionModal = ({
  classes = [],
  staff = [],
  existingSessions = [],
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const findOverlap = (candidate) => {
    return existingSessions.find((session) => {
      if (session.status === 'cancelled') return false;
      const sameDay = session.sessionDate?.split('T')[0] === candidate.sessionDate;
      if (!sameDay) return false;
      const sessionClassId = session.classId?._id || session.classId;
      const sessionStaffId = session.staffId?._id || session.staffId;
      const collidesParty =
        String(sessionClassId) === candidate.classId ||
        String(sessionStaffId) === candidate.staffId;
      if (!collidesParty) return false;
      return session.startTime < candidate.endTime && candidate.startTime < session.endTime;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const candidate = {
      title: form.title.trim(),
      description: form.description.trim(),
      sessionDate: form.sessionDate,
      startTime: form.startTime,
      endTime: form.endTime,
      slotDuration: Number(form.slotDuration) || 15,
      classId: form.classId,
      staffId: form.staffId,
      venue: form.venue.trim(),
    };

    const { success, errors: fieldErrors } = parseFormSchema(ptmSessionSchema, candidate);
    if (!success) {
      setErrors(fieldErrors);
      toast.error(t('toast.error.pleaseFixTheErrorsInTheForm', 'Please fix the errors in the form'));
      return;
    }

    const overlap = findOverlap(candidate);
    if (overlap) {
      toast.error(
        `Time slot overlaps with "${overlap.title}" (${overlap.startTime}–${overlap.endTime})`
      );
      return;
    }

    setSaving(true);
    try {
      await ptmApi.create(candidate);
      toast.success('PTM session created');
      onSuccess?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to create PTM session');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <SectionHeading as="h3" size="sm" icon={Users}>
          Session Details
        </SectionHeading>
        <Input
          label="Session Title"
          placeholder={t('ptm.sessionTitlePlaceholder', 'e.g., Term 1 Parent-Teacher Meeting')}
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          error={errors.title}
          required
        />
        <Textarea
          label="Description"
          placeholder={t('ptm.notesPlaceholder', 'Optional context for parents and staff')}
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          error={errors.description}
          rows={3}
        />
      </div>

      <Divider />

      <div className="space-y-4">
        <SectionHeading as="h3" size="sm" icon={Calendar}>
          Schedule
        </SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Session Date"
            value={form.sessionDate}
            onChange={(e) => handleChange('sessionDate', e.target.value)}
            error={errors.sessionDate}
            startContent={<Calendar size={16} aria-hidden="true" />}
            required
          />
          <Input
            type="number"
            label="Slot Duration (min)"
            min={5}
            max={120}
            value={String(form.slotDuration)}
            onChange={(e) => handleChange('slotDuration', e.target.value)}
            error={errors.slotDuration}
            startContent={<Clock size={16} aria-hidden="true" />}
          />
          <Input
            type="time"
            label="Start Time"
            value={form.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
            error={errors.startTime}
            startContent={<Clock size={16} aria-hidden="true" />}
            required
          />
          <Input
            type="time"
            label="End Time"
            value={form.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
            error={errors.endTime}
            startContent={<Clock size={16} aria-hidden="true" />}
            required
          />
        </div>
      </div>

      <Divider />

      <div className="space-y-4">
        <SectionHeading as="h3" size="sm" icon={Users}>
          Assignment
        </SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Class"
            placeholder={t('ptm.selectClassPlaceholder', 'Select class')}
            value={form.classId}
            onChange={(e) => handleChange('classId', e.target.value)}
            error={errors.classId}
            required
            options={classes.map((cls) => ({
              value: cls._id,
              label: `${cls.name}${cls.section ? ` (${cls.section})` : ''}`,
            }))}
          />
          <Select
            label="Teacher"
            placeholder={t('ptm.selectTeacherPlaceholder', 'Select teacher')}
            value={form.staffId}
            onChange={(e) => handleChange('staffId', e.target.value)}
            error={errors.staffId}
            required
            options={staff.map((teacher) => ({ value: teacher._id, label: teacher.name }))}
          />
        </div>
        <div className="mt-4">
          <Input
            label="Venue"
            placeholder={t('ptm.venuePlaceholder', 'e.g., Main Hall')}
            value={form.venue}
            onChange={(e) => handleChange('venue', e.target.value)}
            error={errors.venue}
            startContent={<MapPin size={16} aria-hidden="true" />}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" type="button" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={saving}>
          Create Session
        </Button>
      </div>
    </form>
  );
};

export default CreatePTMSessionModal;
