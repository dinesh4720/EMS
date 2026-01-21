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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Copy,
  Send,
  MoreVertical,
  Calendar,
} from 'lucide-react';
import { announcementsApi } from '../../../../services/api';
import toast from 'react-hot-toast';

export default function AnnouncementsList({ onView, onEdit, onRefresh }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📢 Loading announcements...');
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await announcementsApi.getAll(params);
      console.log('📢 Announcements loaded:', response);
      // Backend returns { announcements: [], ... }
      setAnnouncements(response.announcements || response || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
      const errorMsg = error.message || 'Unknown error';
      setError(errorMsg);
      toast.error(`Failed to load announcements: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const matchesSearch =
        announcement.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || announcement.status === statusFilter;
      const matchesChannel = channelFilter === 'all' ||
        announcement.channels?.includes(channelFilter);

      let matchesDate = true;
      const announcementDate = new Date(announcement.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);

      if (dateFilter === 'today') {
        matchesDate = announcementDate >= today;
      } else if (dateFilter === 'week') {
        matchesDate = announcementDate >= thisWeek;
      } else if (dateFilter === 'month') {
        const thisMonth = new Date(today);
        thisMonth.setMonth(thisMonth.getMonth() - 1);
        matchesDate = announcementDate >= thisMonth;
      }

      return matchesSearch && matchesStatus && matchesChannel && matchesDate;
    });
  }, [announcements, searchQuery, statusFilter, channelFilter, dateFilter]);

  const handleDelete = async (announcementId) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await announcementsApi.delete(announcementId);
      toast.success('Announcement deleted');
      loadAnnouncements();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const handleDuplicate = async (announcement) => {
    try {
      const duplicate = {
        title: `${announcement.title} (Copy)`,
        content: announcement.content,
        recipients: announcement.recipients,
        channels: announcement.channels,
        status: 'draft',
      };

      await announcementsApi.create(duplicate);
      toast.success('Announcement duplicated');
      loadAnnouncements();
      onRefresh?.();
    } catch (error) {
      console.error('Error duplicating announcement:', error);
      toast.error('Failed to duplicate announcement');
    }
  };

  const handleResend = async (announcementId) => {
    try {
      await announcementsApi.resend(announcementId);
      toast.success('Announcement resent successfully');
      loadAnnouncements();
      onRefresh?.();
    } catch (error) {
      console.error('Error resending announcement:', error);
      toast.error('Failed to resend announcement');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'success';
      case 'scheduled':
        return 'warning';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRecipientsLabel = (recipients) => {
    if (recipients?.some(r => r.type === 'all')) return 'Whole School';
    return recipients?.map(r => r.type).join(', ') || 'None';
  };

  const getChannelsLabel = (channels) => {
    if (!channels || channels.length === 0) return 'None';
    return channels.join(', ').toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Spinner size="lg" color="primary" />
        <p className="text-default-500">Loading announcements...</p>
        <p className="text-xs text-default-400">If this takes too long, the backend server might not be running</p>
      </div>
    );
  }

  if (error && announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-danger">Failed to load announcements</p>
        <p className="text-sm text-default-500 max-w-md text-center">{error}</p>
        <Button
          color="primary"
          size="sm"
          onPress={() => loadAnnouncements()}
          startContent={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Debug Info */}
      <div className="text-xs text-default-400">
        Found {announcements.length} total announcements, {filteredAnnouncements.length} after filters
      </div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="flex items-center gap-2 flex-1 px-3 py-2 bg-default-100 rounded-lg border border-default-200">
            <Search size={16} className="text-default-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              className="flex-1 bg-transparent outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Status Filter */}
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="flat" endContent={<Calendar size={14} />}>
                Status: {statusFilter === 'all' ? 'All' : statusFilter}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
            >
              <DropdownItem key="all">All Status</DropdownItem>
              <DropdownItem key="draft">Draft</DropdownItem>
              <DropdownItem key="scheduled">Scheduled</DropdownItem>
              <DropdownItem key="sent">Sent</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Channel Filter */}
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="flat">
                Channel: {channelFilter === 'all' ? 'All' : channelFilter.toUpperCase()}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              selectedKeys={[channelFilter]}
              onSelectionChange={(keys) => setChannelFilter(Array.from(keys)[0])}
            >
              <DropdownItem key="all">All Channels</DropdownItem>
              <DropdownItem key="inapp">In-App</DropdownItem>
              <DropdownItem key="email">Email</DropdownItem>
              <DropdownItem key="sms">SMS</DropdownItem>
              <DropdownItem key="whatsapp">WhatsApp</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Date Filter */}
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="flat">
                Date: {dateFilter === 'all' ? 'All' : dateFilter}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              selectedKeys={[dateFilter]}
              onSelectionChange={(keys) => setDateFilter(Array.from(keys)[0])}
            >
              <DropdownItem key="all">All Time</DropdownItem>
              <DropdownItem key="today">Today</DropdownItem>
              <DropdownItem key="week">This Week</DropdownItem>
              <DropdownItem key="month">This Month</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <Table
          aria-label="Announcements"
          classNames={{
            th: "bg-default-100 text-default-600",
          }}
        >
        <TableHeader>
          <TableColumn>TITLE & CONTENT</TableColumn>
          <TableColumn>RECIPIENTS</TableColumn>
          <TableColumn>CHANNELS</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>DATE</TableColumn>
          <TableColumn align="end">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            <div className="text-center py-8">
              <p className="text-default-400">No announcements found</p>
            </div>
          }
        >
          {filteredAnnouncements.map((announcement) => (
            <TableRow key={announcement._id}>
              <TableCell>
                <div className="max-w-md">
                  <p className="font-medium text-sm">{announcement.title}</p>
                  <p className="text-xs text-default-500 truncate">
                    {announcement.content}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">
                  {getRecipientsLabel(announcement.recipients)}
                </Chip>
              </TableCell>
              <TableCell>
                <p className="text-xs">{getChannelsLabel(announcement.channels)}</p>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={getStatusColor(announcement.status)}
                  variant="dot"
                >
                  {announcement.status.toUpperCase()}
                </Chip>
              </TableCell>
              <TableCell>
                <p className="text-xs text-default-500">
                  {formatDate(announcement.createdAt)}
                </p>
                {announcement.scheduledFor && (
                  <p className="text-xs text-default-400">
                    Scheduled: {formatDate(announcement.scheduledFor)}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 justify-end">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onView(announcement)}
                  >
                    <Eye size={16} />
                  </Button>

                  {announcement.status === 'draft' && (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onEdit(announcement)}
                    >
                      <Edit size={16} />
                    </Button>
                  )}

                  {announcement.status === 'sent' && (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleResend(announcement._id)}
                    >
                      <Send size={16} />
                    </Button>
                  )}

                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem
                        key="view"
                        startContent={<Eye size={16} />}
                        onPress={() => onView(announcement)}
                      >
                        View Details
                      </DropdownItem>
                      {announcement.status === 'draft' && (
                        <DropdownItem
                          key="edit"
                          startContent={<Edit size={16} />}
                          onPress={() => onEdit(announcement)}
                        >
                          Edit
                        </DropdownItem>
                      )}
                      <DropdownItem
                        key="duplicate"
                        startContent={<Copy size={16} />}
                        onPress={() => handleDuplicate(announcement)}
                      >
                        Duplicate
                      </DropdownItem>
                      {announcement.status === 'sent' && (
                        <DropdownItem
                          key="resend"
                          startContent={<Send size={16} />}
                          onPress={() => handleResend(announcement._id)}
                        >
                          Resend
                        </DropdownItem>
                      )}
                      <DropdownItem
                        key="delete"
                        startContent={<Trash2 size={16} />}
                        className="text-danger"
                        onPress={() => handleDelete(announcement._id)}
                      >
                        Delete
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      {filteredAnnouncements.length === 0 && !loading && (
        <div className="text-center py-12 text-default-400">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p>No announcements found</p>
          <p className="text-sm">Create your first announcement to get started</p>
        </div>
      )}
    </div>
  );
}
