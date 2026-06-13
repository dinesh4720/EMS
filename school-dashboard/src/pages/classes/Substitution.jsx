import { useState, useEffect, useMemo } from 'react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { UserCheck, Calendar, Clock, Plus, Search, Filter, X, UserPlus, RefreshCw, UserMinus } from 'lucide-react';
import { request } from '../../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { DEFAULT_PERIODS } from '../../utils/constants';
import { useTranslation } from 'react-i18next';
import { toTodayDateString } from '../../utils/dateFormatter';
import logger from '../../utils/logger';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Chip from '../../components/ui/Chip';


export default function Substitution() {
  const { t } = useTranslation();
  const { teachers, classes, schoolSettings } = useApp();
  const [substitutions, setSubstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(toTodayDateString());

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, assigned, not_assigned

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: toTodayDateString(),
    classId: '',
    period: '',
    absentTeacherId: '',
    substituteTeacherId: '',
    reason: '',
    type: 'auto'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Additional modals for assign/change teacher
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isChangeOpen, setIsChangeOpen] = useState(false);
  const [selectedSubstitution, setSelectedSubstitution] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState("");

  // Delete confirmation modal
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Fetch periods from school settings or use default
  const [periods, setPeriods] = useState([]);

  useEffect(() => {
    // Try to get periods from school settings first
    if (schoolSettings?.timetable?.periods && schoolSettings.timetable.periods.length > 0) {
      // Extract period numbers from timetable settings
      const periodNumbers = schoolSettings.timetable.periods
        .filter(p => !p.isBreak)
        .map((p, index) => String(index + 1));
      setPeriods(periodNumbers);
    } else if (schoolSettings?.periods && schoolSettings.periods.length > 0) {
      setPeriods(schoolSettings.periods);
    } else {
      // Fallback to default periods — extract string indices (same shape as timetable branch)
      const periodNumbers = DEFAULT_PERIODS
        .filter(p => !p.isBreak)
        .map((p, index) => String(index + 1));
      setPeriods(periodNumbers);
    }
  }, [schoolSettings]);

  useEffect(() => {
    loadSubstitutions();
  }, [selectedDate]);

  const loadSubstitutions = async () => {
    try {
      setLoading(true);
      const data = await request(`/substitutions?date=${selectedDate}`);
      setSubstitutions(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Error loading substitutions:', error);
      setSubstitutions([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter substitutions
  const filteredSubstitutions = useMemo(() => {
    return substitutions.filter(sub => {
      const searchLower = searchQuery.toLowerCase();
      const keywords = searchLower.split(' ').filter(k => k.length > 0);

      const matchesSearch = keywords.length === 0 || keywords.every(keyword => {
        const searchableText = [
          getClassName(sub.classId),
          sub.period,
          getTeacherName(sub.absentTeacherId),
          getTeacherName(sub.substituteTeacherId),
          sub.reason || ''
        ].join(' ').toLowerCase();

        return searchableText.includes(keyword);
      });

      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [substitutions, searchQuery, statusFilter]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (isSubmitting) return;
    const newErrors = {};
    if (!formData.classId) newErrors.classId = t('toast.error.pleaseFillAllRequiredFields');
    if (!formData.absentTeacherId) newErrors.absentTeacherId = t('toast.error.pleaseFillAllRequiredFields');
    if (!formData.period) newErrors.period = t('toast.error.pleaseFillAllRequiredFields');
    if (!formData.substituteTeacherId) newErrors.substituteTeacherId = t('toast.error.pleaseFillAllRequiredFields');
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error(t('toast.error.pleaseFillAllRequiredFields'));
      return;
    }

    setIsSubmitting(true);
    try {
      await request('/substitutions', { method: 'POST', body: JSON.stringify(formData) });
      toast.success(t('toast.success.substitutionAssignedSuccessfully'));
      setIsCreateOpen(false);
      resetForm();
      loadSubstitutions();
    } catch (error) {
      toast.error(error.message || t('toast.error.failedToAssignSubstitution', 'Failed to assign substitution'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await request(`/substitutions/${id}`, { method: 'DELETE' });
      toast.success(t('toast.success.substitutionRemoved'));
      loadSubstitutions();
    } catch (error) {
      toast.error(t('toast.error.failedToRemoveSubstitution'));
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedTeacher || !selectedSubstitution || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await request(`/substitutions/${selectedSubstitution._id}`, {
        method: 'PUT',
        body: JSON.stringify({ substituteTeacherId: selectedTeacher, status: 'assigned' })
      });
      toast.success(t('toast.success.teacherAssignedSuccessfully'));
      setIsAssignOpen(false);
      setSelectedSubstitution(null);
      setSelectedTeacher("");
      loadSubstitutions();
    } catch (error) {
      toast.error(t('toast.error.failedToAssignTeacher'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeTeacher = async () => {
    if (!selectedTeacher || !selectedSubstitution || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await request(`/substitutions/${selectedSubstitution._id}`, {
        method: 'PUT',
        body: JSON.stringify({ substituteTeacherId: selectedTeacher })
      });
      toast.success(t('toast.success.teacherChangedSuccessfully'));
      setIsChangeOpen(false);
      setSelectedSubstitution(null);
      setSelectedTeacher("");
      loadSubstitutions();
    } catch (error) {
      toast.error(t('toast.error.failedToChangeTeacher'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: toTodayDateString(),
      classId: '',
      period: '',
      absentTeacherId: '',
      substituteTeacherId: '',
      reason: '',
      type: 'auto'
    });
    setFormErrors({});
  };

  const getTeacherName = (teacherId) => {
    if (!teacherId) return t('common.unknown', 'Unknown');
    const tid = String(teacherId);
    const teacher = teachers.find(tc => String(tc.id) === tid || String(tc._id) === tid);
    return teacher ? teacher.name : t('common.unknown', 'Unknown');
  };

  // FIXED: Use String() comparison for ObjectId matching
  const getClassName = (classId) => {
    const cls = classes.find(c => String(c.id) === String(classId) || String(c._id) === String(classId));
    return cls ? `${cls.name}-${cls.section}` : 'Unknown';
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'assigned':
        return <Chip size="sm" color="success">{t('pages.assigned1')}</Chip>;
      case 'not_assigned':
        return <Chip size="sm" color="warning">{t('pages.notAssigned1')}</Chip>;
      case 'pending':
        return <Chip size="sm" color="warning">{t('classes.pending', 'Pending')}</Chip>;
      case 'completed':
        return <Chip size="sm" color="neutral">{t('pages.completed')}</Chip>;
      case 'cancelled':
        return <Chip size="sm" color="danger">{t('classes.cancelled', 'Cancelled')}</Chip>;
      default:
        return <Chip size="sm" color="neutral">{status || t('classes.pending', 'Pending')}</Chip>;
    }
  };

  const getAvailableTeachers = (absentTeacherId) => {
    return teachers.filter(t => {
      const roles = Array.isArray(t.role) ? t.role : (t.role ? [t.role] : []);
      const staffTypes = Array.isArray(t.staffType) ? t.staffType : (t.staffType ? [t.staffType] : []);
      return t.status === 'active' &&
        t._id !== absentTeacherId &&
        t.id !== absentTeacherId &&
        (roles.includes('Teacher') || staffTypes.includes('Teacher') || t.isClassTeacher);
    });
  };

  return (
    <div className="w-full flex flex-col">
      {/* Toolbar — dense, mirrors StaffList density */}
      <div className="toolbar -mx-6 -mt-6 mb-4" style={{ flexWrap: 'wrap' }}>
        <div className="toolbar__search" style={{ flex: '1 1 220px', width: 'auto' }}>
          <Search size={13} aria-hidden />
          <input
            type="text"
            placeholder={t('pages.searchSubstitutions')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search substitutions"
          />
          {searchQuery && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              style={{ padding: '0 4px' }}
            >
              <X size={12} aria-hidden />
            </button>
          )}
        </div>

        <div className="seg" role="tablist" aria-label="Filter status">
          {[
            { key: 'all', label: t('pages.allStatus1') },
            { key: 'assigned', label: t('pages.assigned1') },
            { key: 'not_assigned', label: t('pages.notAssigned1') },
            { key: 'pending', label: 'Pending' },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={statusFilter === f.key}
              className={`seg__btn ${statusFilter === f.key ? 'is-active' : ''}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          aria-label="Date"
          className="attn-date-input"
          style={{ width: 138 }}
        />

        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={loadSubstitutions}
          aria-label="Refresh"
          style={{ marginLeft: 'auto' }}
        >
          <RefreshCw size={13} aria-hidden />
        </button>
        <button type="button" className="btn btn--accent btn--sm" onClick={() => setIsCreateOpen(true)}>
          <Plus size={13} aria-hidden /> {t('classes.newSubstitution', 'New Substitution')}
        </button>
      </div>

      {/* Filter Summary */}
      <div className="flex gap-2 flex-wrap mb-4 px-1">
        {filteredSubstitutions.length > 0 && (
          <Chip size="sm" color="neutral" className="h-6">
            {filteredSubstitutions.length} {t('classes.substitutionsFound', 'substitution(s) found')}
          </Chip>
        )}
        {substitutions.filter(s => s.status === 'assigned' || s.substituteTeacherId).length > 0 && (
          <Chip size="sm" color="success" className="h-6">
            {substitutions.filter(s => s.status === 'assigned' || s.substituteTeacherId).length} {t('classes.assigned', 'assigned')}
          </Chip>
        )}
        {substitutions.filter(s => !s.substituteTeacherId || s.status === 'not_assigned').length > 0 && (
          <Chip size="sm" color="warning" className="h-6">
            {substitutions.filter(s => !s.substituteTeacherId || s.status === 'not_assigned').length} {t('classes.pending', 'pending')}
          </Chip>
        )}
        {(searchQuery || statusFilter !== 'all') && (
          <button
            type="button"
            className="btn btn--ghost btn--sm h-6 px-2 text-xs"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
          >
            {t('common.clearFilters', 'Clear Filters')}
          </button>
        )}
      </div>

      {/* Substitutions Table */}
      {loading ? (
        <TablePageSkeleton />
      ) : filteredSubstitutions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-surface-2 rounded-lg border border-dashed border-divider">
          <Calendar size={48} className="text-fg-faint mb-4" />
          <p className="text-fg-muted font-medium">{t('pages.noSubstitutionsFound')}</p>
          <p className="text-fg-subtle text-sm mt-1">{t('pages.tryChangingTheDateOrFilters')}</p>
          <button
            type="button"
            className="btn btn--accent btn--sm mt-4"
            onClick={() => setIsCreateOpen(true)}
          >
            {t('classes.createSubstitution', 'Create Substitution')}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table" aria-label={t('aria.tables.substitutions')}>
          <thead>
            <tr>
              <th scope="col">{t('pages.cLASS')}</th>
              <th scope="col">{t('classes.periodSubject', 'PERIOD / SUBJECT')}</th>
              <th scope="col">{t('pages.tEACHERAbsent')}</th>
              <th scope="col">{t('pages.sTATUS')}</th>
              <th scope="col">{t('pages.rEASON')}</th>
              <th scope="col" className="text-center">{t('pages.aCTIONS')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubstitutions.map((sub) => (
              <tr key={sub._id}>
                <td>
                  <div className="py-3">
                    <p className="font-semibold text-fg">{getClassName(sub.classId)}</p>
                  </div>
                </td>
                <td>
                  <div className="py-3 flex items-center gap-2">
                    <Clock size={14} className="text-fg-muted" />
                    <span className="font-medium text-sm text-fg">{t('classes.periodN', 'Period {{n}}', { n: sub.period })}</span>
                  </div>
                </td>
                <td>
                  <div className="py-3">
                    <p className="font-medium text-fg text-sm">{getTeacherName(sub.absentTeacherId)}</p>
                  </div>
                </td>
                <td>
                  <div className="py-3 space-y-1">
                    {getStatusChip(sub.status || (sub.substituteTeacherId ? 'assigned' : 'not_assigned'))}
                    {sub.substituteTeacherId && (
                      <p className="text-xs text-fg-muted flex items-center gap-1 mt-1">
                        <span>→</span>
                        <span className="font-medium text-fg">{getTeacherName(sub.substituteTeacherId)}</span>
                      </p>
                    )}
                  </div>
                </td>
                <td>
                  <div className="py-3">
                    <p className="text-sm text-fg-muted truncate max-w-[200px]" title={sub.reason}>{sub.reason || '-'}</p>
                  </div>
                </td>
                <td>
                  <div className="py-3 flex justify-center gap-2">
                    {!sub.substituteTeacherId || sub.status === 'not_assigned' ? (
                      <button
                        type="button"
                        className="btn btn--primary btn--sm font-medium"
                        onClick={() => {
                          setSelectedSubstitution(sub);
                          setIsAssignOpen(true);
                        }}
                      >
                        {t('classes.assign', 'Assign')}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn--sm"
                          onClick={() => {
                            setSelectedSubstitution(sub);
                            setIsChangeOpen(true);
                          }}
                        >
                          {t('classes.change', 'Change')}
                        </button>
                        <button
                          type="button"
                          className="iconbtn"
                          onClick={() => setDeleteConfirmId(sub._id)}
                        >
                          <UserMinus size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setFormErrors({}); }}
        size="lg"
        title={t('pages.createSubstitution')}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setIsCreateOpen(false)}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              className="btn btn--accent"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating…' : t('classes.createSubstitution', 'Create Substitution')}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label={t('pages.date2')}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <Select
            label={t('pages.class1')}
            placeholder={t('pages.selectClass2')}
            value={formData.classId}
            onChange={(e) => {
              setFormData({ ...formData, classId: e.target.value });
              setFormErrors(prev => ({ ...prev, classId: '' }));
            }}
            required
            error={formErrors.classId}
          >
            <option value="">{t('pages.selectClass2')}</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}-{cls.section}
              </option>
            ))}
          </Select>
          <Select
            label={t('pages.period2')}
            placeholder={t('pages.selectPeriod')}
            value={formData.period}
            onChange={(e) => {
              setFormData({ ...formData, period: e.target.value });
              setFormErrors(prev => ({ ...prev, period: '' }));
            }}
            required
            error={formErrors.period}
          >
            <option value="">{t('pages.selectPeriod')}</option>
            {periods.map((p) => (
              <option key={p} value={p}>
                {t('classes.periodN', 'Period {{n}}', { n: p })}
              </option>
            ))}
          </Select>
          <Select
            label={t('pages.absentTeacherOptional')}
            placeholder={t('pages.selectTeacher')}
            value={formData.absentTeacherId}
            onChange={(e) => {
              setFormData({ ...formData, absentTeacherId: e.target.value });
            }}
          >
            <option value="">{t('pages.selectTeacher')}</option>
            {teachers.filter(t => {
              const roles = Array.isArray(t.role) ? t.role : (t.role ? [t.role] : []);
              return roles.includes('Teacher');
            }).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.department})
              </option>
            ))}
          </Select>
          <div className="col-span-2">
            <Select
              label={t('pages.substituteTeacher')}
              placeholder={t('pages.selectSubstitute')}
              value={formData.substituteTeacherId}
              onChange={(e) => {
                setFormData({ ...formData, substituteTeacherId: e.target.value });
                setFormErrors(prev => ({ ...prev, substituteTeacherId: '' }));
              }}
              required
              error={formErrors.substituteTeacherId}
            >
              <option value="">{t('pages.selectSubstitute')}</option>
              {teachers.filter(t => {
                const roles = Array.isArray(t.role) ? t.role : (t.role ? [t.role] : []);
                return roles.includes('Teacher');
              }).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.department})
                </option>
              ))}
            </Select>
          </div>
          <div className="col-span-2">
            <Input
              label={t('pages.reason')}
              placeholder={t('pages.enterReasonForSubstitution')}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Assign Teacher Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        size="md"
        title={t('pages.assignSubstituteTeacher1')}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setIsAssignOpen(false)}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              className="btn btn--accent"
              onClick={handleAssignTeacher}
              disabled={!selectedTeacher || isSubmitting}
            >
              {isSubmitting ? 'Assigning…' : t('classes.assignTeacher', 'Assign Teacher')}
            </button>
          </>
        }
      >
        {selectedSubstitution && (
          <div className="space-y-4">
            <div className="bg-surface-2 rounded-lg p-4 space-y-2">
              <p className="text-fg"><strong>{t('pages.class2')}</strong> {getClassName(selectedSubstitution.classId)}</p>
              <p className="text-fg"><strong>{t('pages.period3')}</strong> {selectedSubstitution.period}</p>
              <p className="text-fg"><strong>{t('pages.absentTeacher1')}</strong> {getTeacherName(selectedSubstitution.absentTeacherId)}</p>
            </div>

            <Select
              label={t('pages.selectSubstituteTeacher')}
              placeholder={t('pages.chooseATeacher')}
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              required
            >
              <option value="">{t('pages.chooseATeacher')}</option>
              {getAvailableTeachers(selectedSubstitution.absentTeacherId).map(teacher => (
                <option key={teacher.id || teacher._id} value={teacher.id || teacher._id}>
                  {teacher.name} ({teacher.department || 'Teacher'})
                </option>
              ))}
            </Select>
          </div>
        )}
      </Modal>

      {/* Change Teacher Modal */}
      <Modal
        isOpen={isChangeOpen}
        onClose={() => setIsChangeOpen(false)}
        size="md"
        title={t('pages.changeSubstituteTeacher')}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setIsChangeOpen(false)}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              className="btn btn--accent"
              onClick={handleChangeTeacher}
              disabled={!selectedTeacher || isSubmitting}
            >
              {isSubmitting ? 'Changing…' : t('classes.changeTeacher', 'Change Teacher')}
            </button>
          </>
        }
      >
        {selectedSubstitution && (
          <div className="space-y-4">
            <div className="bg-surface-2 rounded-lg p-4 space-y-2">
              <p className="text-fg"><strong>{t('pages.class2')}</strong> {getClassName(selectedSubstitution.classId)}</p>
              <p className="text-fg"><strong>{t('pages.currentSubstitute')}</strong> {getTeacherName(selectedSubstitution.substituteTeacherId)}</p>
              <p className="text-fg"><strong>{t('pages.absentTeacher1')}</strong> {getTeacherName(selectedSubstitution.absentTeacherId)}</p>
            </div>

            <Select
              label={t('pages.selectNewTeacher')}
              placeholder={t('pages.chooseANewTeacher')}
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              required
            >
              <option value="">{t('pages.chooseANewTeacher')}</option>
              {getAvailableTeachers(selectedSubstitution.absentTeacherId).map(teacher => (
                <option key={teacher.id || teacher._id} value={teacher.id || teacher._id}>
                  {teacher.name} ({teacher.department || 'Teacher'})
                </option>
              ))}
            </Select>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        size="sm"
        title={t('confirm.removeSubstitutionTitle', 'Remove Substitution')}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setDeleteConfirmId(null)}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => handleDelete(deleteConfirmId)}
            >
              {t('common.remove', 'Remove')}
            </button>
          </>
        }
      >
        <p className="text-fg-muted">{t('confirm.removeSubstitution', 'Are you sure you want to remove this substitution?')}</p>
      </Modal>
    </div>
  );
}
