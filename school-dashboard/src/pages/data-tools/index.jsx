import { Routes, Route } from 'react-router-dom';
import BackgroundJobs from './BackgroundJobs';
import GovtExport from './GovtExport';
import BulkImport from './BulkImport';

export default function DataToolsPage() {
  return (
    <Routes>
      <Route path="jobs" element={<BackgroundJobs />} />
      <Route path="govt-export" element={<GovtExport />} />
      <Route path="bulk-import" element={<BulkImport />} />
    </Routes>
  );
}
