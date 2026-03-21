import { RotateCcw, Trash2 } from 'lucide-react';
import { STATUS_COLORS, formatDate } from './jobsUtils';

export default function JobsTable({ jobs, onRetry, onCancel, retrying, cancelling }) {
  if (!jobs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-zinc-700 dark:text-zinc-400">
        No jobs found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="pb-3 font-medium">Name</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Last Run</th>
            <th className="pb-3 font-medium">Next Run</th>
            <th className="pb-3 font-medium">Fail Reason</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job._id}
              className="border-b border-gray-100 align-top dark:border-zinc-800"
            >
              <td className="py-3 pr-4">
                <div className="font-medium text-gray-900 dark:text-zinc-100">{job.name}</div>
                {job.repeatInterval && (
                  <div className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
                    every {job.repeatInterval}
                  </div>
                )}
              </td>
              <td className="py-3 pr-4">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300'}`}
                >
                  {job.status}
                </span>
              </td>
              <td className="py-3 pr-4 text-gray-600 dark:text-zinc-400">
                {formatDate(job.lastRunAt)}
              </td>
              <td className="py-3 pr-4 text-gray-600 dark:text-zinc-400">
                {formatDate(job.nextRunAt)}
              </td>
              <td className="max-w-[200px] truncate py-3 pr-4 text-xs text-gray-500 dark:text-zinc-400">
                {job.failReason || '—'}
              </td>
              <td className="py-3 text-right">
                <div className="flex justify-end gap-1">
                  {job.status === 'failed' && (
                    <button
                      type="button"
                      onClick={() => onRetry(job._id)}
                      disabled={retrying[job._id]}
                      className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      title="Retry"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onCancel(job._id)}
                    disabled={cancelling[job._id]}
                    className="rounded-lg p-1.5 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    title="Cancel"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
