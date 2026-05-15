import { Button, Chip, Switch, Tooltip } from "@heroui/react";
import { Edit2, Trash2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ClassesTab({
  ALL_CLASSES,
  classConfig,
  onEditSection,
  onDeleteSection,
  onDisableClass,
  setSelectedClassNum,
  setEditingSection,
  setNewSection,
  onOpenClassModal,
}) {
  const { t } = useTranslation();

  const openAddSectionModal = (classNum) => {
    setSelectedClassNum(classNum);
    setEditingSection(null);
    setNewSection("");
    onOpenClassModal();
  };

  return (
    <div className="pt-6 space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-fg">{t('pages.classesSections')}</h3>
          <p className="text-sm text-fg-muted">{t('pages.enableClassesAndManageSections')}</p>
        </div>
      </div>

      {/* List View */}
      <div className="rounded-xl border border-border-token bg-surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-token bg-surface-2">
              <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wider w-16">{t('pages.class1')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wider">{t('pages.sections1')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wider w-24">{t('pages.students1')}</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wider w-20">{t('pages.enabled')}</th>
            </tr>
          </thead>
          <tbody>
            {ALL_CLASSES.map((classNum) => {
              const config = classConfig[classNum];
              const hasStudents = config.totalStrength > 0;
              return (
                <tr key={classNum} className={`border-b border-divider last:border-b-0 ${config.enabled ? 'bg-primary/5' : ''}`}>
                  <td className="px-4 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      config.enabled ? 'bg-primary text-white' : 'bg-surface-2 text-fg-muted'
                    }`}>
                      {classNum}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {config.enabled ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {config.sectionDetails.map((cls) => (
                          <div key={cls.id || cls._id} className="group flex items-center gap-1">
                            <Chip size="sm" color="primary" variant="flat">
                              {cls.section}
                            </Chip>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                aria-label="Edit section"
                                className="h-6 w-6 min-w-6"
                                onPress={() => onEditSection(classNum, cls.section, cls.id || cls._id)}
                              >
                                <Edit2 size={10} />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                aria-label="Delete section"
                                className="h-6 w-6 min-w-6"
                                onPress={() => onDeleteSection(cls)}
                              >
                                <Trash2 size={10} />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="primary"
                          aria-label="Add section"
                          className="h-7 w-7 min-w-7"
                          onPress={() => openAddSectionModal(classNum)}
                        >
                          <Plus size={14} />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-fg-faint text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${config.totalStrength > 0 ? 'text-fg font-medium' : 'text-fg-faint'}`}>
                      {config.totalStrength || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Tooltip
                      content={hasStudents ? "Cannot disable: Students enrolled" : config.enabled ? "Click to disable" : "Click to enable"}
                      placement="top"
                    >
                      <div className="flex justify-center">
                        <Switch
                          size="sm"
                          color="primary"
                          isSelected={config.enabled}
                          isDisabled={hasStudents && config.enabled}
                          onValueChange={(enabled) => {
                            if (enabled) {
                              setSelectedClassNum(classNum);
                              setEditingSection(null);
                              setNewSection("");
                              onOpenClassModal();
                            } else {
                              onDisableClass(classNum);
                            }
                          }}
                        />
                      </div>
                    </Tooltip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
