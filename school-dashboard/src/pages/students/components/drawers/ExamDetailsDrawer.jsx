import { useTranslation } from 'react-i18next';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  Button, Progress
} from "@heroui/react";
import { FileText, Download, BookOpen } from "lucide-react";

export default function ExamDetailsDrawer({ isOpen, onOpenChange, selectedExam, results }) {
  const { t } = useTranslation();

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="right"
      size="md"
      classNames={{
        wrapper: "!z-50",
        base: "m-2 rounded-xl shadow-xl dark:shadow-zinc-900/50 h-[calc(100%-1rem)]",
        backdrop: "!z-40"
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="border-b border-default-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary"><FileText size={20} /></div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedExam?.name || t('students.profile.overview.examDetails', 'Exam Details')}</h3>
                  <p className="text-xs text-default-500">{selectedExam?.date}</p>
                </div>
              </div>
            </DrawerHeader>
            <DrawerBody className="p-0">
              <div className="p-6 grid grid-cols-2 gap-4 bg-default-50 border-b border-default-200">
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-default-200 text-center">
                  <span className="text-xs text-default-500 uppercase">{t('students.profile.overview.totalScore', 'Total Score')}</span>
                  <div className="text-2xl font-bold text-default-900 mt-1">
                    {selectedExam?.percentage != null ? `${selectedExam.percentage}%` : selectedExam?.totalMarksObtained != null ? `${selectedExam.totalMarksObtained}/${selectedExam.totalMaxMarks}` : '—'}
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-default-200 text-center">
                  <span className="text-xs text-default-500 uppercase">{t('students.profile.overview.rank', 'Rank')}</span>
                  <div className="text-2xl font-bold text-primary mt-1">{selectedExam?.rank != null ? `#${selectedExam.rank}` : '—'}</div>
                </div>
              </div>
              <div className="p-6">
                <h4 className="font-semibold text-default-900 mb-4">{t('students.profile.overview.subjectwisePerformance', 'Subject-wise Performance')}</h4>
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
                              <span className="text-sm font-medium text-default-700">{r.subjectName || 'Subject'}</span>
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
                  <div className="text-center py-8 text-default-400">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('students.profile.overview.noSubjectResults', 'No subject results available')}</p>
                  </div>
                )}
              </div>
            </DrawerBody>
            <DrawerFooter className="border-t border-default-100">
              <Button variant="light" onPress={onClose}>{t('common.close', 'Close')}</Button>
              <Button color="primary" startContent={<Download size={16} />}>{t('students.profile.overview.downloadReport', 'Download Report')}</Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
