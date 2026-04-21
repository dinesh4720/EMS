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
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../../../utils/dateFormatter';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../../../hooks/useConfirmDialog';
import logger from '../../../../utils/logger';


export default function AnnouncementAnalyticsModal({
  isOpen,
  onClose,
  announcementId,
}) {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
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
      logger.error('Error loading analytics:', error);
      toast.error(t('toast.error.failedToLoadAnalytics'));
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (recipientId) => {
    setRetrying(true);
    try {
      await announcementsApi.resend(announcementId, { recipientIds: [recipientId] });
      toast.success(t('toast.success.resentSuccessfully'));
      loadAnalytics();
    } catch (error) {
      logger.error('Error retrying:', error);
      toast.error(t('toast.error.failedToResend'));
    } finally {
      setRetrying(false);
    }
  };

  const handleRetryAll = () => {
    showConfirm({
      title: 'Resend to Failed Recipients',
      message: t('confirm.resendFailedRecipients'),
      variant: 'warning',
      confirmText: 'Resend',
      onConfirm: async () => {
        setRetrying(true);
        try {
          await announcementsApi.resend(announcementId, { failedOnly: true });
          toast.success(t('toast.success.resendingToAllFailedRecipients'));
          loadAnalytics();
        } catch (error) {
          logger.error('Error retrying all:', error);
          toast.error(t('toast.error.failedToResend'));
        } finally {
          setRetrying(false);
        }
      },
    });
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
    const stats = analytics?.stats;
    if (!stats || !stats.totalRecipients) return 0;
    return Math.round((stats.read / stats.totalRecipients) * 100);
  };

  const calculateDeliveryRate = () => {
    const stats = analytics?.stats;
    if (!stats || !stats.totalRecipients) return 0;
    return Math.round((stats.delivered / stats.totalRecipients) * 100);
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            <div className="h-5 w-48 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          </ModalHeader>
          <ModalBody className="py-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-default-100 space-y-2 animate-pulse">
                  <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-700 rounded" />
                  <div className="h-7 w-12 bg-gray-200 dark:bg-zinc-700 rounded" />
                </div>
              ))}
            </div>
            <div className="space-y-2 animate-pulse">
              <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-700 rounded" />
              <div className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full" />
            </div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-1/3 bg-gray-200 dark:bg-zinc-700 rounded" />
                    <div className="h-2 w-1/2 bg-gray-100 dark:bg-zinc-800 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-gray-200 dark:bg-zinc-700 rounded-full" />
                </div>
              ))}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  if (!analytics) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalBody className="py-8 text-center text-default-500">
            No analytics data available.
          </ModalBody>
          <ModalFooter>
            <Button onPress={onClose}>{t('pages.close2')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  const announcement = analytics.announcement || {};
  const stats = analytics.stats || {};
  const channelBreakdown = stats.byChannel
    ? Object.entries(stats.byChannel).map(([channel, data]) => ({ channel, ...data }))
    : [];

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{announcement.title}</h3>
            <p className="text-sm text-default-500 mt-1">{announcement.content}</p>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {/* Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardBody className="text-center py-4">
                <Users size={24} className="mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.totalRecipients ?? 0}</p>
                <p className="text-xs text-default-500">{t('pages.totalRecipients')}</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center py-4">
                <CheckCircle size={24} className="mx-auto mb-2 text-success" />
                <p className="text-2xl font-bold">{stats.delivered ?? 0}</p>
                <p className="text-xs text-default-500">{t('pages.delivered')}</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center py-4">
                <Eye size={24} className="mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.read ?? 0}</p>
                <p className="text-xs text-default-500">{t('pages.read')}</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center py-4">
                <AlertCircle size={24} className="mx-auto mb-2 text-danger" />
                <p className="text-2xl font-bold">{stats.failed ?? 0}</p>
                <p className="text-xs text-default-500">{t('pages.failed')}</p>
              </CardBody>
            </Card>
          </div>

          <Divider />

          {/* Read & Delivery Rates */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('pages.deliveryRate')}</span>
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
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('pages.readRate')}</span>
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
            <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-zinc-100">{t('pages.channelBreakdown')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {channelBreakdown.map((channel) => (
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
          {announcement.attachments && announcement.attachments.length > 0 && (
            <>
              <div>
                <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-zinc-100">{t('pages.attachments')}</h4>
                <div className="space-y-2">
                  {announcement.attachments.map((attachment) => (
                    <Card key={attachment._id || attachment.name} size="sm">
                      <CardBody className="py-2 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Download size={16} />
                          <span className="text-sm">{attachment.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => window.open(attachment.url, '_blank', 'noopener,noreferrer')}
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
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.failedRecipients')}</h4>
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
                  {analytics.failedRecipients.map((recipient, idx) => (
                    <Card key={recipient.userId?.toString() || idx} size="sm">
                      <CardBody className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={recipient.userType}
                              size="sm"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{recipient.userType}</p>
                              {recipient.errors?.map((e, i) => (
                                <p key={i} className="text-xs text-danger mt-0.5">
                                  {e.channel}: {e.error || 'Failed to deliver'}
                                </p>
                              ))}
                            </div>
                          </div>
                          <Chip size="sm" color="danger" variant="flat">
                            FAILED
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
            <span className="text-default-500">{t('pages.sentBy')}</span>
            <span className="font-medium text-gray-900 dark:text-zinc-100">{announcement.createdBy?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-default-500">{t('pages.sentOn')}</span>
            <span className="font-medium text-gray-900 dark:text-zinc-100">
              {formatDateTime(announcement.sentAt)}
            </span>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button onPress={onClose}>{t('pages.close2')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
    <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </>
  );
}
