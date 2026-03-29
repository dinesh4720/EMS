import { Card, CardBody, Button, Chip } from '@heroui/react';
import {
  CheckCircle, XCircle, ArrowUpCircle, GraduationCap, Minus, RotateCcw,
} from 'lucide-react';

export default function StepResults({ wizardState, onReset, onGoToHistory }) {
  const { result } = wizardState;
  const summary = result?.summary || {};
  const classMappings = result?.classMappings || [];
  const errors = result?.errors || [];
  const hasErrors = errors.length > 0;

  return (
    <div className="space-y-5">
      {/* Success / partial success banner */}
      <Card
        shadow="sm"
        className={`border ${
          hasErrors
            ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
            : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
        }`}
      >
        <CardBody className="p-5">
          <div className="flex items-start gap-3">
            {hasErrors ? (
              <XCircle size={24} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
            ) : (
              <CheckCircle size={24} className="text-green-600 dark:text-green-400 mt-0.5" />
            )}
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                {hasErrors ? 'Promotion completed with some errors' : 'Promotion completed successfully!'}
              </p>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                {wizardState.fromYear} &rarr; {wizardState.toYear} &middot;{' '}
                {summary.totalStudents || 0} students processed across {classMappings.length} classes
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-700 dark:text-zinc-300">{summary.totalStudents || 0}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{summary.promoted || 0}</p>
          <p className="text-xs text-green-600">Promoted</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{summary.detained || 0}</p>
          <p className="text-xs text-yellow-600">Detained</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{summary.graduated || 0}</p>
          <p className="text-xs text-purple-600">Graduated</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{summary.errors || 0}</p>
          <p className="text-xs text-red-600">Errors</p>
        </div>
      </div>

      {/* Class-wise results */}
      {classMappings.length > 0 && (
        <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
          <CardBody className="p-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">Class-wise Results</p>
            <div className="space-y-2">
              {classMappings.map((cm, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                      {cm.fromClassName} &rarr; {cm.toClassName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                      {cm.studentCount} students
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {cm.promotedCount > 0 && (
                      <Chip size="sm" variant="flat" startContent={<ArrowUpCircle size={12} />}
                        className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        {cm.promotedCount}
                      </Chip>
                    )}
                    {cm.detainedCount > 0 && (
                      <Chip size="sm" variant="flat" startContent={<Minus size={12} />}
                        className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                        {cm.detainedCount}
                      </Chip>
                    )}
                    {cm.graduatedCount > 0 && (
                      <Chip size="sm" variant="flat" startContent={<GraduationCap size={12} />}
                        className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {cm.graduatedCount}
                      </Chip>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Errors detail */}
      {errors.length > 0 && (
        <Card shadow="sm" className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <CardBody className="p-4">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">Errors ({errors.length})</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {errors.map((err, idx) => (
                <p key={idx} className="text-xs text-red-600 dark:text-red-400">
                  Student {err.studentId}: {err.error}
                </p>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button
          variant="flat"
          startContent={<RotateCcw size={14} />}
          onPress={onGoToHistory}
        >
          View History & Rollback
        </Button>
        <Button
          className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
          onPress={onReset}
        >
          Start New Promotion
        </Button>
      </div>
    </div>
  );
}
