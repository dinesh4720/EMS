import { useState, useEffect } from "react";
import { Plus, Bell, DollarSign, Calendar, BookOpen, Check, Users } from "lucide-react";
import ReminderForm from "./components/reminders/ReminderForm";
import RemindersList from "./components/reminders/RemindersList";
import ReminderTemplates from "./components/reminders/ReminderTemplates";
import { remindersApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

const typeTabs = [
  { id: "all", label: "All" },
  { id: "fee", label: "Fee", icon: DollarSign },
  { id: "attendance", label: "Attendance", icon: Users },
  { id: "academic", label: "Academic", icon: BookOpen },
  { id: "event", label: "Events", icon: Calendar },
];

export default function Reminders() {
  const { t } = useTranslation();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [editReminder, setEditReminder] = useState(null);
  const [selectedType, setSelectedType] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadReminders();
  }, [refreshKey]);

  const loadReminders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await remindersApi.getAll();
      setReminders(response.reminders || response || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
      setError(error.message || 'Unknown error');
      toast.error(`Failed to load reminders`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    try {
      if (editReminder) {
        await remindersApi.update(editReminder._id, formData);
        toast.success(t('toast.success.reminderUpdated'));
      } else {
        await remindersApi.create(formData);
        toast.success(t('toast.success.reminderCreated'));
      }
      setRefreshKey(prev => prev + 1);
      setShowCreateModal(false);
      setEditReminder(null);
    } catch (error) {
      toast.error(t('toast.error.failedToSaveReminder'));
    }
  };

  const handleEdit = (reminder) => {
    setEditReminder(reminder);
    setShowCreateModal(true);
  };

  const handleDelete = async (reminderId) => {
    await remindersApi.delete(reminderId);
    setRefreshKey(prev => prev + 1);
  };

  const handleToggle = async (reminderId, active) => {
    await remindersApi.toggle(reminderId, active);
    setRefreshKey(prev => prev + 1);
  };

  const handleDuplicate = async (reminder) => {
    await remindersApi.duplicate(reminder._id);
    setRefreshKey(prev => prev + 1);
  };

  const handleSelectTemplate = (template) => {
    setEditReminder({
      title: template.title,
      message: template.message,
      trigger: template.trigger,
      type: selectedType,
    });
    setShowTemplatesModal(false);
    setShowCreateModal(true);
  };

  const filteredReminders = selectedType === 'all'
    ? reminders
    : reminders.filter(r => r.type === selectedType);

  const stats = {
    total: reminders.length,
    active: reminders.filter(r => r.active).length,
    fee: reminders.filter(r => r.type === 'fee').length,
    attendance: reminders.filter(r => r.type === 'attendance').length,
  };

  const statsData = [
    {
      label: "Total",
      value: stats.total,
      icon: Bell,
      gradient: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      shadowColor: "shadow-indigo-500/20",
      textColor: "text-white"
    },
    {
      label: "Active",
      value: stats.active,
      icon: Check,
      gradient: "bg-gradient-to-br from-emerald-500 to-green-600",
      shadowColor: "shadow-emerald-500/20",
      textColor: "text-white"
    },
    {
      label: "Fee",
      value: stats.fee,
      icon: DollarSign,
      gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
      shadowColor: "shadow-amber-500/20",
      textColor: "text-white"
    },
    {
      label: "Attendance",
      value: stats.attendance,
      icon: Users,
      gradient: "bg-gradient-to-br from-rose-500 to-pink-600",
      shadowColor: "shadow-rose-500/20",
      textColor: "text-white"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <div
            key={stat.label}
            className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4 overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${stat.gradient} ${stat.shadowColor} shadow-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
                <stat.icon size={20} className={stat.textColor} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stat.label}</p>
              </div>
            </div>
            {/* Subtle gradient accent */}
            <div className={`absolute top-0 right-0 w-20 h-20 ${stat.gradient} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`} />
          </div>
        ))}
      </div>

      {/* Type Tabs - Modern Pill Style */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-1.5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {typeTabs.map((tab) => {
            const isActive = selectedType === tab.id;
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                {IconComponent && (
                  <IconComponent
                    size={15}
                    className={`transition-colors duration-200 ${
                      isActive ? "text-indigo-500 dark:text-indigo-400" : ""
                    }`}
                  />
                )}
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-500 dark:bg-indigo-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {selectedType === 'all' ? 'All Reminders' : `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Reminders`}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplatesModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-all duration-200 text-sm font-medium border border-gray-200 dark:border-zinc-700"
          >
            <BookOpen size={16} />
            <span>{t('pages.templates1')}</span>
          </button>
          <button
            onClick={() => {
              setEditReminder(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          >
            <Plus size={16} />
            <span>{t('pages.newReminder')}</span>
          </button>
        </div>
      </div>

      {/* Reminders List */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <RemindersList
          key={refreshKey}
          reminders={filteredReminders}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggle={handleToggle}
          onDuplicate={handleDuplicate}
        />
      </div>

      {/* Create/Edit Modal */}
      <ReminderForm
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditReminder(null);
        }}
        onSave={handleCreate}
        editData={editReminder}
      />

      {/* Templates Modal */}
      <ReminderTemplates
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        type={selectedType === 'all' ? 'fee' : selectedType}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}
