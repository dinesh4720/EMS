import { useState, useEffect } from "react";
import { Plus, Send, Clock, Check } from "lucide-react";
import AnnouncementForm from "./components/announcements/AnnouncementForm";
import AnnouncementsList from "./components/announcements/AnnouncementsList";
import AnnouncementAnalyticsModal from "./components/announcements/AnnouncementAnalyticsModal";
import toast from "react-hot-toast";

export default function Announcements({ isDrawerOpen, setIsDrawerOpen }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [editAnnouncement, setEditAnnouncement] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync with parent drawer state
  useEffect(() => {
    if (isDrawerOpen) {
      setShowCreateModal(true);
    }
  }, [isDrawerOpen]);

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
    toast.success('Announcement saved');
  };

  const handleCreateNew = () => {
    setEditAnnouncement(null);
    setShowCreateModal(true);
  };

  const stats = [
    {
      label: "Sent",
      value: "24",
      description: "This month",
      icon: Send,
      color: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400"
    },
    {
      label: "Delivered",
      value: "1,234",
      description: "Total recipients",
      icon: Check,
      color: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300"
    },
    {
      label: "Scheduled",
      value: "3",
      description: "Pending",
      icon: Clock,
      color: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
    },
  ];

  return (
    <div className="space-y-6 bg-white dark:bg-zinc-950">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 p-5"
          >
            <div className="flex items-start gap-4">
              {/* Icon Container */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={18} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold text-gray-800 dark:text-zinc-100 mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                  {stat.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Announcements List */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <Send size={16} className="text-gray-600 dark:text-zinc-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800 dark:text-zinc-100 text-sm">All Announcements</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Manage your announcements</p>
            </div>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            <span>New Announcement</span>
          </button>
        </div>
        <div className="p-5">
          <AnnouncementsList
            key={refreshKey}
            onView={handleView}
            onEdit={handleEdit}
            onRefresh={() => setRefreshKey(prev => prev + 1)}
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnnouncementForm
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setIsDrawerOpen(false);
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
