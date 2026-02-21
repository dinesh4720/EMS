import { useState, useMemo } from 'react';
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

const REMINDER_TYPES = {
  fee: {
    label: 'Fee Reminder',
    icon: DollarSign,
    color: 'warning',
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-500/10',
    textLight: 'text-amber-600',
    textDark: 'dark:text-amber-400',
    borderLight: 'border-amber-200',
    borderDark: 'dark:border-amber-500/20',
  },
  attendance: {
    label: 'Attendance Alert',
    icon: Users,
    color: 'danger',
    gradient: 'from-rose-500 to-pink-500',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-500/10',
    textLight: 'text-rose-600',
    textDark: 'dark:text-rose-400',
    borderLight: 'border-rose-200',
    borderDark: 'dark:border-rose-500/20',
  },
  academic: {
    label: 'Academic Reminder',
    icon: BookOpen,
    color: 'primary',
    gradient: 'from-indigo-500 to-blue-500',
    bgLight: 'bg-indigo-50',
    bgDark: 'dark:bg-indigo-500/10',
    textLight: 'text-indigo-600',
    textDark: 'dark:text-indigo-400',
    borderLight: 'border-indigo-200',
    borderDark: 'dark:border-indigo-500/20',
  },
  event: {
    label: 'Event Reminder',
    icon: Calendar,
    color: 'success',
    gradient: 'from-emerald-500 to-green-500',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-500/10',
    textLight: 'text-emerald-600',
    textDark: 'dark:text-emerald-400',
    borderLight: 'border-emerald-200',
    borderDark: 'dark:border-emerald-500/20',
  },
};

const TRIGGER_LABELS = {
  overdue: 'Fee Overdue',
  due_soon: 'Fee Due Soon',
  partial_payment: 'Partial Payment',
  no_payment: 'No Payment',
  absent_3_days: 'Absent 3+ Days',
  below_75: 'Below 75%',
  absent_today: 'Absent Today',
  assignment_due: 'Assignment Due',
  exam_scheduled: 'Exam Scheduled',
  grades_declined: 'Grades Declined',
  before_event: 'Before Event',
  after_event: 'After Event',
  event_today: 'Event Today',
};

export default function RemindersList({
  reminders = [],
  loading = false,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
}) {
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
      toast.error('Failed to toggle reminder');
    }
  };

  const handleDelete = async (reminderId) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await onDelete(reminderId);
      toast.success('Reminder deleted');
    } catch (error) {
      toast.error('Failed to delete reminder');
    }
  };

  const handleDuplicate = async (reminder) => {
    try {
      await onDuplicate(reminder);
      toast.success('Reminder duplicated');
    } catch (error) {
      toast.error('Failed to duplicate reminder');
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
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-100 dark:border-indigo-500/20" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading reminders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full p-4">
      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 transition-all duration-200 focus-within:border-indigo-300 dark:focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10">
            <Search size={16} className="text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search reminders..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
                className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 h-auto font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all duration-200"
              >
                <Filter size={14} className="text-gray-400" />
                <span>Type: </span>
                <span className="text-gray-900 dark:text-white">
                  {typeFilter === 'all' ? 'All' : REMINDER_TYPES[typeFilter]?.label}
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
              <DropdownItem key="all">All Types</DropdownItem>
              <DropdownItem key="fee" startContent={<DollarSign size={14} className="text-amber-500" />}>Fee Reminder</DropdownItem>
              <DropdownItem key="attendance" startContent={<Users size={14} className="text-rose-500" />}>Attendance Alert</DropdownItem>
              <DropdownItem key="academic" startContent={<BookOpen size={14} className="text-indigo-500" />}>Academic Reminder</DropdownItem>
              <DropdownItem key="event" startContent={<Calendar size={14} className="text-emerald-500" />}>Event Reminder</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Status Filter */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                size="sm"
                variant="flat"
                className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 h-auto font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all duration-200"
              >
                <Power size={14} className={statusFilter === 'active' ? 'text-emerald-500' : statusFilter === 'inactive' ? 'text-gray-400' : 'text-gray-400'} />
                <span>Status: </span>
                <span className="text-gray-900 dark:text-white">
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
              <DropdownItem key="all">All Status</DropdownItem>
              <DropdownItem key="active" startContent={<Power size={14} className="text-emerald-500" />}>Active</DropdownItem>
              <DropdownItem key="inactive" startContent={<PowerOff size={14} className="text-gray-400" />}>Inactive</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Results Count */}
      {reminders.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Sparkles size={12} className="text-indigo-400" />
          <span>
            Showing {filteredReminders.length} of {reminders.length} reminders
          </span>
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-gray-100 dark:border-zinc-800">
        <Table
          aria-label="Reminders"
          removeWrapper
          classNames={{
            th: "bg-gray-50 dark:bg-zinc-800/50 text-gray-600 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider",
            tr: "hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors duration-150",
            td: "py-3",
          }}
        >
        <TableHeader>
          <TableColumn>TITLE & TYPE</TableColumn>
          <TableColumn>TRIGGER</TableColumn>
          <TableColumn>RECIPIENTS & CHANNELS</TableColumn>
          <TableColumn>FREQUENCY</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn align="end">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                  <Bell size={32} className="text-gray-400 dark:text-gray-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Sparkles size={14} className="text-white" />
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-1">No reminders found</p>
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
                      <span className="font-semibold text-gray-900 dark:text-white">{reminder.title}</span>
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
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300"
                        >
                          {recipient.type}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide">
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
                    <span className={`text-xs font-medium ${reminder.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
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
                          className="rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500"
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
    </div>
  );
}
