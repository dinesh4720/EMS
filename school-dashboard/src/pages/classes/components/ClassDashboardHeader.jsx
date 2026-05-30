import {
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
} from "@heroui/react";
import {
  MessageSquare, AlertCircle,
  Download, MoreVertical, Send, Clock, GraduationCap, Settings as SettingsIcon,
  Pencil, Trash2,
} from "lucide-react";
import { useTranslation } from 'react-i18next';

export function ClassDashboardHeader({
  cls,
  headerStats,
  studentCount,
  navigate,
  handleExportReport,
  handleSendNotice,
  setActiveTab,
  setIsAssignTeacherModalOpen,
  openSettings,
  onEditClass,
  onDeleteClass,
}) {
  const { t } = useTranslation();

  const initials = `${(cls?.name || '').replace(/Class\s*/i, '').trim() || 'C'}${cls?.section || ''}`;
  const hasTeacher = Boolean(cls?.classTeacherId);

  return (
    <>
      {/* Hero — class identity + actions */}
      <div className="class-dashboard__hero">
        <div className="class-dashboard__hero-main">
          <div className="class-dashboard__hero-avatar" aria-hidden>
            {initials}
          </div>
          <div className="class-dashboard__hero-info">
            <h1 className="class-dashboard__hero-name">
              {cls?.name || 'N/A'} · {t('classes.section', 'Section')} {cls?.section || 'N/A'}
            </h1>
            <div className="row gap-2 subtle" style={{ fontSize: 13, flexWrap: 'wrap' }}>
              <span className="mono tnum">
                {studentCount ?? cls?.studentCount ?? 0}/{cls?.strengthLimit?.current || 40}
              </span>
              <span>{t('classes.students', 'Students')}</span>
              {cls?.room && (
                <>
                  <span>·</span>
                  <span>{t('classes.room', 'Room')} {cls.room}</span>
                </>
              )}
            </div>

            <div className="class-dashboard__hero-meta">
              {hasTeacher ? (
                <span className="status status--ok">
                  <span className="dot" />
                  <button
                    type="button"
                    onClick={() => navigate(`/staffs/${cls.classTeacherId}`)}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer', font: 'inherit' }}
                  >
                    {cls?.teacher || t('classes.classTeacher', 'Class Teacher')}
                  </button>
                </span>
              ) : (
                <span className="status status--warn">
                  <AlertCircle size={11} />
                  <button
                    type="button"
                    onClick={() => setIsAssignTeacherModalOpen(true)}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}
                  >
                    {t('classes.assignTeacher', 'Assign teacher')}
                  </button>
                </span>
              )}
              {cls?.code && <span className="chip mono tnum">{cls.code}</span>}
            </div>
          </div>
        </div>

        <div className="class-dashboard__hero-actions">
          <button type="button" className="btn" onClick={() => navigate('/messaging')}>
            <MessageSquare size={13} aria-hidden /> {t('pages.message1', 'Message')}
          </button>
          <button type="button" className="btn" onClick={openSettings}>
            <SettingsIcon size={13} aria-hidden /> {t('common.settings', 'Settings')}
          </button>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button type="button" className="iconbtn" style={{ width: 32, height: 32 }} aria-label="More actions">
                <MoreVertical size={16} />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Class admin actions" className="min-w-[180px]">
              <DropdownItem key="export" startContent={<Download size={14} aria-hidden />} onPress={handleExportReport}>
                {t('pages.exportReport', 'Export report')}
              </DropdownItem>
              <DropdownItem key="notice" startContent={<Send size={14} aria-hidden />} onPress={handleSendNotice}>
                {t('pages.sendNotice', 'Send notice')}
              </DropdownItem>
              <DropdownItem key="timetable" startContent={<Clock size={14} aria-hidden />} onPress={() => setActiveTab('timetable')}>
                {t('pages.viewTimetable', 'View timetable')}
              </DropdownItem>
              <DropdownItem key="settings" startContent={<GraduationCap size={14} aria-hidden />} onPress={openSettings}>
                {t('common.settings', 'Settings')}
              </DropdownItem>
              <DropdownItem key="edit" startContent={<Pencil size={14} aria-hidden />} onPress={onEditClass}>
                {t('classes.editClass', 'Edit class')}
              </DropdownItem>
              <DropdownItem key="delete" startContent={<Trash2 size={14} aria-hidden />} onPress={onDeleteClass} color="danger" className="text-danger">
                {t('classes.deleteClass', 'Delete class')}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Metric strip — dp-metric atoms; mono tnum so values align */}
      <div className="class-dashboard__metrics">
        {headerStats.map((stat) => (
          <div className="dp-metric" key={stat.label}>
            <span className="dp-metric__label">{stat.label}</span>
            <span className="dp-metric__value mono tnum">{stat.value}</span>
            {stat.subtext && <span className="dp-metric__sub subtle">{stat.subtext}</span>}
          </div>
        ))}
      </div>
    </>
  );
}
