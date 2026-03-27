import { useState, useEffect, useCallback } from 'react';
import {
  Card, CardBody, Chip, Button, Modal, ModalContent, ModalHeader,
  ModalBody, ModalFooter, Input, Select, SelectItem, Textarea,
  Breadcrumbs, BreadcrumbItem,
} from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import {
  Users, Calendar, Clock, Plus, Eye, Trash2, Home, MapPin,
  CheckCircle, XCircle, AlertCircle, BookOpen, UserPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../services/api';
import { ptmApi } from '../../services/api/extensions';
import { PageLayout, MinimalButton } from '../../components/ui';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  scheduled: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
  ongoing: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300',
  completed: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300',
  cancelled: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300',
};

const EMPTY_FORM = {
  title: '', description: '', sessionDate: '', startTime: '', endTime: '',
  slotDuration: 15, classId: '', staffId: '', venue: '', status: 'scheduled',
};

export default function PTMPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailSession, setDetailSession] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '' });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [errors, setErrors] = useState({});
  const [bookSlotForm, setBookSlotForm] = useState({ parentName: '', studentId: '', scheduledTime: '', notes: '' });
  const [bookingSlot, setBookingSlot] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [classStudents, setClassStudents] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessRes, classRes, staffRes] = await Promise.all([
        ptmApi.getAll(),
        request('/classes'),
        request('/staff'),
      ]);
      setSessions(sessRes?.data || sessRes || []);
      setClasses(classRes?.classes || classRes || []);
      setStaff(staffRes?.staff || staffRes || []);
    } catch {
      toast.error('Failed to load PTM sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    const newErrors = {};
    if (!form.title) newErrors.title = 'Session title is required';
    if (!form.sessionDate) newErrors.sessionDate = 'Session date is required';
    if (!form.startTime) newErrors.startTime = 'Start time is required';
    if (!form.endTime) newErrors.endTime = 'End time is required';
    if (!form.classId) newErrors.classId = 'Class is required';
    if (!form.staffId) newErrors.staffId = 'Teacher is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill all required fields');
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error('Start time must be before end time');
      return;
    }
    // Check for overlapping sessions on same date for same class or same staff
    const sameDay = sessions.filter(s =>
      s.sessionDate?.split('T')[0] === form.sessionDate &&
      s.status !== 'cancelled' &&
      (s.classId === form.classId || String(s.classId) === form.classId ||
       s.staffId === form.staffId || String(s.staffId) === form.staffId)
    );
    const overlapping = sameDay.find(s =>
      s.startTime < form.endTime && form.startTime < s.endTime
    );
    if (overlapping) {
      toast.error(`Time slot overlaps with existing session: "${overlapping.title}" (${overlapping.startTime}–${overlapping.endTime})`);
      return;
    }
    setSaving(true);
    try {
      await ptmApi.create({ ...form, slotDuration: Number(form.slotDuration) });
      toast.success('PTM session created');
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      fetchData();
    } catch (e) {
      toast.error(e?.message || 'Failed to create PTM session');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await ptmApi.delete(deleteModal.id);
      toast.success('PTM session cancelled');
      setDeleteModal({ open: false, id: null, title: '' });
      fetchData();
    } catch {
      toast.error('Failed to cancel session');
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await ptmApi.getById(id);
      const session = res?.data || res;
      setDetailSession(session);
      // Fetch students for the session's class so admin can select a student when booking
      const classId = session?.classId?._id || session?.classId;
      if (classId) {
        try {
          const studentsRes = await request(`/students?classId=${classId}`);
          setClassStudents(studentsRes?.students || studentsRes || []);
        } catch {
          setClassStudents([]);
        }
      }
    } catch {
      toast.error('Failed to load session details');
    }
  };

  const handleBookSlot = async () => {
    if (!bookSlotForm.parentName.trim()) {
      toast.error('Parent name is required');
      return;
    }
    if (!bookSlotForm.studentId) {
      toast.error('Please select a student');
      return;
    }
    if (!bookSlotForm.scheduledTime) {
      toast.error('Scheduled time is required');
      return;
    }
    setBookingSlot(true);
    try {
      const res = await ptmApi.addSlot(detailSession._id, {
        parentName: bookSlotForm.parentName,
        studentId: bookSlotForm.studentId || undefined,
        scheduledTime: bookSlotForm.scheduledTime,
        notes: bookSlotForm.notes || undefined,
      });
      toast.success('Slot booked successfully');
      setBookSlotForm({ parentName: '', studentId: '', scheduledTime: '', notes: '' });
      // Refresh detail
      const updated = await ptmApi.getById(detailSession._id);
      setDetailSession(updated?.data || updated);
      fetchData();
    } catch (e) {
      toast.error(e?.message || 'Failed to book slot');
    } finally {
      setBookingSlot(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setChangingStatus(true);
    try {
      await ptmApi.update(detailSession._id, { status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
      const updated = await ptmApi.getById(detailSession._id);
      setDetailSession(updated?.data || updated);
      fetchData();
    } catch (e) {
      toast.error(e?.message || 'Failed to update status');
    } finally {
      setChangingStatus(false);
    }
  };

  const filtered = statusFilter === 'all' ? sessions : sessions.filter(s => s.status === statusFilter);

  const stats = {
    total: sessions.length,
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length,
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Breadcrumbs size="sm">
          <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate('/')}>Home</BreadcrumbItem>
          <BreadcrumbItem>Parent-Teacher Meetings</BreadcrumbItem>
        </Breadcrumbs>
      </div>

      <PageLayout
        header={{ title: 'Parent-Teacher Meetings', description: 'Schedule and manage PTM sessions' }}
        actions={
          <MinimalButton icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            New PTM Session
          </MinimalButton>
        }
        noPadding
      >
        <div className="p-6 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total, cls: 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-zinc-100' },
              { label: 'Scheduled', value: stats.scheduled, cls: 'bg-blue-50 dark:bg-blue-950 border-blue-100 dark:border-blue-900 text-blue-700 dark:text-blue-300' },
              { label: 'Completed', value: stats.completed, cls: 'bg-green-50 dark:bg-green-950 border-green-100 dark:border-green-900 text-green-700 dark:text-green-300' },
              { label: 'Cancelled', value: stats.cancelled, cls: 'bg-red-50 dark:bg-red-950 border-red-100 dark:border-red-900 text-red-700 dark:text-red-300' },
            ].map(s => (
              <div key={s.label} className={`rounded-lg p-3 border ${s.cls}`}>
                <p className="text-xs opacity-70">{s.label}</p>
                {loading ? (
                  <div className="h-7 w-8 bg-current opacity-20 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-xl font-semibold">{s.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'scheduled', 'ongoing', 'completed', 'cancelled'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === s
                    ? 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent'
                    : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:border-gray-400'
                }`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Sessions list */}
          {loading ? (
            <TablePageSkeleton />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
              <p className="text-gray-500 dark:text-zinc-400 mb-4">No PTM sessions found</p>
              <MinimalButton icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
                Create First Session
              </MinimalButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(session => {
                const cls = session.classId;
                const teacher = session.staffId;
                return (
                  <Card
                    key={session._id}
                    shadow="sm"
                    className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 hover:shadow-md transition-shadow"
                  >
                    <CardBody className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-zinc-100 line-clamp-1">{session.title}</h3>
                        <Chip size="sm" variant="flat" className={STATUS_COLORS[session.status] || ''}>
                          {session.status}
                        </Chip>
                      </div>

                      {session.description && (
                        <p className="text-sm text-gray-500 dark:text-zinc-400 line-clamp-2">{session.description}</p>
                      )}

                      <div className="space-y-1.5 text-sm text-gray-600 dark:text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(session.sessionDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          {session.startTime} – {session.endTime}
                          <span className="text-xs text-gray-400">({session.slotDuration} min slots)</span>
                        </div>
                        {session.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-400" />
                            {session.venue}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                        <div className="text-xs text-gray-500 dark:text-zinc-400 space-y-0.5">
                          {cls && <div>{cls.name}{cls.section ? ` (${cls.section})` : ''}</div>}
                          {teacher && <div className="text-gray-400">{teacher.name}</div>}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleViewDetail(session._id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            title="View details"
                          >
                            <Eye size={15} className="text-gray-500 dark:text-zinc-400" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, id: session._id, title: session.title })}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                            title="Cancel session"
                          >
                            <Trash2 size={15} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PageLayout>

      {/* Create Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setForm(EMPTY_FORM); setErrors({}); }}
        size="2xl"
        scrollBehavior="inside"
        classNames={{ backdrop: 'bg-black/30', base: 'bg-white dark:bg-zinc-950' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4 px-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <Users size={20} className="text-gray-600 dark:text-zinc-300" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">New PTM Session</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal">Schedule a parent-teacher meeting</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="px-6 py-4 space-y-4">
            <Input
              label="Session Title *"
              placeholder="e.g. Term 1 PTM - Class 10A"
              value={form.title}
              onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(prev => ({ ...prev, title: '' })); }}
              variant="bordered"
              classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
              isInvalid={!!errors.title}
              errorMessage={errors.title}
            />
            <Textarea
              label="Description"
              placeholder="Optional notes or agenda"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              variant="bordered"
              classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Session Date *"
                type="date"
                value={form.sessionDate}
                onChange={e => { setForm(p => ({ ...p, sessionDate: e.target.value })); setErrors(prev => ({ ...prev, sessionDate: '' })); }}
                variant="bordered"
                classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
                isInvalid={!!errors.sessionDate}
                errorMessage={errors.sessionDate}
              />
              <Input
                label="Slot Duration (min)"
                type="number"
                min={5}
                max={120}
                value={String(form.slotDuration)}
                onChange={e => setForm(p => ({ ...p, slotDuration: Number(e.target.value) }))}
                variant="bordered"
                classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
              />
              <Input
                label="Start Time *"
                type="time"
                value={form.startTime}
                onChange={e => { setForm(p => ({ ...p, startTime: e.target.value })); setErrors(prev => ({ ...prev, startTime: '' })); }}
                variant="bordered"
                classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
                isInvalid={!!errors.startTime}
                errorMessage={errors.startTime}
              />
              <Input
                label="End Time *"
                type="time"
                value={form.endTime}
                onChange={e => { setForm(p => ({ ...p, endTime: e.target.value })); setErrors(prev => ({ ...prev, endTime: '' })); }}
                variant="bordered"
                classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
                isInvalid={!!errors.endTime}
                errorMessage={errors.endTime}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Class *"
                placeholder="Select class"
                selectedKeys={form.classId ? [form.classId] : []}
                onSelectionChange={keys => { setForm(p => ({ ...p, classId: [...keys][0] || '' })); setErrors(prev => ({ ...prev, classId: '' })); }}
                variant="bordered"
                classNames={{ trigger: 'dark:border-zinc-700' }}
                isInvalid={!!errors.classId}
                errorMessage={errors.classId}
              >
                {classes.map(c => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}{c.section ? ` (${c.section})` : ''}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Teacher *"
                placeholder="Select teacher"
                selectedKeys={form.staffId ? [form.staffId] : []}
                onSelectionChange={keys => { setForm(p => ({ ...p, staffId: [...keys][0] || '' })); setErrors(prev => ({ ...prev, staffId: '' })); }}
                variant="bordered"
                classNames={{ trigger: 'dark:border-zinc-700' }}
                isInvalid={!!errors.staffId}
                errorMessage={errors.staffId}
              >
                {staff.map(s => (
                  <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                ))}
              </Select>
            </div>
            <Input
              label="Venue"
              placeholder="e.g. Room 101, Auditorium"
              value={form.venue}
              onChange={e => setForm(p => ({ ...p, venue: e.target.value }))}
              variant="bordered"
              classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
            />
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
            <Button variant="light" onPress={() => { setCreateOpen(false); setForm(EMPTY_FORM); setErrors({}); }}>Cancel</Button>
            <Button
              className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
              onPress={handleCreate}
              isLoading={saving}
            >
              Create Session
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Detail Modal */}
      {detailSession && (
        <Modal
          isOpen={!!detailSession}
          onClose={() => setDetailSession(null)}
          size="2xl"
          scrollBehavior="inside"
          classNames={{ backdrop: 'bg-black/30', base: 'bg-white dark:bg-zinc-950' }}
        >
          <ModalContent>
            <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4 px-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{detailSession.title}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal">
                  {new Date(detailSession.sessionDate).toLocaleDateString()} · {detailSession.startTime}–{detailSession.endTime}
                </p>
              </div>
            </ModalHeader>
            <ModalBody className="px-6 py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-zinc-400 text-xs mb-1">Class</p>
                    <p className="text-gray-900 dark:text-zinc-100">
                      {detailSession.classId?.name}{detailSession.classId?.section ? ` (${detailSession.classId.section})` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-zinc-400 text-xs mb-1">Teacher</p>
                    <p className="text-gray-900 dark:text-zinc-100">{detailSession.staffId?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-zinc-400 text-xs mb-1">Slot Duration</p>
                    <p className="text-gray-900 dark:text-zinc-100">{detailSession.slotDuration} minutes</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-zinc-400 text-xs mb-1">Venue</p>
                    <p className="text-gray-900 dark:text-zinc-100">{detailSession.venue || '—'}</p>
                  </div>
                </div>

                {/* Book slot on behalf of parent */}
                {detailSession.status !== 'cancelled' && detailSession.status !== 'completed' && (
                  <div className="border border-blue-100 dark:border-blue-900 rounded-lg p-3 bg-blue-50 dark:bg-blue-950/30">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1.5">
                      <UserPlus size={13} /> Book Slot (Admin)
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Input
                        size="sm"
                        label="Parent Name *"
                        value={bookSlotForm.parentName}
                        onChange={e => setBookSlotForm(p => ({ ...p, parentName: e.target.value }))}
                        variant="bordered"
                        classNames={{ input: 'dark:text-zinc-100 text-xs', inputWrapper: 'dark:border-zinc-700' }}
                      />
                      <Select
                        size="sm"
                        label="Student *"
                        placeholder="Select student"
                        selectedKeys={bookSlotForm.studentId ? [bookSlotForm.studentId] : []}
                        onSelectionChange={keys => setBookSlotForm(p => ({ ...p, studentId: [...keys][0] || '' }))}
                        variant="bordered"
                        classNames={{ trigger: 'dark:border-zinc-700 text-xs' }}
                      >
                        {classStudents.filter(s => s._id || s.id).map(s => (
                          <SelectItem key={s._id || s.id} textValue={s.name}>
                            {s.name}{s.rollNo ? ` (${s.rollNo})` : ''}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Input
                        size="sm"
                        label="Time Slot *"
                        type="time"
                        value={bookSlotForm.scheduledTime}
                        onChange={e => setBookSlotForm(p => ({ ...p, scheduledTime: e.target.value }))}
                        variant="bordered"
                        classNames={{ input: 'dark:text-zinc-100 text-xs', inputWrapper: 'dark:border-zinc-700' }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        size="sm"
                        label="Notes (optional)"
                        value={bookSlotForm.notes}
                        onChange={e => setBookSlotForm(p => ({ ...p, notes: e.target.value }))}
                        variant="bordered"
                        className="flex-1"
                        classNames={{ input: 'dark:text-zinc-100 text-xs', inputWrapper: 'dark:border-zinc-700' }}
                      />
                      <Button
                        size="sm"
                        className="bg-blue-600 text-white shrink-0"
                        isLoading={bookingSlot}
                        onPress={handleBookSlot}
                      >
                        Book Slot
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                    Booked Slots ({detailSession.slots?.filter(s => s.status !== 'cancelled').length || 0})
                  </p>
                  {!detailSession.slots?.length ? (
                    <p className="text-sm text-gray-400 dark:text-zinc-500">No slots booked yet</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {detailSession.slots.map(slot => (
                        <div
                          key={slot._id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{slot.parentName}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">
                              {slot.studentId?.name || 'Student'} · {slot.scheduledTime}
                            </p>
                          </div>
                          <Chip size="sm" variant="flat" className={
                            slot.status === 'completed' ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' :
                            slot.status === 'cancelled' ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' :
                            'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }>
                            {slot.status}
                          </Chip>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-gray-100 dark:border-zinc-800 flex-col gap-3 items-stretch">
              {/* Status change */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-zinc-400 shrink-0">Change status:</span>
                {['scheduled', 'ongoing', 'completed', 'cancelled'].filter(s => s !== detailSession.status).map(s => (
                  <Button
                    key={s}
                    size="sm"
                    variant="flat"
                    isLoading={changingStatus}
                    className={
                      s === 'completed' ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs' :
                      s === 'ongoing' ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 text-xs' :
                      s === 'cancelled' ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs' :
                      'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs'
                    }
                    onPress={() => handleStatusChange(s)}
                  >
                    → {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
              <div className="flex justify-end">
                <Button variant="light" onPress={() => setDetailSession(null)}>Close</Button>
              </div>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, title: '' })}
        size="sm"
        classNames={{ backdrop: 'bg-black/30', base: 'bg-white dark:bg-zinc-950' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-950 rounded-lg">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Cancel Session</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal">This cannot be undone</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-4">
            <p className="text-sm text-gray-600 dark:text-zinc-300">
              Cancel <span className="font-medium">{deleteModal.title}</span>? All booked slots will be affected.
            </p>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
            <Button variant="light" onPress={() => setDeleteModal({ open: false, id: null, title: '' })}>Keep</Button>
            <Button color="danger" onPress={handleDelete}>Cancel Session</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
