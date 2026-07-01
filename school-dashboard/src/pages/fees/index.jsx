import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";

// Phase 7 — slim Routes wrapper. The legacy 4-tab Payments page (with KPIs,
// Tabs chrome, and inline collection logic) is gone; FeesPage owns `/fees`
// now with a single canonical surface (KPI strip + payments table + sheet).
//
// Redirects:
//   /fees/defaulters → /fees?status=overdue   (defaulters merged into filter)
//   /fees/templates  → /settings/fee-templates  (admin setup belongs in Settings)
const FeesPage = lazy(() => import("./FeesPage"));
const Refunds = lazy(() => import("./Refunds"));

export default function FeesIndex() {
  return (
    <Suspense fallback={<TablePageSkeleton kpiCards={3} columns={6} rows={8} />}>
      <Routes>
        <Route index element={<FeesPage />} />
        <Route path="refunds" element={<Refunds />} />
        <Route
          path="defaulters"
          element={<Navigate to="/fees?status=overdue" replace />}
        />
        <Route
          path="templates"
          element={<Navigate to="/settings/fee-templates" replace />}
        />
        <Route path="*" element={<Navigate to="/fees" replace />} />
      </Routes>
    </Suspense>
  );
}
