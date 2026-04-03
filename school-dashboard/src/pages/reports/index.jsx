import { Routes, Route } from 'react-router-dom';
import ReportsPage from './ReportsPage';
import ExportCenter from './ExportCenter';

export default function ReportsLayout() {
  return (
    <Routes>
      <Route index element={<ReportsPage />} />
      <Route path="export" element={<ExportCenter />} />
    </Routes>
  );
}
