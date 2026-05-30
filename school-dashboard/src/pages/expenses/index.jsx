import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";

const ExpensesPage = lazy(() => import("./ExpensesPage"));

export default function ExpensesIndex() {
  return (
    <Suspense fallback={<TablePageSkeleton kpiCards={3} columns={6} rows={6} />}>
      <Routes>
        <Route index element={<ExpensesPage />} />
      </Routes>
    </Suspense>
  );
}
