import { useState, useEffect } from "react";
import { Button, Card, Tabs, Tab } from "@heroui/react";
import { Plus, Bell, DollarSign, Calendar, BookOpen, Users } from "lucide-react";
import ReminderForm from "./components/reminders/ReminderForm";
import RemindersList from "./components/reminders/RemindersList";
import ReminderTemplates from "./components/reminders/ReminderTemplates";
import { remindersApi } from "../../services/api";
import toast from "react-hot-toast";

export default function Reminders() {
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
      console.log('🔔 Loading reminders...');
      const response = await remindersApi.getAll();
      console.log('🔔 Reminders loaded:', response);
      // Backend returns { reminders: [], ... }
      setReminders(response.reminders || response || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
      const errorMsg = error.message || 'Unknown error';
      setError(errorMsg);
      toast.error(`Failed to load reminders: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    try {
      if (editReminder) {
        await remindersApi.update(editReminder._id, formData);
        toast.success('Reminder updated successfully');
      } else {
        await remindersApi.create(formData);
        toast.success('Reminder created successfully');
      }
      setRefreshKey(prev => prev + 1);
      setShowCreateModal(false);
      setEditReminder(null);
    } catch (error) {
      console.error('Error saving reminder:', error);
      toast.error('Failed to save reminder');
    }
  };

  const handleEdit = (reminder) => {
    setEditReminder(reminder);
    setShowCreateModal(true);
  };

  const handleDelete = async (reminderId) => {
    try {
      await remindersApi.delete(reminderId);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  };

  const handleToggle = async (reminderId, active) => {
    try {
      await remindersApi.toggle(reminderId, active);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error toggling reminder:', error);
      throw error;
    }
  };

  const handleDuplicate = async (reminder) => {
    try {
      await remindersApi.duplicate(reminder._id);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error duplicating reminder:', error);
      throw error;
    }
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

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="text-primary" size={28} />
            Reminders
          </h1>
          <p className="text-default-500 mt-1">
            Automated reminders for fees, attendance, and events
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="flat"
            onPress={() => setShowTemplatesModal(true)}
            startContent={<BookOpen size={18} />}
          >
            Templates
          </Button>
          <Button
            color="primary"
            onPress={() => {
              setEditReminder(null);
              setShowCreateModal(true);
            }}
            startContent={<Plus size={18} />}
          >
            Create Reminder
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border border-default-200">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Reminders</p>
                <p className="text-2xl font-bold">{stats.total}</p>
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
                <p className="text-sm text-default-500">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-default-200">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <DollarSign size={24} className="text-warning" />
              </div>
              <div>
                <p className="text-sm text-default-500">Fee Reminders</p>
                <p className="text-2xl font-bold">{stats.fee}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-default-200">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-danger/10 flex items-center justify-center">
                <Users size={24} className="text-danger" />
              </div>
              <div>
                <p className="text-sm text-default-500">Attendance Alerts</p>
                <p className="text-2xl font-bold">{stats.attendance}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Type Tabs */}
      <Tabs
        selectedKey={selectedType}
        onSelectionChange={(key) => setSelectedType(key)}
        className="mb-4"
      >
        <Tab key="all" title="All Reminders" />
        <Tab key="fee" title={<div className="flex items-center gap-1"><DollarSign size={16} /> Fee</div>} />
        <Tab key="attendance" title={<div className="flex items-center gap-1"><Users size={16} /> Attendance</div>} />
        <Tab key="academic" title={<div className="flex items-center gap-1"><BookOpen size={16} /> Academic</div>} />
        <Tab key="event" title={<div className="flex items-center gap-1"><Calendar size={16} /> Events</div>} />
      </Tabs>

      {/* Error State */}
      {error && reminders.length === 0 && (
        <Card className="border border-default-200">
          <div className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-danger">Failed to load reminders</p>
              <p className="text-sm text-default-500 max-w-md text-center">{error}</p>
              <Button
                color="primary"
                size="sm"
                onPress={() => setRefreshKey(prev => prev + 1)}
                startContent={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>}
              >
                Retry
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Reminders List */}
      <Card className="border border-default-200">
        <div className="p-6">
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
      </Card>

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
