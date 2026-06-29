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
  MinimalButton,
  SectionHeading,
  StatCard,
} from "../../components/ui";

export default function Announcements({ isDrawerOpen, setIsDrawerOpen }) {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [editAnnouncement, setEditAnnouncement] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({ sentThisMonth: 0, totalDelivered: 0, scheduled: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (isDrawerOpen) setShowCreateModal(true);
  }, [isDrawerOpen]);

  useEffect(() => {
    let mounted = true;
    setStatsLoading(true);
    announcementsApi.getStats()
      .then((data) => {
        if (!mounted) return;
        setStats({
          sentThisMonth: data?.sentThisMonth ?? 0,
          totalDelivered: data?.totalDelivered ?? 0,
          scheduled: data?.scheduled ?? 0,
        });
      })
      .catch(() => {
        if (!mounted) return;
        toast.error(t('toast.error.failedToLoad'));
      })
      .finally(() => { if (mounted) setStatsLoading(false); });
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
    { label: 'Sent', value: stats.sentThisMonth, subtext: 'This month', icon: Send, color: 'primary' },
    { label: 'Delivered', value: stats.totalDelivered.toLocaleString(), subtext: 'All-time recipients', icon: Check, color: 'gray' },
    { label: 'Scheduled', value: stats.scheduled, subtext: 'Pending', icon: Clock, color: 'warning' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={statsLoading ? '—' : stat.value}
            subtext={stat.subtext}
            icon={stat.icon}
            color={stat.color}
            isLoading={statsLoading}
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
          <AnnouncementsList
            key={refreshKey}
            onView={handleView}
            onEdit={handleEdit}
            onRefresh={() => setRefreshKey((prev) => prev + 1)}
          />
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
