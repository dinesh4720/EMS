import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Avatar,
} from '@heroui/react';
import {
  Send,
  AlertCircle,
  Users,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Download,
  Paperclip,
} from 'lucide-react';
import { announcementsApi } from '../../../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../../../utils/dateFormatter';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../../../hooks/useConfirmDialog';
import logger from '../../../../utils/logger';

const CHANNEL_ICON = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: Phone,
  inapp: Users,
};

function pct(num, denom) {
  if (!denom) return 0;
  return Math.round((num / denom) * 100);
}

function Metric({ label, value, sub, tone = 'default' }) {
  const toneColor = tone === 'ok' ? 'var(--ok)'
    : tone === 'warn' ? 'var(--warn)'
    : tone === 'danger' ? 'var(--danger)'
    : tone === 'accent' ? 'var(--accent)'
    : 'var(--fg)';
  return (
    <div className="dp-metric">
      <span className="dp-metric__label">{label}</span>
      <span className="dp-metric__value mono tnum" style={{ color: toneColor }}>{value}</span>
      {sub != null && (
        <span className="subtle mono tnum" style={{ fontSize: 11 }}>{sub}</span>
      )}
    </div>
  );
}

function ProgressBar({ value, tone = 'accent' }) {
  const fill = tone === 'ok' ? 'var(--ok)'
    : tone === 'warn' ? 'var(--warn)'
    : tone === 'danger' ? 'var(--danger)'
    : 'var(--accent)';
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        height: 6,
        background: 'var(--surface-2)',
        borderRadius: 999,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height: '100%',
          background: fill,
          transition: 'width 200ms',
        }}
      />
    </div>
  );
}

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
    if (!isOpen || !announcementId) return;
    let cancelled = false;
    setLoading(true);
    setAnalytics(null);
    announcementsApi
      .getAnalytics(announcementId)
      .then((data) => {
        if (!cancelled) setAnalytics(data);
      })
      .catch((err) => {
        logger.error('Error loading analytics:', err);
        if (!cancelled) toast.error(t('toast.error.failedToLoadAnalytics'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, announcementId, t]);

  const reload = async () => {
    if (!announcementId) return;
    setLoading(true);
    try {
      const data = await announcementsApi.getAnalytics(announcementId);
      setAnalytics(data);
    } catch (err) {
      logger.error('Error reloading analytics:', err);
      toast.error(t('toast.error.failedToLoadAnalytics'));
    } finally {
      setLoading(false);
    }
  };

  const handleRetryAll = () => {
    showConfirm({
      title: 'Resend to failed recipients',
      message: t('confirm.resendFailedRecipients'),
      variant: 'warning',
      confirmText: 'Resend',
      onConfirm: async () => {
        setRetrying(true);
        try {
          await announcementsApi.resend(announcementId, { failedOnly: true });
          toast.success(t('toast.success.resendingToAllFailedRecipients'));
          await reload();
        } catch (err) {
          logger.error('Error retrying all:', err);
          toast.error(t('toast.error.failedToResend'));
        } finally {
          setRetrying(false);
        }
      },
    });
  };

  const stats = analytics?.stats || {};
  const announcement = analytics?.announcement || {};
  const total = stats.totalRecipients || 0;
  const delivered = stats.delivered || 0;
  const read = stats.read || 0;
  const clicked = stats.clicked || 0;
  const failed = stats.failed || 0;
  const deliveryRate = pct(delivered, total);
  const openRate = pct(read, total);
  const clickRate = pct(clicked, total);

  const channelBreakdown = stats.byChannel
    ? Object.entries(stats.byChannel).map(([channel, data]) => ({ channel, ...data }))
    : [];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {loading ? 'Loading…' : (announcement.title || 'Announcement analytics')}
            </div>
            {!loading && announcement.content && (
              <div className="subtle" style={{ fontSize: 12, fontWeight: 400 }}>
                {announcement.content}
              </div>
            )}
          </ModalHeader>

          <ModalBody className="col gap-4">
            {loading ? (
              <div className="col gap-3">
                <div className="row gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 76,
                        background: 'var(--surface-2)',
                        borderRadius: 8,
                        animation: 'pulse 1.2s ease-in-out infinite',
                      }}
                    />
                  ))}
                </div>
                <div style={{ height: 60, background: 'var(--surface-2)', borderRadius: 8 }} />
              </div>
            ) : !analytics ? (
              <div className="col gap-2" style={{ alignItems: 'center', padding: 32, textAlign: 'center' }}>
                <AlertCircle size={28} className="faint" aria-hidden />
                <div className="subtle" style={{ fontSize: 13 }}>No analytics data available.</div>
              </div>
            ) : (
              <>
                {/* Top metrics — dp-metric strip */}
                <div
                  className="detail-pane__metrics"
                  style={{ margin: 0, gridTemplateColumns: 'repeat(4, 1fr)' }}
                >
                  <Metric label="Recipients" value={total} sub="Total" />
                  <Metric
                    label="Delivered"
                    value={delivered}
                    sub={`${deliveryRate}%`}
                    tone="ok"
                  />
                  <Metric
                    label="Opened"
                    value={read}
                    sub={`${openRate}%`}
                    tone="accent"
                  />
                  <Metric
                    label="Clicked"
                    value={clicked}
                    sub={`${clickRate}%`}
                    tone="accent"
                  />
                </div>

                {/* Delivery & read rate progress */}
                <div className="col gap-3" style={{ padding: '4px 4px 0' }}>
                  <div className="col" style={{ gap: 6 }}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 520 }}>Delivery rate</span>
                      <span className="subtle mono tnum" style={{ fontSize: 12 }}>{deliveryRate}%</span>
                    </div>
                    <ProgressBar value={deliveryRate} tone="ok" />
                  </div>
                  <div className="col" style={{ gap: 6 }}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 520 }}>Open rate</span>
                      <span className="subtle mono tnum" style={{ fontSize: 12 }}>{openRate}%</span>
                    </div>
                    <ProgressBar value={openRate} tone="accent" />
                  </div>
                  {failed > 0 && (
                    <div className="col" style={{ gap: 6 }}>
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 520 }}>Failure rate</span>
                        <span className="subtle mono tnum" style={{ fontSize: 12 }}>
                          {pct(failed, total)}%
                        </span>
                      </div>
                      <ProgressBar value={pct(failed, total)} tone="danger" />
                    </div>
                  )}
                </div>

                {/* Channel breakdown */}
                {channelBreakdown.length > 0 && (
                  <div className="col gap-2">
                    <div style={{ fontSize: 12, fontWeight: 520 }}>Channel breakdown</div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: 8,
                      }}
                    >
                      {channelBreakdown.map((c) => {
                        const Icon = CHANNEL_ICON[c.channel] || Send;
                        return (
                          <div
                            key={c.channel}
                            className="col gap-1"
                            style={{
                              padding: 10,
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                              background: 'var(--surface)',
                            }}
                          >
                            <div className="row gap-2" style={{ alignItems: 'center' }}>
                              <Icon size={14} className="subtle" aria-hidden />
                              <span className="mono tnum" style={{ fontSize: 11, textTransform: 'uppercase' }}>
                                {c.channel}
                              </span>
                            </div>
                            <span className="mono tnum" style={{ fontSize: 16, fontWeight: 600 }}>
                              {c.sent ?? 0}
                            </span>
                            <span className="subtle mono tnum" style={{ fontSize: 11 }}>
                              {(c.delivered ?? 0)} delivered
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {announcement.attachments?.length > 0 && (
                  <div className="col gap-2">
                    <div style={{ fontSize: 12, fontWeight: 520 }}>Attachments</div>
                    <div className="col gap-1">
                      {announcement.attachments.map((att, idx) => (
                        <div
                          key={att._id || att.url || idx}
                          className="row gap-2"
                          style={{
                            padding: '8px 10px',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            background: 'var(--surface-2)',
                          }}
                        >
                          <Paperclip size={13} className="subtle" aria-hidden />
                          <span style={{ flex: 1, fontSize: 12 }}>{att.name}</span>
                          <button
                            type="button"
                            className="btn btn--sm"
                            onClick={() => window.open(att.url, '_blank', 'noopener,noreferrer')}
                          >
                            <Download size={12} aria-hidden /> Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Failed recipients */}
                {analytics.failedRecipients?.length > 0 && (
                  <div className="col gap-2">
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 520 }}>
                        Failed recipients
                        <span className="subtle mono tnum" style={{ fontSize: 11, marginLeft: 6 }}>
                          {analytics.failedRecipients.length}
                        </span>
                      </span>
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        onPress={handleRetryAll}
                        isLoading={retrying}
                        startContent={<RefreshCw size={12} />}
                      >
                        Retry all
                      </Button>
                    </div>
                    <div className="col gap-1">
                      {analytics.failedRecipients.slice(0, 20).map((r, idx) => (
                        <div
                          key={r.userId?.toString() || idx}
                          className="row gap-2"
                          style={{
                            padding: '8px 10px',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            background: 'var(--surface)',
                          }}
                        >
                          <Avatar name={r.userType || 'U'} size="sm" />
                          <div className="col" style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 520 }}>{r.userType || 'Recipient'}</span>
                            {r.errors?.slice(0, 1).map((e, i) => (
                              <span key={i} className="subtle" style={{ fontSize: 11, color: 'var(--danger)' }}>
                                {e.channel}: {e.error || 'Failed to deliver'}
                              </span>
                            ))}
                          </div>
                          <span className="chip chip--danger">FAILED</span>
                        </div>
                      ))}
                      {analytics.failedRecipients.length > 20 && (
                        <span className="faint" style={{ fontSize: 11, padding: '4px 8px' }}>
                          and {analytics.failedRecipients.length - 20} more…
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Sent-by / sent-on footer block */}
                <div
                  className="row"
                  style={{
                    padding: '8px 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--surface-2)',
                    justifyContent: 'space-between',
                    fontSize: 12,
                  }}
                >
                  <span className="subtle">Sent by</span>
                  <span className="mono">{announcement.createdBy?.name || 'Unknown'}</span>
                </div>
                <div
                  className="row"
                  style={{
                    padding: '8px 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--surface-2)',
                    justifyContent: 'space-between',
                    fontSize: 12,
                  }}
                >
                  <span className="subtle">Sent on</span>
                  <span className="mono tnum">{formatDateTime(announcement.sentAt)}</span>
                </div>
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="flat" onPress={reload} isDisabled={loading} startContent={<RefreshCw size={13} />}>
              Refresh
            </Button>
            <Button color="primary" onPress={onClose}>
              {t('pages.close2')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </>
  );
}
