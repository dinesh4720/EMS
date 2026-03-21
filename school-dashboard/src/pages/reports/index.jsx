import { useState } from 'react';
import { BarChart3, Download, Activity } from 'lucide-react';
import ReportsPage from './ReportsPage';
import ExportCenter from './ExportCenter';
import BackgroundJobs from './BackgroundJobs';

const TABS = [
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'exports', label: 'Export Center', icon: Download },
  { key: 'jobs', label: 'Background Jobs', icon: Activity },
];

export default function ReportsLayout() {
  const [activeTab, setActiveTab] = useState('reports');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 p-1.5 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors
              ${activeTab === tab.key
                ? 'bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900'}
            `}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'reports' && <ReportsPage />}
      {activeTab === 'exports' && <ExportCenter />}
      {activeTab === 'jobs' && <BackgroundJobs />}
    </div>
  );
}
