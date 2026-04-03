import {
  Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
} from "@heroui/react";
import {
  MessageSquare, Users, AlertCircle,
  Download, MoreVertical, Send, Clock, GraduationCap,
} from "lucide-react";
import { useTranslation } from 'react-i18next';

export function ClassDashboardHeader({
  cls,
  headerStats,
  navigate,
  handleExportReport,
  handleSendNotice,
  setActiveTab,
  setIsAssignTeacherModalOpen,
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
      {/* Top row: class info + actions */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-gray-600 dark:text-zinc-400">
              {cls?.name?.replace("Class ", "")}{cls?.section}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
              {cls?.name || 'N/A'} - {t('classes.section', 'Section')} {cls?.section || 'N/A'}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-zinc-400 flex-wrap">
              <span>{cls?.studentCount || 0} {t('classes.students', 'Students')}</span>
              <span className="text-gray-300 dark:text-zinc-600">·</span>
              <span>{cls?.strengthLimit?.current || 40} {t('classes.capacity', 'Capacity')}</span>
              {cls?.room && (<><span className="text-gray-300 dark:text-zinc-600">·</span><span>{t('classes.room', 'Room')} {cls.room}</span></>)}
            </div>
            {cls?.classTeacherId ? (
              <div className="flex items-center gap-2 mt-1.5">
                <Users size={12} className="text-gray-400 dark:text-zinc-500" />
                <span
                  className="text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 cursor-pointer"
                  onClick={() => navigate(`/staffs/${cls.classTeacherId}`)}
                >
                  {cls?.teacher || t('classes.classTeacher', 'Class Teacher')}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1.5">
                <AlertCircle size={12} className="text-amber-500" />
                <span className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.noClassTeacherAssigned')}</span>
                <button onClick={() => setIsAssignTeacherModalOpen(true)} className="text-xs font-medium text-blue-600 hover:text-blue-800 underline">
                  {t('classes.assign', 'Assign')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300" startContent={<MessageSquare size={14} />}
            onPress={() => navigate('/messaging')}>{t('pages.message1')}</Button>
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"><MoreVertical size={16} /></Button>
            </DropdownTrigger>
            <DropdownMenu className="min-w-[180px]">
              <DropdownItem key="export" startContent={<Download size={14} className="text-gray-400" />} onPress={handleExportReport}>{t('pages.exportReport')}</DropdownItem>
              <DropdownItem key="notice" startContent={<Send size={14} className="text-gray-400" />} onPress={handleSendNotice}>{t('pages.sendNotice')}</DropdownItem>
              <DropdownItem key="timetable" startContent={<Clock size={14} className="text-gray-400" />} onPress={() => setActiveTab("timetable")}>{t('pages.viewTimetable')}</DropdownItem>
              <DropdownItem key="settings" startContent={<GraduationCap size={14} className="text-gray-400" />} onPress={() => setActiveTab("settings")}>{t('common.settings', 'Settings')}</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* KPI stat cards row — always visible */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {headerStats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
            <div className={`w-9 h-9 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center flex-shrink-0`}>
              <stat.icon size={16} className={stat.color} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100 leading-tight">{stat.value}</p>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate">{stat.subtext}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
