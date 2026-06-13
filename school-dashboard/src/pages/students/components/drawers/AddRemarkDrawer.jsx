import { useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  Input, Select, Textarea, Checkbox, Chip, Button
} from "../../../../components/ui";
import { MessageSquare, Mail, Plus, X } from "lucide-react";
import { request } from "../../../../services/api";
import toast from "react-hot-toast";
import logger from '../../../../utils/logger';


export default function AddRemarkDrawer({
  isOpen,
  onOpenChange,
  studentId,
  student,
  remarks,
  onRemarksChange,
}) {
  const { t } = useTranslation();
  const [remarkForm, setRemarkForm] = useState({
    type: "",
    customType: "",
    title: "",
    description: "",
    sendToParent: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setRemarkForm({ type: "", customType: "", title: "", description: "", sendToParent: false });
    setErrors({});
  };

  const handleSaveRemark = async (onClose) => {
    const e = {};
    if (!remarkForm.title.trim()) e.title = t('students.profile.remarks.enterTitle', 'Please enter a title');
    if (!remarkForm.type && !remarkForm.customType.trim()) e.type = t('students.profile.remarks.enterType', 'Please select or enter a remark type');
    if (!remarkForm.description.trim()) e.description = t('students.profile.remarks.enterDescription', 'Please enter a description');
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setIsSubmitting(true);
    try {
      const remarkData = {
        title: remarkForm.title.trim(),
        description: remarkForm.description.trim(),
        category: remarkForm.customType.trim() || remarkForm.type,
        sentToParent: remarkForm.sendToParent
      };

      const savedRemark = await request(`/students/${studentId}/remarks`, {
        method: 'POST',
        body: JSON.stringify(remarkData)
      });

      onRemarksChange([savedRemark, ...remarks]);

      if (remarkForm.sendToParent) {
        toast.success(t('students.profile.remarks.addedAndSent', 'Remark added and sent to {{name}}', { name: student.parentName || 'parent' }));
      } else {
        toast.success(t('students.profile.remarks.addedSuccessfully', 'Remark added successfully'));
      }

      resetForm();
      onClose();
    } catch (error) {
      logger.error("Error saving remark:", error);
      toast.error(error.message || t('students.profile.remarks.saveFailed', 'Failed to save remark'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const remarkTypeOptions = [
    { value: "academic", label: t('students.profile.remarks.categories.academic', 'Academic') },
    { value: "behavioral", label: t('students.profile.remarks.categories.behavioral', 'Behavioral') },
    { value: "achievement", label: t('students.profile.remarks.categories.achievement', 'Achievement') },
    { value: "attendance", label: t('students.profile.remarks.categories.attendance', 'Attendance') },
    { value: "health", label: t('students.profile.remarks.categories.health', 'Health') },
    { value: "general", label: t('students.profile.remarks.categories.general', 'General') },
    { value: "custom", label: t('students.profile.overview.customType', 'Custom Type...') },
  ];

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
              <div className="p-2 bg-blue-50 rounded-xl">
                <MessageSquare size={20} className="text-accent" aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('students.profile.remarks.drawerTitle', 'Add Remark')}</h3>
                <p className="text-xs text-fg-muted">{t('students.profile.remarks.drawerSubtitle', 'Add a note or observation about the student')}</p>
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
          <div className="ds-drawer__body space-y-6">
            {/* Remark Type - Dropdown with Custom Option */}
            <div className="space-y-2">
              <Select
                aria-label={t('students.profile.remarks.remarkType', 'Remark type')}
                label={t('students.profile.remarks.remarkType', 'Remark Type')}
                placeholder={t('students.profile.remarks.selectType', 'Select type or enter custom')}
                error={errors.type}
                value={remarkForm.type}
                onChange={(e) => {
                  setRemarkForm({ ...remarkForm, type: e.target.value, customType: "" });
                  setErrors(prev => ({ ...prev, type: undefined }));
                }}
                options={remarkTypeOptions}
              />

              {remarkForm.type === "custom" && (
                <Input
                  label={t('students.profile.overview.customTypeLabel', 'Custom Type')}
                  placeholder={t('students.profile.overview.enterCustomType', 'Enter custom remark type')}
                  value={remarkForm.customType}
                  onChange={(e) => setRemarkForm({ ...remarkForm, customType: e.target.value })}
                  maxLength={30}
                  description={`${remarkForm.customType.length}/30 characters`}
                />
              )}
            </div>

            {/* Title with Character Limit */}
            <Input
              label={t('students.profile.remarks.titleLabel', 'Title')}
              placeholder={t('students.profile.remarks.titlePlaceholder', 'e.g. Excellent Performance in Mathematics')}
              value={remarkForm.title}
              onChange={(e) => {
                setRemarkForm({ ...remarkForm, title: e.target.value });
                setErrors(prev => ({ ...prev, title: undefined }));
              }}
              maxLength={100}
              description={`${remarkForm.title.length}/100 characters`}
              required
              error={errors.title}
            />

            {/* Description */}
            <Textarea
              label={t('students.profile.remarks.descriptionLabel', 'Description')}
              placeholder={t('students.profile.remarks.descriptionPlaceholder', 'Enter detailed remark or observation...')}
              rows={5}
              value={remarkForm.description}
              onChange={(e) => {
                setRemarkForm({ ...remarkForm, description: e.target.value });
                setErrors(prev => ({ ...prev, description: undefined }));
              }}
              maxLength={500}
              description={`${remarkForm.description.length}/500 characters`}
              required
              error={errors.description}
            />

            {/* Send to Parent */}
            <div className="p-4 rounded-lg border border-divider bg-surface-2">
              <Checkbox
                size="sm"
                checked={remarkForm.sendToParent}
                onChange={(e) => setRemarkForm({ ...remarkForm, sendToParent: e.target.checked })}
                label={
                  <div className="flex flex-col">
                    <span className="font-medium text-fg">{t('students.profile.remarks.sendToParent', 'Send to Parent')}</span>
                    <span className="text-xs text-fg-muted">
                      {remarkForm.sendToParent
                        ? t('students.profile.remarks.visibleToParents', 'Remark will be visible to parents')
                        : t('students.profile.remarks.visibleToStaffOnly', 'Remark will only be visible to staff')
                      }
                    </span>
                  </div>
                }
              />
            </div>

            {/* Preview */}
            {(remarkForm.title || remarkForm.description) && (
              <div className="p-4 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent-bg)]/30">
                <p className="text-xs font-semibold text-[var(--accent)] uppercase mb-2">{t('students.profile.remarks.preview', 'Preview')}</p>
                {remarkForm.title && (
                  <h4 className="font-semibold text-fg mb-1">{remarkForm.title}</h4>
                )}
                {remarkForm.description && (
                  <p className="text-sm text-fg-muted">{remarkForm.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Chip size="sm" color="primary" className="capitalize">
                    {remarkForm.customType || remarkForm.type || t('students.profile.remarks.noType', 'No Type')}
                  </Chip>
                  {remarkForm.sendToParent && (
                    <Chip size="sm" color="success" startContent={<Mail size={12} aria-hidden />}>
                      {t('students.profile.remarks.willSend', 'Will Send')}
                    </Chip>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="ds-drawer__foot">
            <Button
              variant="ghost"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSaveRemark(onClose)}
              icon={<Plus size={16} aria-hidden />}
              disabled={!remarkForm.title.trim() || !remarkForm.description.trim() || (!remarkForm.type && !remarkForm.customType.trim()) || isSubmitting}
              loading={isSubmitting}
            >
              {remarkForm.sendToParent ? t('students.profile.remarks.saveAndSend', 'Save & Send') : t('students.profile.remarks.saveRemark', 'Save Remark')}
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}
