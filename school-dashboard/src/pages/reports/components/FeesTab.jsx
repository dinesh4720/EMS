import { useState, useEffect, useCallback } from 'react';
import { Wallet, Receipt, AlertCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsApi } from '../../../services/api/extensions';
import StatCard from '../../../components/ui/StatCard';
import EmptyState from '../../../components/ui/EmptyState';
import ErrorState from '../../../components/ui/ErrorState';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import SectionHeading from '../../../components/ui/SectionHeading';
import ReportTable from './ReportTable';

export default function FeesTab({ metrics, academicYear }) {
  const [feeCollection, setFeeCollection] = useState([]);
  const [outstandingDues, setOutstandingDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fc, od] = await Promise.all([
        reportsApi.feeCollection({ academicYear }),
        reportsApi.outstandingDues({ academicYear }),
      ]);
      setFeeCollection(Array.isArray(fc) ? fc : []);
      setOutstandingDues(Array.isArray(od) ? od : []);
    } catch (err) {
      console.error('Failed to load fee reports:', err);
      setError(err);
      toast.error('Failed to load fee reports. Refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, [academicYear]);

  useEffect(() => {
    load();
  }, [load]);

  const fees = metrics?.fees || {};

  const collectionColumns = [
    { key: '_id', header: 'Month' },
    {
      key: 'totalCollected',
      header: 'Collected',
      align: 'right',
      render: (row) => (
        <span className="font-medium text-[var(--color-success)]">
          ₹{(row.totalCollected ?? 0).toLocaleString()}
        </span>
      ),
    },
    { key: 'transactionCount', header: 'Transactions', align: 'center' },
  ];

  const duesColumns = [
    { key: 'student', header: 'Student', render: (row) => row.studentId?.name },
    {
      key: 'class',
      header: 'Class',
      render: (row) =>
        `${row.classId?.name || ''}${row.classId?.section ? ` ${row.classId.section}` : ''}`,
    },
    {
      key: 'totalFee',
      header: 'Total Fee',
      align: 'right',
      render: (row) => `₹${(row.totalFee ?? 0).toLocaleString()}`,
    },
    {
      key: 'totalPaid',
      header: 'Paid',
      align: 'right',
      render: (row) => (
        <span className="text-[var(--color-success)]">₹{(row.totalPaid ?? 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'totalBalance',
      header: 'Balance',
      align: 'right',
      render: (row) => (
        <span className="font-medium text-[var(--color-error)]">
          ₹{(row.totalBalance ?? 0).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6" aria-live="polite" aria-busy={loading ? 'true' : undefined}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Monthly Collected"
          value={`₹${(fees.monthlyCollected ?? 0).toLocaleString()}`}
          icon={Wallet}
          color="success"
        />
        <StatCard
          label="Transactions"
          value={fees.monthlyTransactions ?? 0}
          icon={Receipt}
          color="primary"
        />
        <StatCard
          label="Pending Amount"
          value={`₹${(fees.pendingAmount ?? 0).toLocaleString()}`}
          icon={AlertCircle}
          color="danger"
        />
        <StatCard
          label="Pending Students"
          value={fees.pendingStudents ?? 0}
          icon={Users}
          color="amber"
        />
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : error ? (
        <ErrorState description="Could not load fee reports." error={error} onRetry={load} />
      ) : feeCollection.length === 0 && outstandingDues.length === 0 ? (
        <EmptyState
          icon={Wallet}
          size="md"
          title="No fee data for this academic year"
          description="No fee collection or outstanding dues have been recorded."
        />
      ) : (
        <div className="space-y-8">
          {feeCollection.length > 0 && (
            <section className="space-y-3">
              <SectionHeading size="sm">Monthly Fee Collection</SectionHeading>
              <ReportTable
                columns={collectionColumns}
                rows={feeCollection}
                getRowKey={(row, idx) => `${row._id}-${idx}`}
                aria-label="Monthly fee collection"
              />
            </section>
          )}
          {outstandingDues.length > 0 && (
            <section className="space-y-3">
              <SectionHeading size="sm">Outstanding Dues</SectionHeading>
              <ReportTable
                columns={duesColumns}
                rows={outstandingDues}
                getRowKey={(row, idx) => `${row.studentId?._id || idx}`}
                aria-label="Outstanding dues"
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
