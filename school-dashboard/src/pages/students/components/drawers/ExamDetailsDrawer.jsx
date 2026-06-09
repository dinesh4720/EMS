import { useTranslation } from 'react-i18next';
import {
  Drawer, Button, Progress
} from "../../../../components/ui";
import { FileText, Download, BookOpen, X } from "lucide-react";

export default function ExamDetailsDrawer({ isOpen, onOpenChange, selectedExam, results }) {
  const { t } = useTranslation();

  return (
    <Drawer
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      size="md"
      hideCloseButton
    >
      {(onClose) => (
        <>
          <div className="ds-drawer__head">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary"><FileText size={20} /></div>
              <div>
                <h3 className="text-lg font-semibold">{selectedExam?.name || t('students.profile.overview.examDetails', 'Exam Details')}</h3>
                <p className="text-xs text-fg-muted">{selectedExam?.date}</p>
              </div>
            </div>
            <button
              type="button"
              className="ds-modal__close"
              onClick={onClose}
              aria-label={t('common.close', 'Close')}
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
          <div className="ds-drawer__body p-0">
            <div className="p-6 grid grid-cols-2 gap-4 bg-surface-2 border-b border-divider">
              <div className="p-4 bg-surface rounded-xl border border-divider text-center">
                <span className="text-xs text-fg-muted uppercase">{t('students.profile.overview.totalScore', 'Total Score')}</span>
                <div className="text-2xl font-bold text-fg mt-1">
                  {selectedExam?.percentage != null ? `${selectedExam.percentage}%` : selectedExam?.totalMarksObtained != null ? `${selectedExam.totalMarksObtained}/${selectedExam.totalMaxMarks}` : '—'}
                </div>
              </div>
              <div className="p-4 bg-surface rounded-xl border border-divider text-center">
                <span className="text-xs text-fg-muted uppercase">{t('students.profile.overview.rank', 'Rank')}</span>
                <div className="text-2xl font-bold text-primary mt-1">{selectedExam?.rank != null ? `#${selectedExam.rank}` : '—'}</div>
              </div>
            </div>
            <div className="p-6">
              <h4 className="font-semibold text-fg mb-4">{t('students.profile.overview.subjectwisePerformance', 'Subject-wise Performance')}</h4>
              {results && results.length > 0 ? (
                <div className="space-y-4">
                  {results.slice(0, 5).map((r, i) => {
                    const pct = r.maxMarks > 0
                      ? Math.round(Math.min(100, Math.max(0, (r.marksObtained / r.maxMarks) * 100)))
                      : 0;
                    return (
                      <div key={r.subjectName || `result-${i}`} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-fg">{r.subjectName || 'Subject'}</span>
                            <span className="text-sm font-semibold">{r.marksObtained ?? '—'}/{r.maxMarks ?? '—'} ({pct}%)</span>
                          </div>
                          <Progress
                            aria-label={t('common.subjectScore', {subject: r.subjectName, defaultValue: '{{subject}} score'})}
                            value={pct}
                            color={pct >= 90 ? "success" : pct >= 75 ? "primary" : "warning"}
                            size="sm"
                            className="w-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-fg-faint">
                  <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('students.profile.overview.noSubjectResults', 'No subject results available')}</p>
                </div>
              )}
            </div>
          </div>
          <div className="ds-drawer__foot">
            <Button variant="ghost" onClick={onClose}>{t('common.close', 'Close')}</Button>
            <Button variant="primary" icon={<Download size={16} />}>{t('students.profile.overview.downloadReport', 'Download Report')}</Button>
          </div>
        </>
      )}
    </Drawer>
  );
}
