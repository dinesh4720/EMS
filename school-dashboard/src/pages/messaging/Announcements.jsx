import { useState } from "react";
import { Button, Card } from "@heroui/react";
import { Plus, Megaphone } from "lucide-react";
import AnnouncementForm from "./components/announcements/AnnouncementForm";
import AnnouncementsList from "./components/announcements/AnnouncementsList";
import AnnouncementAnalyticsModal from "./components/announcements/AnnouncementAnalyticsModal";
import toast from "react-hot-toast";

export default function Announcements() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [editAnnouncement, setEditAnnouncement] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
    setEditAnnouncement(null);
    toast.success('Announcements refreshed');
  };

  const handleCreateNew = () => {
    setEditAnnouncement(null);
    setShowCreateModal(true);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="text-primary" size={28} />
            Announcements
          </h1>
          <p className="text-default-500 mt-1">
            Create and manage school-wide announcements
          </p>
        </div>
        <Button
          color="primary"
          onPress={handleCreateNew}
          startContent={<Plus size={18} />}
          size="lg"
        >
          Create Announcement
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border border-default-200">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Megaphone size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Sent</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-default-200">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-default-500">Delivered</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-default-200">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-default-500">Scheduled</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Announcements List */}
      <Card className="border border-default-200">
        <div className="p-6">
          <AnnouncementsList
            key={refreshKey}
            onView={handleView}
            onEdit={handleEdit}
            onRefresh={() => setRefreshKey(prev => prev + 1)}
          />
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <AnnouncementForm
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditAnnouncement(null);
        }}
        onSave={handleSave}
        editData={editAnnouncement}
      />

      {/* Analytics Modal */}
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
