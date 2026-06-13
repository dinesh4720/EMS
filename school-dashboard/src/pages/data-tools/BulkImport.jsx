import { useState } from 'react';
import MinimalTabs from '../../components/ui/MinimalTabs';
import PageHeader from '../../components/ui/PageHeader';
import BulkImportForm from './BulkImportForm';
import BulkImportHistory from './BulkImportHistory';

const TABS = [
  { key: 'import', title: 'Import' },
  { key: 'history', title: 'History' },
];

export default function BulkImport() {
  const [activeTab, setActiveTab] = useState('import');

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <PageHeader title="Bulk Import" bordered={false} />

      <MinimalTabs
        tabs={TABS}
        activeKey={activeTab}
        onChange={setActiveTab}
        variant="underline"
        ariaLabel="Bulk import sections"
      />

      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'import' ? <BulkImportForm /> : <BulkImportHistory />}
      </div>
    </div>
  );
}
