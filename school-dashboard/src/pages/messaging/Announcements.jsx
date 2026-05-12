import { useState, useEffect } from "react";
import { Plus, Send, Clock, Check } from "lucide-react";
import AnnouncementForm from "./components/announcements/AnnouncementForm";
import AnnouncementsList from "./components/announcements/AnnouncementsList";
import AnnouncementAnalyticsModal from "./components/announcements/AnnouncementAnalyticsModal";
import toast from "react-hot-toast";
import { announcementsApi } from "../../services/api";
import { useTranslation } from 'react-i18next';
import {
  Card,
  ErrorState,
  MinimalButton,
  SectionHeading,
  StatCard,
  Skeleton,
} from "../../components/ui";

export default function Announcements({ isDrawerOpen, setIsDrawerOpen }) {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [editAnnouncement, setEditAnnouncement] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({ sent: 0, delivered: 0, scheduled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isDrawerOpen) setShowCreateModal(true);
  }, [isDrawerOpen]);

  useEffect(() => {
    let mounted = true;
    if (refreshKey === 0) setLoading(true);
    setError(null);
    announcementsApi.getAll()
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : (data?.announcements || []);
        const sent = list.filter((item) => item.status === 'sent').length;
        const scheduled = list.filter((item) => item.status === 'scheduled').length;
        const delivered = list.reduce(
          (sum, item) => sum + (item.deliveredCount || item.recipientCount || 0),
          0,
        );
        setStats({ sent, delivered, scheduled });
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err);
        toast.error(t('toast.error.failedToLoad'));
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [refreshKey, t]);

  const handleView = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowAnalyticsModal(true);
  };

  const handleEdit = (announcement) => {
    setEditAnnouncement(announcement);
    setShowCreateModal(true);
  };

  const handleSave = () => {
    setRefreshKey(prev => prev + 1);
    setShowCreateModal(false);
    setIsDrawerOpen(false);
    setEditAnnouncement(null);
    toast.success(t('toast.success.announcementSaved'));
  };

  const handleCreateNew = () => {
    setEditAnnouncement(null);
    setShowCreateModal(true);
  };

  const closeForm = () => {
    setShowCreateModal(false);
    setIsDrawerOpen(false);
    setEditAnnouncement(null);
  };

  const statCards = [
    { label: 'Sent', value: stats.sent, subtext: 'Total sent', icon: Send, color: 'primary' },
    { label: 'Delivered', value: stats.delivered.toLocaleString(), subtext: 'Total recipients', icon: Check, color: 'gray' },
    { label: 'Scheduled', value: stats.scheduled, subtext: 'Pending', icon: Clock, color: 'warning' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={loading ? '—' : stat.value}
            subtext={stat.subtext}
            icon={stat.icon}
            color={stat.color}
            isLoading={loading}
          />
        ))}
      </div>

      <Card padding="none">
        <Card.Header className="px-5 py-4 mb-0 border-b">
          <SectionHeading
            size="sm"
            icon={Send}
            description={t('pages.manageYourAnnouncements')}
            actions={
              <MinimalButton onClick={handleCreateNew} icon={<Plus size={16} />} size="sm">
                {t('pages.newAnnouncement')}
              </MinimalButton>
            }
          >
            {t('pages.allAnnouncements')}
          </SectionHeading>
        </Card.Header>
        <div className="p-5">
          {error ? (
            <ErrorState
              error={error}
              onRetry={() => setRefreshKey((prev) => prev + 1)}
            />
          ) : loading ? (
            <div className="space-y-3">
              <Skeleton.Row />
              <Skeleton.Row />
              <Skeleton.Row />
            </div>
          ) : (
            <AnnouncementsList
              key={refreshKey}
              onView={handleView}
              onEdit={handleEdit}
              onRefresh={() => setRefreshKey((prev) => prev + 1)}
            />
          )}
        </div>
      </Card>

      <AnnouncementForm
        isOpen={showCreateModal}
        onClose={closeForm}
        onSave={handleSave}
        editData={editAnnouncement}
      />

      <AnnouncementAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => {
          setShowAnalyticsModal(false);
          setSelectedAnnouncement(null);
        }}
        announcementId={selectedAnnouncement?._id}
      />
    </div>
  );
}
