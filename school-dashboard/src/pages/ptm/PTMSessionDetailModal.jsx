import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, UserPlus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ptmApi, studentsApi } from '../../services/api';
import {
  Modal, Input, Select, Textarea, Button, Chip, Divider, Card, EmptyState,
} from '../../components/ui';
import { ptmSlotSchema, parseFormSchema } from '../../validators/formSchemas';
import { formatShortDate } from '../../utils/dateFormatter';

const STATUS_OPTIONS = ['scheduled', 'ongoing', 'completed', 'cancelled'];

const SLOT_STATUS_COLOR = {
  booked: 'info',
  completed: 'success',
  cancelled: 'danger',
  'no-show': 'warning',
};

const SESSION_STATUS_COLOR = {
  scheduled: 'info',
  ongoing: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

const EMPTY_SLOT = { parentName: '', studentId: '', scheduledTime: '', notes: '' };

const PTMSessionDetailModal = ({ sessionId, onClose, onDataChanged }) => {
  const { t } = useTranslation();
  const isOpen = Boolean(sessionId);
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotForm, setSlotForm] = useState(EMPTY_SLOT);
  const [slotErrors, setSlotErrors] = useState({});
  const [bookingSlot, setBookingSlot] = useState(false);
  const [changingStatus, setChangingStatus] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setStudents([]);
      setSlotForm(EMPTY_SLOT);
      setSlotErrors({});
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await ptmApi.getById(sessionId);
        const data = res?.data || res;
        if (cancelled) return;
        setSession(data);
        const classId = data?.classId?._id || data?.classId;
        if (classId) {
          try {
            const list = await studentsApi.getAll(classId);
            if (!cancelled) setStudents(Array.isArray(list) ? list : list?.data || []);
          } catch {
            if (!cancelled) setStudents([]);
          }
        }
      } catch {
        toast.error('Failed to load session details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const refreshSession = async () => {
    if (!sessionId) return;
    try {
      const res = await ptmApi.getById(sessionId);
      setSession(res?.data || res);
    } catch {
      // ignore — outer load already toasts
    }
  };

  const handleSlotChange = (field, value) => {
    setSlotForm((prev) => ({ ...prev, [field]: value }));
    if (slotErrors[field]) setSlotErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleBookSlot = async (e) => {
    e.preventDefault();
    const candidate = {
      studentId: slotForm.studentId,
      parentName: slotForm.parentName.trim(),
      scheduledTime: slotForm.scheduledTime,
      notes: slotForm.notes.trim(),
    };

    const { success, errors: fieldErrors } = parseFormSchema(ptmSlotSchema, candidate);
    if (!success) {
      setSlotErrors(fieldErrors);
      toast.error(t('toast.error.pleaseFixTheErrorsInTheForm', 'Please fix the errors in the form'));
      return;
    }

    setBookingSlot(true);
    try {
      await ptmApi.addSlot(session._id, candidate);
      toast.success('Slot booked successfully');
      setSlotForm(EMPTY_SLOT);
      await refreshSession();
      onDataChanged?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to book slot');
    } finally {
      setBookingSlot(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!session) return;
    setChangingStatus(status);
    try {
      await ptmApi.update(session._id, { status });
      toast.success(`Status changed to ${status}`);
      await refreshSession();
      onDataChanged?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to update status');
    } finally {
      setChangingStatus(null);
    }
  };

  const allowBooking =
    session && session.status !== 'cancelled' && session.status !== 'completed';

  const visibleSlots = (session?.slots || []).filter((slot) => slot.status !== 'cancelled');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      title={session?.title || 'PTM Session'}
      description={
        session
          ? `${formatShortDate(session.sessionDate)} · ${session.startTime}–${session.endTime}`
          : 'Loading session…'
      }
    >
      {loading || !session ? (
        <div className="space-y-4" role="status" aria-busy="true">
          <div className="h-4 w-2/3 bg-surface-2 rounded animate-pulse" />
          <div className="h-32 bg-surface-2 rounded animate-pulse" />
          <div className="h-24 bg-surface-2 rounded animate-pulse" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card padding="sm" elevation="flat" className="bg-surface-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-fg-muted mb-1">Class</p>
                <p className="text-fg flex items-center gap-1.5">
                  <Users size={14} className="text-fg-faint" aria-hidden="true" />
                  {session.classId?.name}
                  {session.classId?.section ? ` (${session.classId.section})` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-fg-muted mb-1">Teacher</p>
                <p className="text-fg">{session.staffId?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-fg-muted mb-1">Slot Duration</p>
                <p className="text-fg flex items-center gap-1.5">
                  <Clock size={14} className="text-fg-faint" aria-hidden="true" />
                  {session.slotDuration} minutes
                </p>
              </div>
              <div>
                <p className="text-xs text-fg-muted mb-1">Venue</p>
                <p className="text-fg flex items-center gap-1.5">
                  <MapPin size={14} className="text-fg-faint" aria-hidden="true" />
                  {session.venue || '—'}
                </p>
              </div>
              {session.description && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-fg-muted mb-1">Description</p>
                  <p className="text-fg">{session.description}</p>
                </div>
              )}
            </div>
          </Card>

          {allowBooking && (
            <div>
              <h4 className="text-sm font-medium text-fg mb-3 flex items-center gap-2">
                <UserPlus size={16} className="text-fg-faint" aria-hidden="true" />
                Book Slot (Admin)
              </h4>
              <form onSubmit={handleBookSlot} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Parent Name"
                    placeholder="Parent's full name"
                    value={slotForm.parentName}
                    onChange={(e) => handleSlotChange('parentName', e.target.value)}
                    error={slotErrors.parentName}
                    required
                  />
                  <Select
                    label="Student"
                    placeholder={
                      students.length
                        ? t('ptm.selectStudentPlaceholder', 'Select student')
                        : 'No students in this class'
                    }
                    value={slotForm.studentId}
                    onChange={(e) => handleSlotChange('studentId', e.target.value)}
                    error={slotErrors.studentId}
                    disabled={!students.length}
                    required
                    options={students
                      .map((student) => ({
                        value: student._id || student.id,
                        label: `${student.name}${student.rollNo ? ` (${student.rollNo})` : ''}`,
                      }))
                      .filter((opt) => opt.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    type="time"
                    label="Time Slot"
                    value={slotForm.scheduledTime}
                    onChange={(e) => handleSlotChange('scheduledTime', e.target.value)}
                    error={slotErrors.scheduledTime}
                    startContent={<Clock size={16} aria-hidden="true" />}
                    required
                  />
                  <Textarea
                    label="Notes (optional)"
                    placeholder="Anything the teacher should know?"
                    value={slotForm.notes}
                    onChange={(e) => handleSlotChange('notes', e.target.value)}
                    error={slotErrors.notes}
                    rows={2}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="sm" loading={bookingSlot}>
                    Book Slot
                  </Button>
                </div>
              </form>
            </div>
          )}

          <Divider />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-fg">
                Booked Slots ({visibleSlots.length})
              </h4>
              <Chip size="sm" color={SESSION_STATUS_COLOR[session.status] || 'neutral'}>
                {session.status}
              </Chip>
            </div>
            {!session.slots?.length ? (
              <EmptyState
                icon={Calendar}
                size="sm"
                title="No slots booked yet"
                description="Book the first slot for a parent above."
              />
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {session.slots.map((slot) => (
                  <li key={slot._id}>
                    <Card padding="sm" elevation="flat" className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-fg truncate">
                          {slot.parentName}
                        </p>
                        <p className="text-xs text-fg-muted truncate">
                          {slot.studentId?.name || 'Student'} · {slot.scheduledTime}
                        </p>
                      </div>
                      <Chip size="sm" color={SLOT_STATUS_COLOR[slot.status] || 'neutral'}>
                        {slot.status}
                      </Chip>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Divider />

          <div>
            <p className="text-xs font-medium text-fg mb-2">
              Change session status
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.filter((status) => status !== session.status).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant="secondary"
                  loading={changingStatus === status}
                  disabled={changingStatus !== null && changingStatus !== status}
                  onClick={() => handleStatusChange(status)}
                >
                  → {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
              <div className="flex-1" />
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PTMSessionDetailModal;
