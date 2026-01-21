import { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';

const REMINDER_TYPES = {
  fee: { label: 'Fee Reminder', icon: DollarSign, color: 'warning' },
  attendance: { label: 'Attendance Alert', icon: Users, color: 'danger' },
  academic: { label: 'Academic Reminder', icon: BookOpen, color: 'primary' },
  event: { label: 'Event Reminder', icon: Calendar, color: 'success' },
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
    return REMINDER_TYPES[type] || { label: type, icon: Bell, color: 'default' };
  };

  const getTriggerLabel = (trigger) => {
    return TRIGGER_LABELS[trigger] || trigger;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Spinner size="lg" color="primary" />
        <p className="text-default-500">Loading reminders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Debug Info */}
      <div className="text-xs text-default-400">
        Found {reminders.length} total reminders, {filteredReminders.length} after filters
      </div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="flex items-center gap-2 flex-1 px-3 py-2 bg-default-100 rounded-lg border border-default-200">
            <Search size={16} className="text-default-400" />
            <input
              type="text"
              placeholder="Search reminders..."
              className="flex-1 bg-transparent outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Type Filter */}
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="flat">
                Type: {typeFilter === 'all' ? 'All' : REMINDER_TYPES[typeFilter]?.label}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              selectedKeys={[typeFilter]}
              onSelectionChange={(keys) => setTypeFilter(Array.from(keys)[0])}
            >
              <DropdownItem key="all">All Types</DropdownItem>
              <DropdownItem key="fee">Fee Reminder</DropdownItem>
              <DropdownItem key="attendance">Attendance Alert</DropdownItem>
              <DropdownItem key="academic">Academic Reminder</DropdownItem>
              <DropdownItem key="event">Event Reminder</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Status Filter */}
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="flat">
                Status: {statusFilter === 'all' ? 'All' : statusFilter}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
            >
              <DropdownItem key="all">All Status</DropdownItem>
              <DropdownItem key="active">Active</DropdownItem>
              <DropdownItem key="inactive">Inactive</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <Table
          aria-label="Reminders"
          classNames={{
            th: "bg-default-100 text-default-600",
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
            <div className="text-center py-8">
              <Bell size={48} className="mx-auto mb-4 text-default-300" />
              <p className="text-default-400">No reminders found</p>
              <p className="text-sm text-default-500">Create a reminder to get started</p>
            </div>
          }
        >
          {filteredReminders.map((reminder) => {
            const typeInfo = getTypeInfo(reminder.type);
            const TypeIcon = typeInfo.icon;

            return (
              <TableRow key={reminder._id}>
                <TableCell>
                  <div className="max-w-md">
                    <div className="flex items-center gap-2 mb-1">
                      <TypeIcon size={16} className={`text-${typeInfo.color}`} />
                      <span className="font-medium text-sm">{reminder.title}</span>
                    </div>
                    <p className="text-xs text-default-500 truncate max-w-[300px]">
                      {reminder.message}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <Chip size="sm" variant="flat" color={typeInfo.color}>
                    {getTriggerLabel(reminder.trigger)}
                  </Chip>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap gap-1">
                      {reminder.recipients?.map((recipient) => (
                        <Chip key={recipient.type} size="sm" variant="flat">
                          {recipient.type}
                        </Chip>
                      ))}
                    </div>
                    <p className="text-xs text-default-500">
                      {reminder.channels?.join(', ').toUpperCase()}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-xs capitalize">{reminder.frequency}</span>
                </TableCell>

                <TableCell>
                  <Switch
                    size="sm"
                    isSelected={reminder.active}
                    onValueChange={() => handleToggle(reminder)}
                    thumbIcon={({ isSelected, className }) =>
                      isSelected ? (
                        <Power className={className} size={14} />
                      ) : (
                        <PowerOff className={className} size={14} />
                      )
                    }
                  />
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onEdit(reminder)}
                    >
                      <Edit size={16} />
                    </Button>

                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem
                          key="edit"
                          startContent={<Edit size={16} />}
                          onPress={() => onEdit(reminder)}
                        >
                          Edit
                        </DropdownItem>
                        <DropdownItem
                          key="duplicate"
                          startContent={<Copy size={16} />}
                          onPress={() => handleDuplicate(reminder)}
                        >
                          Duplicate
                        </DropdownItem>
                        <DropdownItem
                          key="toggle"
                          startContent={reminder.active ? <PowerOff size={16} /> : <Power size={16} />}
                          onPress={() => handleToggle(reminder)}
                        >
                          {reminder.active ? 'Disable' : 'Enable'}
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          startContent={<Trash2 size={16} />}
                          className="text-danger"
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
