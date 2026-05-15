import { useState, useMemo } from 'react';
import SkeletonList from '../../../../components/skeletons/SkeletonList';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Spinner,
  Switch,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import {
  Search,
  Edit,
  Trash2,
  Copy,
  Power,
  PowerOff,
  MoreVertical,
  Bell,
  DollarSign,
  Calendar,
  BookOpen,
  Users,
  ChevronDown,
  Filter,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../../../hooks/useConfirmDialog';

const REMINDER_TYPE_CONFIG = {
  fee: { icon: DollarSign, color: 'warning', gradient: 'from-amber-500 to-orange-500', bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-500/10', textLight: 'text-amber-600', textDark: 'dark:text-amber-400', borderLight: 'border-amber-200', borderDark: 'dark:border-amber-500/20' },
  attendance: { icon: Users, color: 'danger', gradient: 'from-rose-500 to-pink-500', bgLight: 'bg-rose-50', bgDark: 'dark:bg-rose-500/10', textLight: 'text-rose-600', textDark: 'dark:text-rose-400', borderLight: 'border-rose-200', borderDark: 'dark:border-rose-500/20' },
  academic: { icon: BookOpen, color: 'primary', gradient: 'from-indigo-500 to-blue-500', bgLight: 'bg-indigo-50', bgDark: 'dark:bg-indigo-500/10', textLight: 'text-indigo-600', textDark: 'dark:text-indigo-400', borderLight: 'border-indigo-200', borderDark: 'dark:border-indigo-500/20' },
  event: { icon: Calendar, color: 'success', gradient: 'from-emerald-500 to-green-500', bgLight: 'bg-emerald-50', bgDark: 'dark:bg-emerald-500/10', textLight: 'text-emerald-600', textDark: 'dark:text-emerald-400', borderLight: 'border-emerald-200', borderDark: 'dark:border-emerald-500/20' },
};

export default function RemindersList({
  reminders = [],
  loading = false,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
}) {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const REMINDER_TYPES = useMemo(() => ({
    fee: { ...REMINDER_TYPE_CONFIG.fee, label: t('constants.reminders.types.fee') },
    attendance: { ...REMINDER_TYPE_CONFIG.attendance, label: t('constants.reminders.types.attendance') },
    academic: { ...REMINDER_TYPE_CONFIG.academic, label: t('constants.reminders.types.academic') },
    event: { ...REMINDER_TYPE_CONFIG.event, label: t('constants.reminders.types.event') },
  }), [t]);
  const TRIGGER_LABELS = useMemo(() => ({
    overdue: t('constants.reminders.triggers.overdue'),
    due_soon: t('constants.reminders.triggers.dueSoon'),
    partial_payment: t('constants.reminders.triggers.partialPayment'),
    no_payment: t('constants.reminders.triggers.noPayment'),
    absent_3_days: t('constants.reminders.triggers.absent3Days'),
    below_75: t('constants.reminders.triggers.below75'),
    absent_today: t('constants.reminders.triggers.absentToday'),
    assignment_due: t('constants.reminders.triggers.assignmentDue'),
    exam_scheduled: t('constants.reminders.triggers.examScheduled'),
    grades_declined: t('constants.reminders.triggers.gradesDeclined'),
    before_event: t('constants.reminders.triggers.beforeEvent'),
    after_event: t('constants.reminders.triggers.afterEvent'),
    event_today: t('constants.reminders.triggers.eventToday'),
  }), [t]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredReminders = useMemo(() => {
    return reminders.filter((reminder) => {
      const matchesSearch =
        reminder.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reminder.message?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || reminder.type === typeFilter;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && reminder.active) ||
        (statusFilter === 'inactive' && !reminder.active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [reminders, searchQuery, typeFilter, statusFilter]);

  const handleToggle = async (reminder) => {
    try {
      await onToggle(reminder._id, !reminder.active);
      toast.success(`Reminder ${reminder.active ? 'disabled' : 'enabled'}`);
    } catch (error) {
      toast.error(t('toast.error.failedToToggleReminder'));
    }
  };

  const handleDelete = (reminderId) => {
    showConfirm({
      title: 'Delete Reminder',
      message: t('confirm.deleteReminder'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await onDelete(reminderId);
          toast.success(t('toast.success.reminderDeleted'));
        } catch (error) {
          toast.error(t('toast.error.failedToDeleteReminder'));
        }
      },
    });
  };

  const handleDuplicate = async (reminder) => {
    try {
      await onDuplicate(reminder);
      toast.success(t('toast.success.reminderDuplicated'));
    } catch (error) {
      toast.error(t('toast.error.failedToDuplicateReminder'));
    }
  };

  const getTypeInfo = (type) => {
    return REMINDER_TYPES[type] || {
      label: type,
      icon: Bell,
      color: 'default',
      gradient: 'from-gray-500 to-gray-600',
      bgLight: 'bg-gray-50',
      bgDark: 'dark:bg-gray-500/10',
      textLight: 'text-gray-600',
      textDark: 'dark:text-gray-400',
      borderLight: 'border-gray-200',
      borderDark: 'dark:border-gray-500/20',
    };
  };

  const getTriggerLabel = (trigger) => {
    return TRIGGER_LABELS[trigger] || trigger;
  };

  if (loading) {
    return <SkeletonList items={4} avatar={true} title={true} subtitle={true} className="p-4" />;
  }

  return (
    <div className="space-y-4 w-full p-4">
      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-surface-2 rounded-xl border border-border-token transition-all duration-200 focus-within:border-accent-border focus-within:ring-2 focus-within:ring-accent/10">
            <Search size={16} className="text-fg-faint" />
            <input
              type="text"
              placeholder={t('pages.searchReminders')}
              className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-fg-muted"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-2 flex-wrap">
          {/* Type Filter */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                size="sm"
                variant="flat"
                className="bg-surface-2 border border-border-token rounded-xl px-4 py-2.5 h-auto font-medium text-fg-muted hover:bg-surface-hover transition-all duration-200"
              >
                <Filter size={14} className="text-gray-400" />
                <span>Type: </span>
                <span className="text-fg">
                  {typeFilter === 'all' ? t('constants.reminders.types.all') : REMINDER_TYPES[typeFilter]?.label}
                </span>
                <ChevronDown size={14} className="text-gray-400 ml-1" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              selectedKeys={[typeFilter]}
              onSelectionChange={(keys) => setTypeFilter(Array.from(keys)[0])}
              className="rounded-xl"
              itemClasses={{
                base: "rounded-lg",
              }}
            >
              <DropdownItem key="all">{t('pages.allTypes1')}</DropdownItem>
              <DropdownItem key="fee" startContent={<DollarSign size={14} className="text-amber-500" />}>{t('pages.feeReminder')}</DropdownItem>
              <DropdownItem key="attendance" startContent={<Users size={14} className="text-rose-500" />}>{t('pages.attendanceAlert')}</DropdownItem>
              <DropdownItem key="academic" startContent={<BookOpen size={14} className="text-indigo-500" />}>{t('pages.academicReminder')}</DropdownItem>
              <DropdownItem key="event" startContent={<Calendar size={14} className="text-emerald-500" />}>{t('pages.eventReminder')}</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Status Filter */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                size="sm"
                variant="flat"
                className="bg-surface-2 border border-border-token rounded-xl px-4 py-2.5 h-auto font-medium text-fg-muted hover:bg-surface-hover transition-all duration-200"
              >
                <Power size={14} className={statusFilter === 'active' ? 'text-emerald-500' : statusFilter === 'inactive' ? 'text-gray-400' : 'text-gray-400'} />
                <span>Status: </span>
                <span className="text-fg">
                  {statusFilter === 'all' ? 'All' : statusFilter === 'active' ? 'Active' : 'Inactive'}
                </span>
                <ChevronDown size={14} className="text-gray-400 ml-1" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
              className="rounded-xl"
              itemClasses={{
                base: "rounded-lg",
              }}
            >
              <DropdownItem key="all">{t('pages.allStatus1')}</DropdownItem>
              <DropdownItem key="active" startContent={<Power size={14} className="text-emerald-500" />}>{t('pages.active')}</DropdownItem>
              <DropdownItem key="inactive" startContent={<PowerOff size={14} className="text-gray-400" />}>{t('pages.inactive')}</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Results Count */}
      {reminders.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-fg-muted">
          <Sparkles size={12} className="text-accent" />
          <span>
            Showing {filteredReminders.length} of {reminders.length} reminders
          </span>
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-divider">
        <Table
          aria-label={t('aria.misc.reminders')}
          removeWrapper
          classNames={{
            th: "bg-surface-2 text-fg-muted font-semibold text-xs uppercase tracking-wider",
            tr: "hover:bg-surface-2/50 transition-colors duration-150",
            td: "py-3",
          }}
        >
        <TableHeader>
          <TableColumn scope="col">{t('pages.tITLEType')}</TableColumn>
          <TableColumn scope="col">{t('pages.tRIGGER')}</TableColumn>
          <TableColumn scope="col">{t('pages.rECIPIENTSChannels')}</TableColumn>
          <TableColumn scope="col">{t('pages.fREQUENCY')}</TableColumn>
          <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
          <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                  <Bell size={32} className="text-fg-faint" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Sparkles size={14} className="text-white" />
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-1">{t('pages.noRemindersFound')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'Create your first reminder to automate notifications'}
              </p>
            </div>
          }
        >
          {filteredReminders.map((reminder) => {
            const typeInfo = getTypeInfo(reminder.type);
            const TypeIcon = typeInfo.icon;

            return (
              <TableRow key={reminder._id} className="group">
                <TableCell>
                  <div className="max-w-md">
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeInfo.gradient} flex items-center justify-center shadow-sm`}>
                        <TypeIcon size={14} className="text-white" />
                      </div>
                      <span className="font-semibold text-fg">{reminder.title}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[300px] ml-11">
                      {reminder.message}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${typeInfo.bgLight} ${typeInfo.bgDark} ${typeInfo.textLight} ${typeInfo.textDark} border ${typeInfo.borderLight} ${typeInfo.borderDark}`}>
                    {getTriggerLabel(reminder.trigger)}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap gap-1">
                      {reminder.recipients?.map((recipient) => (
                        <span
                          key={recipient.type}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-surface-2 text-fg-muted"
                        >
                          {recipient.type}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-fg-faint font-medium tracking-wide">
                      {reminder.channels?.join(', ').toUpperCase()}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">{reminder.frequency}</span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      size="sm"
                      isSelected={reminder.active}
                      onValueChange={() => handleToggle(reminder)}
                      classNames={{
                        wrapper: "group-data-[selected=true]:bg-gradient-to-r group-data-[selected=true]:from-emerald-500 group-data-[selected=true]:to-green-500",
                      }}
                      thumbIcon={({ isSelected, className }) =>
                        isSelected ? (
                          <Power className={`${className} text-white`} size={12} />
                        ) : (
                          <PowerOff className={`${className} text-gray-400`} size={12} />
                        )
                      }
                    />
                    <span className={`text-xs font-medium ${reminder.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-fg-faint'}`}>
                      {reminder.active ? 'On' : 'Off'}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onEdit(reminder)}
                      className="rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      <Edit size={15} />
                    </Button>

                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="rounded-lg hover:bg-surface-2 text-gray-500"
                        >
                          <MoreVertical size={15} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        className="rounded-xl"
                        itemClasses={{
                          base: "rounded-lg",
                        }}
                      >
                        <DropdownItem
                          key="edit"
                          startContent={<Edit size={15} className="text-gray-500" />}
                          onPress={() => onEdit(reminder)}
                          className="text-gray-700 dark:text-gray-300"
                        >
                          Edit
                        </DropdownItem>
                        <DropdownItem
                          key="duplicate"
                          startContent={<Copy size={15} className="text-indigo-500" />}
                          onPress={() => handleDuplicate(reminder)}
                          className="text-gray-700 dark:text-gray-300"
                        >
                          Duplicate
                        </DropdownItem>
                        <DropdownItem
                          key="toggle"
                          startContent={reminder.active ? <PowerOff size={15} className="text-amber-500" /> : <Power size={15} className="text-emerald-500" />}
                          onPress={() => handleToggle(reminder)}
                          className="text-gray-700 dark:text-gray-300"
                        >
                          {reminder.active ? 'Disable' : 'Enable'}
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          startContent={<Trash2 size={15} className="text-rose-500" />}
                          className="text-rose-500"
                          onPress={() => handleDelete(reminder._id)}
                        >
                          Delete
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
