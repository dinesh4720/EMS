import { useMemo } from "react";
import PropTypes from "prop-types";
import { BookOpen, Plus, Edit2, Trash2, RefreshCw, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { settingsApi } from "../../../../services/api";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  MinimalButton,
} from "../../../../components/ui";

export default function SubjectsTab({
  localSettings,
  onEditSubject,
  onDeleteSubject,
  onOpenSubjectModal,
  setEditingSubject,
  setNewSubject,
}) {
  const { t } = useTranslation();
  const subjects = localSettings.subjects || [];
  const hasSubjects = subjects.length > 0;
  const sortedSubjects = useMemo(
    () => [...(localSettings.subjects || [])].sort((left, right) => left.name.localeCompare(right.name)),
    [localSettings.subjects],
  );

  const handleSync = async () => {
    try {
      const result = await settingsApi.syncSubjectsToClasses();
      toast.success(
        t("pages.subjectsSyncedToClasses", {
          count: result.classesUpdated,
          defaultValue: `Synced subjects to ${result.classesUpdated} classes`,
        }),
      );
    } catch {
      toast.error(t("pages.failedToSyncSubjects", { defaultValue: "Failed to sync subjects" }));
    }
  };

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setNewSubject({ name: "", code: "", assignedClasses: [] });
    onOpenSubjectModal();
  };

  return (
    <div className="pt-6 space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {t("pages.subjectRepository")}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            {t("pages.subjectsConfigured", {
              count: subjects.length,
              defaultValue: `${subjects.length} subjects configured`,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={handleSync}
            disabled={!hasSubjects}
          >
            {t("pages.syncToClasses", { defaultValue: "Sync to Classes" })}
          </Button>
          <MinimalButton icon={<Plus size={16} />} onClick={handleOpenCreate}>
            {t("pages.addSubject", { defaultValue: "Add Subject" })}
          </MinimalButton>
        </div>
      </div>

      {hasSubjects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedSubjects.map((subject, index) => {
              const subjectId = subject.id || subject._id || `subject-${index}`;
              return (
                <Card key={subjectId} padding="sm" className="group">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-semibold text-lg shrink-0">
                        {subject.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-[var(--color-text-primary)] truncate">
                          {subject.name}
                        </h4>
                        {subject.code && (
                          <p className="mt-1 inline-block text-xs text-[var(--color-text-muted)] font-mono bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">
                            {subject.code}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                      <IconButton
                        size="sm"
                        variant="ghost"
                        aria-label={t("pages.editSubject", { defaultValue: "Edit subject" })}
                        title={t("pages.editSubject", { defaultValue: "Edit subject" })}
                        onClick={() => onEditSubject(subject)}
                        icon={<Edit2 size={14} />}
                      />
                      <IconButton
                        size="sm"
                        variant="danger"
                        aria-label={t("pages.deleteSubject", { defaultValue: "Delete subject" })}
                        title={t("pages.deleteSubject", { defaultValue: "Delete subject" })}
                        onClick={() => onDeleteSubject(subject)}
                        icon={<Trash2 size={14} />}
                      />
                    </div>
                  </div>

                  {subject.assignedClasses && subject.assignedClasses.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers size={12} className="text-[var(--color-text-muted)]" aria-hidden="true" />
                        <span className="text-xs font-medium text-[var(--color-text-muted)]">
                          {t("pages.assignedToClasses")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {[...subject.assignedClasses]
                          .sort((left, right) => left - right)
                          .map((cls) => (
                            <Badge key={cls} color="info" size="sm">
                              {cls}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      ) : (
        <Card padding="none" className="border-dashed">
          <EmptyState
            icon={BookOpen}
            title={t("pages.noSubjectsDefinedYet")}
            description={t("pages.subjectRepositoryDesc", {
              defaultValue: "Create subjects once and assign them to classes.",
            })}
            action={
              <MinimalButton icon={<Plus size={16} />} onClick={handleOpenCreate}>
                {t("pages.addFirstSubject", { defaultValue: "Add your first subject" })}
              </MinimalButton>
            }
          />
        </Card>
      )}
    </div>
  );
}

SubjectsTab.propTypes = {
  localSettings: PropTypes.shape({
    subjects: PropTypes.array,
  }).isRequired,
  onEditSubject: PropTypes.func.isRequired,
  onDeleteSubject: PropTypes.func.isRequired,
  onOpenSubjectModal: PropTypes.func.isRequired,
  setEditingSubject: PropTypes.func.isRequired,
  setNewSubject: PropTypes.func.isRequired,
};
