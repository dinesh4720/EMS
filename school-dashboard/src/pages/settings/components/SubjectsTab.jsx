import { Button, Chip } from "@heroui/react";
import { BookOpen, Edit2, Trash2, Layers, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SubjectsTab({ localSettings, onAddSubject, onEditSubject, onDeleteSubject }) {
  const { t } = useTranslation();

  return (
    <div className="pt-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-default-900">{t('settings.academics.subjectsTitle', 'Subject Repository')}</h3>
          <p className="text-sm text-default-500">{localSettings.subjects?.length || 0} {t('settings.academics.subjectsDesc', 'subjects configured')}</p>
        </div>
        <Button
          color="primary"
          radius="full"
          startContent={<Plus size={16} />}
          onPress={onAddSubject}
          className="shadow-md"
        >
          {t('settings.academics.addSubject', 'Add Subject')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {localSettings.subjects && localSettings.subjects.length > 0 ? (
          [...localSettings.subjects]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((subject, index) => {
              const subjectId = subject.id || subject._id;
              return (
                <div key={subjectId || `subject-${index}`} className="group p-4 bg-white border border-default-200 rounded-xl hover:border-primary transition-all duration-200 shadow-sm">
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
                      <Button isIconOnly variant="light" color="primary" size="sm" onPress={() => onEditSubject(subject)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button isIconOnly variant="light" color="danger" size="sm" onPress={() => onDeleteSubject(subject)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  {/* Assigned Classes */}
                  {subject.assignedClasses && subject.assignedClasses.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-default-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers size={12} className="text-default-400" />
                        <span className="text-xs font-medium text-default-500">Assigned to Classes:</span>
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
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-default-400 bg-white border border-default-200 rounded-xl border-dashed">
            <BookOpen size={32} className="mb-3 opacity-50" />
            <p>{t('settings.academics.subjectsDesc', 'No subjects defined yet.')}</p>
            <Button
              color="primary"
              variant="light"
              size="sm"
              className="mt-3"
              onPress={onAddSubject}
            >
              {t('settings.academics.addSubject', 'Add Subject')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
