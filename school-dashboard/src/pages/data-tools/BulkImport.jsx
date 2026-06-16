import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MinimalTabs from '../../components/ui/MinimalTabs';
import PageHeader from '../../components/ui/PageHeader';
import BulkImportForm from './BulkImportForm';
import BulkImportHistory from './BulkImportHistory';

export default function BulkImport() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('import');
  const baseId = useId();

  const tabs = [
    { key: 'import', title: t('dataTools.bulkImport.tabImport', 'Import') },
    { key: 'history', title: t('dataTools.bulkImport.tabHistory', 'History') },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <PageHeader title={t('dataTools.bulkImport.title', 'Bulk Import')} bordered={false} />

      <MinimalTabs
        tabs={tabs}
        activeKey={activeTab}
        onChange={setActiveTab}
        variant="underline"
        baseId={baseId}
        ariaLabel={t('dataTools.bulkImport.sectionsAria', 'Bulk import sections')}
      />

      <div
        role="tabpanel"
        id={`${baseId}-tabpanel-${activeTab}`}
        aria-labelledby={`${baseId}-tab-${activeTab}`}
      >
        {activeTab === 'import' ? <BulkImportForm /> : <BulkImportHistory />}
      </div>
    </div>
  );
}
