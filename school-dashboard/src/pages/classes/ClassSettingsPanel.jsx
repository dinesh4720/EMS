import { useState, useEffect } from "react";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { Settings, Tag, BookOpen, Save, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";
import { useTranslation } from 'react-i18next';
import {
  showErrorToast,
  showSuccessToast,
  executeWithFeedback
} from "../../utils/errorHandling";
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesModal from '../../components/modals/UnsavedChangesModal';
import logger from '../../utils/logger';
import Chip from '../../components/ui/Chip';
import MultiSelect from '../../components/ui/MultiSelect';
import { DEFAULT_SUBJECTS } from "../../constants/subjects";


export default function ClassSettingsPanel({
  classId }) {
  const { t } = useTranslation();
  const { classesApi, schoolSettings } = useApp();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classTag, setClassTag] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [errors, setErrors] = useState({});
  const [originalTag, setOriginalTag] = useState("");
  const [originalSubjects, setOriginalSubjects] = useState([]);

  const isDirty =
    classTag !== originalTag ||
    selectedSubjects.length !== originalSubjects.length ||
    selectedSubjects.some(s => !originalSubjects.includes(s));

  const { isBlocked, proceed, reset } = useUnsavedChanges(isDirty);

  // Check if user has edit permission
  const canEdit = hasPermission('classes', 'edit');

  // Available subjects from school settings - extract names from objects
  const availableSubjects = schoolSettings?.subjects?.map(s =>
    typeof s === 'string' ? s : s.name
  ) || DEFAULT_SUBJECTS;

  const subjectOptions = availableSubjects.map(s => ({ value: s, label: s }));

  // Load class settings on mount
  useEffect(() => {
    if (classId) {
      loadClassSettings();
    }
  }, [classId]);

  const loadClassSettings = async () => {
    try {
      setLoading(true);
      const settings = await classesApi.getSettings(classId);
      
      if (settings) {
        const tag = settings.classTag || "";
        // Normalize subjects to strings (handle both string and object formats)
        const normalizedSubjects = (settings.assignedSubjects || []).map(s =>
          typeof s === 'string' ? s : s.name
        );
        setClassTag(tag);
        setSelectedSubjects(normalizedSubjects);
        setOriginalTag(tag);
        setOriginalSubjects(normalizedSubjects);
      }
    } catch (error) {
      logger.error("Error loading class settings:", error);
      showErrorToast(error, "Failed to load class settings");
    } finally {
      setLoading(false);
    }
  };

  const validateTag = () => {
    const newErrors = {};
    if (classTag && classTag.length > 50) {
      newErrors.classTag = "Class tag must be 50 characters or less";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSubjects = () => {
    const newErrors = {};
    if (selectedSubjects.length === 0) {
      newErrors.subjects = "Please select at least one subject";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTagUpdate = async () => {
    if (!validateTag()) {
      return;
    }

    await executeWithFeedback(
      async () => {
        setSaving(true);
        await classesApi.updateTag(classId, classTag);
        setErrors({});
      },
      {
        loadingMessage: 'Updating class tag...',
        successMessage: 'Class tag updated successfully!',
        errorMessage: null,
        onSuccess: () => {
          setOriginalTag(classTag);
          setSaving(false);
        },
        onError: () => {
          setSaving(false);
        }
      }
    );
  };

  const handleSubjectSelection = (nextValues) => {
    setSelectedSubjects(nextValues);
    
    // Clear subjects error when user makes a selection
    if (nextValues.length > 0 && errors.subjects) {
      setErrors(prev => ({ ...prev, subjects: undefined }));
    }
  };

  const handleSaveSubjects = async () => {
    if (!validateSubjects()) {
      return;
    }

    await executeWithFeedback(
      async () => {
        setSaving(true);
        await classesApi.updateSubjects(classId, selectedSubjects);
        setErrors({});
      },
      {
        loadingMessage: 'Updating subjects...',
        successMessage: 'Subjects updated successfully!',
        errorMessage: null,
        onSuccess: () => {
          setOriginalSubjects([...selectedSubjects]);
          setSaving(false);
        },
        onError: () => {
          setSaving(false);
        }
      }
    );
  };

  const handleSaveAll = async () => {
    const tagErrors = {};
    if (classTag && classTag.length > 50) {
      tagErrors.classTag = "Class tag must be 50 characters or less";
    }
    const subjectErrors = {};
    if (selectedSubjects.length === 0) {
      subjectErrors.subjects = "Please select at least one subject";
    }
    const allErrors = { ...tagErrors, ...subjectErrors };
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      return;
    }

    await executeWithFeedback(
      async () => {
        setSaving(true);

        // Update both tag and subjects
        await Promise.all([
          classesApi.updateTag(classId, classTag),
          classesApi.updateSubjects(classId, selectedSubjects)
        ]);

        setErrors({});
      },
      {
        loadingMessage: 'Saving class settings...',
        successMessage: 'Class settings saved successfully!',
        errorMessage: null,
        onSuccess: () => {
          // Update original values so dirty tracking resets properly
          setOriginalTag(classTag);
          setOriginalSubjects([...selectedSubjects]);
          setSaving(false);
        },
        onError: () => {
          setSaving(false);
        }
      }
    );
  };

  if (loading) {
    return <TablePageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card__head">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-2 rounded-lg">
              <Settings size={20} className="text-fg-muted" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-fg">{t('pages.classSettings')}</h3>
              <p className="text-xs text-fg-muted">{t('pages.configureClassTagAndSubjects')}</p>
            </div>
          </div>
        </div>
        <div className="card__body space-y-6">
          {/* Class Tag Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-fg-muted" />
              <label className="text-sm font-medium text-fg">
                Class Tag
              </label>
            </div>
            <div className="relative">
              <input
                type="text"
                className={`input w-full pr-8 ${errors.classTag ? 'border-danger' : ''}`}
                placeholder={t('pages.enterACustomTagForThisClassEGScienceStreamMorningBatch')}
                value={classTag}
                onChange={(e) => setClassTag(e.target.value)}
                aria-invalid={!!errors.classTag}
              />
              {classTag && (
                <button
                  type="button"
                  className="iconbtn absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setClassTag("")}
                  aria-label="Clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {errors.classTag && (
              <p className="text-xs text-danger">{errors.classTag}</p>
            )}
            {classTag && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-fg-muted">{t('pages.preview2')}</span>
                <Chip size="sm" color="primary">
                  {classTag}
                </Chip>
              </div>
            )}
          </div>

          <div className="divider" />

          {/* Subjects Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-fg-muted" />
              <label className="text-sm font-medium text-fg">
                Assigned Subjects
              </label>
            </div>
            <MultiSelect
              label={t('pages.selectSubjectsForThisClass')}
              placeholder={t('pages.chooseSubjects')}
              options={subjectOptions}
              value={selectedSubjects}
              onChange={handleSubjectSelection}
              disabled={!canEdit}
            />
            {errors.subjects && (
              <p className="text-xs text-danger">{errors.subjects}</p>
            )}
            
            {selectedSubjects.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedSubjects.map((subject) => (
                  <Chip
                    key={subject}
                    size="sm"
                    color="neutral"
                    onRemove={canEdit ? () => {
                      setSelectedSubjects(prev => prev.filter(s => s !== subject));
                    } : undefined}
                  >
                    {subject}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          <div className="divider" />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                if (!isDirty) {
                  loadClassSettings();
                } else {
                  showConfirm({
                    title: t('pages.discardChanges', 'Discard Changes'),
                    message: t('confirm.discardChanges'),
                    variant: 'warning',
                    confirmText: t('pages.discard', 'Discard'),
                    onConfirm: () => {
                      loadClassSettings();
                    },
                  });
                }
              }}
              disabled={saving || !canEdit || !isDirty}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn--accent"
              onClick={handleSaveAll}
              disabled={saving || !canEdit}
            >
              <Save size={16} /> Save Settings
            </button>
          </div>
          
          {!canEdit && (
            <div className="bg-warn-bg border border-warn rounded-lg p-3 flex items-center gap-2">
              <span className="text-sm text-warn">
                You don't have permission to edit class settings. Contact an administrator for access.
              </span>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
      <UnsavedChangesModal isOpen={isBlocked} onDiscard={proceed} onCancel={reset} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card interactive">
          <div className="card__body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-fg">{t('pages.classTag')}</p>
                <p className="text-xs text-fg-muted mt-1">
                  {classTag || "No tag set"}
                </p>
              </div>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={handleTagUpdate}
                disabled={saving || !classTag || !!errors.classTag || !canEdit}
              >
                Update Tag
              </button>
            </div>
          </div>
        </div>

        <div className="card interactive">
          <div className="card__body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-fg">{t('pages.subjects1')}</p>
                <p className="text-xs text-fg-muted mt-1">
                  {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={handleSaveSubjects}
                disabled={saving || selectedSubjects.length === 0 || !!errors.subjects || !canEdit}
              >
                Update Subjects
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
