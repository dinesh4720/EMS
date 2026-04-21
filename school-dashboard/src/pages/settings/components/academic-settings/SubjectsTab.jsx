import { Button, Chip } from "@heroui/react";
import { BookOpen, Plus, Edit2, Trash2, RefreshCw, Layers } from "lucide-react";
import { settingsApi } from "../../../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function SubjectsTab({
  localSettings,
  onEditSubject,
  onDeleteSubject,
  onOpenSubjectModal,
  setEditingSubject,
  setNewSubject,
}) {
  const { t } = useTranslation();

  return (
    <div className="pt-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-default-900">{t('pages.subjectRepository')}</h3>
          <p className="text-sm text-default-500">{localSettings.subjects?.length || 0} subjects configured</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="flat"
            radius="full"
            startContent={<RefreshCw size={16} />}
            onPress={async () => {
              try {
                const result = await settingsApi.syncSubjectsToClasses();
                toast.success(`Synced subjects to ${result.classesUpdated} classes`);
              } catch {
                toast.error('Failed to sync subjects');
              }
            }}
            isDisabled={!localSettings.subjects?.length}
          >
            Sync to Classes
          </Button>
          <Button
            color="primary"
            radius="full"
            startContent={<Plus size={16} />}
            onPress={() => { setEditingSubject(null); setNewSubject({ name: "", code: "", assignedClasses: [] }); onOpenSubjectModal(); }}
            className="shadow-md"
          >
            Add Subject
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {localSettings.subjects && localSettings.subjects.length > 0 ? (
          [...localSettings.subjects]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((subject, index) => {
              const subjectId = subject.id || subject._id;
              return (
                <div key={subjectId || `subject-${index}`} className="group p-4 bg-white dark:bg-zinc-950 border border-default-200 rounded-xl hover:border-primary transition-all duration-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                        {subject.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-default-900">{subject.name}</h4>
                        <p className="text-xs text-default-500 font-mono bg-default-100 px-1.5 py-0.5 rounded inline-block mt-1">{subject.code}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button isIconOnly variant="light" color="primary" size="sm" aria-label="Edit subject" onPress={() => onEditSubject(subject)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button isIconOnly variant="light" color="danger" size="sm" aria-label="Delete subject" onPress={() => onDeleteSubject(subject)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  {/* Assigned Classes */}
                  {subject.assignedClasses && subject.assignedClasses.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-default-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers size={12} className="text-default-400" />
                        <span className="text-xs font-medium text-default-500">{t('pages.assignedToClasses')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {subject.assignedClasses.sort((a, b) => a - b).map(cls => (
                          <Chip key={cls} size="sm" color="primary" variant="flat" className="text-xs">
                            {cls}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-default-400 bg-white dark:bg-zinc-950 border border-default-200 rounded-xl border-dashed">
            <BookOpen size={32} className="mb-3 opacity-50" />
            <p>{t('pages.noSubjectsDefinedYet')}</p>
            <Button
              color="primary"
              variant="light"
              size="sm"
              className="mt-3"
              onPress={() => onOpenSubjectModal()}
            >
              Add your first subject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
