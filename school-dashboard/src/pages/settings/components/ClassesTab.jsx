import { Button, Chip, Switch, Tooltip } from "@heroui/react";
import { Edit2, Trash2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

const ALL_CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function ClassesTab({ classConfig, localSettings, enabledClasses, onAddSection, onEditSection, onDeleteSection, onDisableClass }) {
  const { t } = useTranslation();

  return (
    <div className="pt-6 space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-default-900">{t('settings.academics.classesTitle', 'Classes & Sections')}</h3>
          <p className="text-sm text-default-500">{t('settings.academics.classesDesc', 'Enable classes and manage sections')}</p>
        </div>
      </div>

      {/* List View */}
      <div className="rounded-xl border border-default-200 bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-default-200 bg-default-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-500 uppercase tracking-wider w-16">{t('pages.class1')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-500 uppercase tracking-wider">{t('pages.sections1')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-500 uppercase tracking-wider w-24">{t('pages.students1')}</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-default-500 uppercase tracking-wider w-20">{t('pages.enabled')}</th>
            </tr>
          </thead>
          <tbody>
            {ALL_CLASSES.map((classNum) => {
              const config = classConfig[classNum];
              const hasStudents = config.totalStrength > 0;
              return (
                <tr key={classNum} className={`border-b border-default-100 last:border-b-0 ${config.enabled ? 'bg-primary/5' : ''}`}>
                  <td className="px-4 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      config.enabled ? 'bg-primary text-white' : 'bg-default-100 text-default-500'
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
                          className="h-7 w-7 min-w-7"
                          onPress={() => onAddSection(classNum)}
                        >
                          <Plus size={14} />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-default-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${config.totalStrength > 0 ? 'text-default-700 font-medium' : 'text-default-400'}`}>
                      {config.totalStrength || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Tooltip
                      content={hasStudents ? t('settings.academics.tooltipStudentsEnrolled', 'Cannot disable: Students enrolled') : config.enabled ? t('settings.academics.tooltipClickDisable', 'Click to disable') : t('settings.academics.tooltipClickEnable', 'Click to enable')}
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
                              onAddSection(classNum);
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
