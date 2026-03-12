import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Progress,
  Chip,
  Avatar,
  Divider,
} from '@heroui/react';
import {
  Eye,
  Send,
  AlertCircle,
  CheckCircle,
  Users,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Download,
} from 'lucide-react';
import { announcementsApi } from '../../../../services/api';
import toast from 'react-hot-toast';

export default function AnnouncementAnalyticsModal({
  isOpen,
  onClose,
  announcementId,
}) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (isOpen && announcementId) {
      loadAnalytics();
    }
  }, [isOpen, announcementId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await announcementsApi.getAnalytics(announcementId);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (recipientId) => {
    setRetrying(true);
    try {
      await announcementsApi.resend(announcementId, { recipientIds: [recipientId] });
      toast.success('Resent successfully');
      loadAnalytics();
    } catch (error) {
      console.error('Error retrying:', error);
      toast.error('Failed to resend');
    } finally {
      setRetrying(false);
    }
  };

  const handleRetryAll = async () => {
    if (!confirm('Resend to all failed recipients?')) return;

    setRetrying(true);
    try {
      await announcementsApi.resend(announcementId, { failedOnly: true });
      toast.success('Resending to all failed recipients');
      loadAnalytics();
    } catch (error) {
      console.error('Error retrying all:', error);
      toast.error('Failed to resend');
    } finally {
      setRetrying(false);
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email':
        return <Mail size={16} />;
      case 'sms':
        return <MessageSquare size={16} />;
      case 'whatsapp':
        return <Phone size={16} />;
      case 'inapp':
        return <Users size={16} />;
      default:
        return <Send size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'sent':
        return 'primary';
      case 'failed':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const calculateReadRate = () => {
    if (!analytics || analytics.totalRecipients === 0) return 0;
    return Math.round((analytics.readCount / analytics.totalRecipients) * 100);
  };

  const calculateDeliveryRate = () => {
    if (!analytics || analytics.totalRecipients === 0) return 0;
    return Math.round((analytics.deliveredCount / analytics.totalRecipients) * 100);
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalBody className="py-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              <p className="mt-4 text-default-500">Loading analytics...</p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>
          <div className="w-full">
            <h3 className="text-lg font-semibold">{analytics.title}</h3>
            <p className="text-sm text-default-500 mt-1">{analytics.content}</p>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {/* Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardBody className="text-center py-4">
                <Users size={24} className="mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{analytics.totalRecipients}</p>
                <p className="text-xs text-default-500">Total Recipients</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center py-4">
                <CheckCircle size={24} className="mx-auto mb-2 text-success" />
                <p className="text-2xl font-bold">{analytics.deliveredCount}</p>
                <p className="text-xs text-default-500">Delivered</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center py-4">
                <Eye size={24} className="mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{analytics.readCount}</p>
                <p className="text-xs text-default-500">Read</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center py-4">
                <AlertCircle size={24} className="mx-auto mb-2 text-danger" />
                <p className="text-2xl font-bold">{analytics.failedCount}</p>
                <p className="text-xs text-default-500">Failed</p>
              </CardBody>
            </Card>
          </div>

          <Divider />

          {/* Read & Delivery Rates */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Delivery Rate</span>
                <span className="text-sm text-default-500">{calculateDeliveryRate()}%</span>
              </div>
              <Progress
                value={calculateDeliveryRate()}
                color="primary"
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Read Rate</span>
                <span className="text-sm text-default-500">{calculateReadRate()}%</span>
              </div>
              <Progress
                value={calculateReadRate()}
                color="success"
                className="w-full"
              />
            </div>
          </div>

          <Divider />

          {/* Channel Breakdown */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Channel Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {analytics.channelBreakdown?.map((channel) => (
                <Card key={channel.channel} size="sm">
                  <CardBody className="py-3">
                    <div className="flex items-center gap-2 mb-2">
                      {getChannelIcon(channel.channel)}
                      <span className="text-xs font-medium uppercase">
                        {channel.channel}
                      </span>
                    </div>
                    <p className="text-lg font-bold">{channel.sent}</p>
                    <p className="text-xs text-default-500">
                      {channel.delivered} delivered
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>

          <Divider />

          {/* Attachments */}
          {analytics.attachments && analytics.attachments.length > 0 && (
            <>
              <div>
                <h4 className="text-sm font-semibold mb-3">Attachments</h4>
                <div className="space-y-2">
                  {analytics.attachments.map((attachment) => (
                    <Card key={attachment._id || attachment.name} size="sm">
                      <CardBody className="py-2 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Download size={16} />
                          <span className="text-sm">{attachment.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => window.open(attachment.url, '_blank')}
                        >
                          Download
                        </Button>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
              <Divider />
            </>
          )}

          {/* Failed Recipients */}
          {analytics.failedRecipients && analytics.failedRecipients.length > 0 && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">Failed Recipients</h4>
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={handleRetryAll}
                    isLoading={retrying}
                    startContent={<RefreshCw size={14} />}
                  >
                    Retry All
                  </Button>
                </div>
                <div className="space-y-2">
                  {analytics.failedRecipients.map((recipient) => (
                    <Card key={recipient._id} size="sm">
                      <CardBody className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={recipient.avatar}
                              name={recipient.name}
                              size="sm"
                            />
                            <div>
                              <p className="text-sm font-medium">{recipient.name}</p>
                              <p className="text-xs text-default-500">
                                {recipient.email || recipient.phone}
                              </p>
                              <p className="text-xs text-danger mt-1">
                                {recipient.error || 'Failed to deliver'}
                              </p>
                            </div>
                          </div>
                          <Chip
                            size="sm"
                            color={getStatusColor(recipient.status)}
                            variant="flat"
                          >
                            {recipient.status?.toUpperCase()}
                          </Chip>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
              <Divider />
            </>
          )}

          {/* Sent By */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-default-500">Sent by</span>
            <span className="font-medium">{analytics.sentBy?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-default-500">Sent on</span>
            <span className="font-medium">
              {new Date(analytics.sentAt).toLocaleString()}
            </span>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button onPress={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
