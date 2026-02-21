import React, { useState } from 'react';
import {
  Wallet,
  Megaphone,
  MessageSquare,
  Clock,
  ChevronRight
} from 'lucide-react';

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'payments', label: 'Payments' },
  { id: 'announcements', label: 'Updates' },
];

const getActivityIcon = (type) => {
  switch (type) {
    case 'payment':
      return { icon: Wallet, color: 'text-gray-600 bg-gray-100' };
    case 'announcement':
      return { icon: Megaphone, color: 'text-gray-600 bg-gray-100' };
    case 'message':
      return { icon: MessageSquare, color: 'text-gray-600 bg-gray-100' };
    default:
      return { icon: Clock, color: 'text-gray-500 bg-gray-100' };
  }
};

const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function ActivityFeed({ payments, announcements, communications }) {
  const [activeTab, setActiveTab] = useState('all');

  // Combine and sort all activities
  const allActivities = [
    ...(payments || []).map(p => ({ ...p, type: 'payment', time: p.date })),
    ...(announcements || []).map(a => ({ ...a, type: 'announcement', time: a.date })),
    ...(communications || []).map(c => ({ ...c, type: 'message', time: c.date })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);

  const filteredActivities = activeTab === 'all'
    ? allActivities
    : allActivities.filter(a => a.type === activeTab.slice(0, -1) || (activeTab === 'announcements' && a.type === 'announcement'));

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 text-sm">Recent Activity</h3>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-200">
        {filteredActivities.map((activity, index) => {
          const { icon: Icon, color } = getActivityIcon(activity.type);

          return (
            <div
              key={`${activity.type}-${activity.id || index}`}
              className="group flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {/* Icon */}
              <div className={`shrink-0 w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
                <Icon size={14} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.student || activity.title || activity.subject || 'Activity'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {activity.type === 'payment' && `₹${activity.amount} - ${activity.status}`}
                  {activity.type === 'announcement' && activity.content}
                  {activity.type === 'message' && `${activity.from}: ${activity.message}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {getRelativeTime(activity.time)}
                </span>
                <ChevronRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full py-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-1">
          View all activity
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

export default React.memo(ActivityFeed);
