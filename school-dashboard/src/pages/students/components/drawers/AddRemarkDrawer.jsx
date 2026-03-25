import { useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  Input, Select, SelectItem, Textarea, Checkbox, Chip, Button
} from "@heroui/react";
import { MessageSquare, Mail, Plus } from "lucide-react";
import { request } from "../../../../services/apiClient";
import toast from "react-hot-toast";

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

  const resetForm = () => {
    setRemarkForm({ type: "", customType: "", title: "", description: "", sendToParent: false });
    setErrors({});
  };

  const handleSaveRemark = async () => {
    const e = {};
    if (!remarkForm.title.trim()) e.title = t('students.profile.remarks.enterTitle', 'Please enter a title');
    if (!remarkForm.type && !remarkForm.customType.trim()) e.type = t('students.profile.remarks.enterType', 'Please select or enter a remark type');
    if (!remarkForm.description.trim()) e.description = t('students.profile.remarks.enterDescription', 'Please enter a description');
    if (Object.keys(e).length > 0) { setErrors(e); return; }

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
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving remark:", error);
      toast.error(error.message || t('students.profile.remarks.saveFailed', 'Failed to save remark'));
    }
  };

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
                <div className="p-2 bg-blue-50 rounded-xl">
                  <MessageSquare size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{t('students.profile.remarks.drawerTitle', 'Add Remark')}</h3>
                  <p className="text-xs text-default-500">{t('students.profile.remarks.drawerSubtitle', 'Add a note or observation about the student')}</p>
                </div>
              </div>
            </DrawerHeader>
            <DrawerBody className="p-6 space-y-6">
              {/* Remark Type - Dropdown with Custom Option */}
              <div className="space-y-2">
                <Select
                  aria-label={t('students.profile.remarks.remarkType', 'Remark type')}
                  label={t('students.profile.remarks.remarkType', 'Remark Type')}
                  placeholder={t('students.profile.remarks.selectType', 'Select type or enter custom')}
                  variant="bordered"
                  isInvalid={!!errors.type}
                  errorMessage={errors.type}
                  selectedKeys={remarkForm.type ? [remarkForm.type] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    setRemarkForm({ ...remarkForm, type: selected, customType: "" });
                    setErrors(prev => ({ ...prev, type: undefined }));
                  }}
                >
                  <SelectItem key="academic">{t('students.profile.remarks.categories.academic', 'Academic')}</SelectItem>
                  <SelectItem key="behavioral">{t('students.profile.remarks.categories.behavioral', 'Behavioral')}</SelectItem>
                  <SelectItem key="achievement">{t('students.profile.remarks.categories.achievement', 'Achievement')}</SelectItem>
                  <SelectItem key="attendance">{t('students.profile.remarks.categories.attendance', 'Attendance')}</SelectItem>
                  <SelectItem key="health">{t('students.profile.remarks.categories.health', 'Health')}</SelectItem>
                  <SelectItem key="general">{t('students.profile.remarks.categories.general', 'General')}</SelectItem>
                  <SelectItem key="custom">{t('students.profile.overview.customType', 'Custom Type...')}</SelectItem>
                </Select>

                {remarkForm.type === "custom" && (
                  <Input
                    label={t('students.profile.overview.customTypeLabel', 'Custom Type')}
                    placeholder={t('students.profile.overview.enterCustomType', 'Enter custom remark type')}
                    variant="bordered"
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
                variant="bordered"
                value={remarkForm.title}
                onChange={(e) => {
                  setRemarkForm({ ...remarkForm, title: e.target.value });
                  setErrors(prev => ({ ...prev, title: undefined }));
                }}
                maxLength={100}
                description={`${remarkForm.title.length}/100 characters`}
                isRequired
                isInvalid={!!errors.title}
                errorMessage={errors.title}
              />

              {/* Description */}
              <Textarea
                label={t('students.profile.remarks.descriptionLabel', 'Description')}
                placeholder={t('students.profile.remarks.descriptionPlaceholder', 'Enter detailed remark or observation...')}
                minRows={5}
                variant="bordered"
                value={remarkForm.description}
                onChange={(e) => {
                  setRemarkForm({ ...remarkForm, description: e.target.value });
                  setErrors(prev => ({ ...prev, description: undefined }));
                }}
                maxLength={500}
                description={`${remarkForm.description.length}/500 characters`}
                isRequired
                isInvalid={!!errors.description}
                errorMessage={errors.description}
              />

              {/* Send to Parent */}
              <div className="p-4 rounded-lg border border-default-200 bg-default-50">
                <Checkbox size="sm"
                  isSelected={remarkForm.sendToParent}
                  onValueChange={(checked) => setRemarkForm({ ...remarkForm, sendToParent: checked })}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-default-900">{t('students.profile.remarks.sendToParent', 'Send to Parent')}</span>
                    <span className="text-xs text-default-500">
                      {remarkForm.sendToParent
                        ? t('students.profile.remarks.willBeSentTo', 'Will be sent to {{contact}}', { contact: student?.parentEmail || student?.parentPhone || 'parent' })
                        : t('students.profile.remarks.visibleToStaffOnly', 'Remark will only be visible to staff')
                      }
                    </span>
                  </div>
                </Checkbox>
              </div>

              {/* Preview */}
              {(remarkForm.title || remarkForm.description) && (
                <div className="p-4 rounded-lg border border-primary-200 bg-primary-50/30">
                  <p className="text-xs font-semibold text-primary-600 uppercase mb-2">{t('students.profile.remarks.preview', 'Preview')}</p>
                  {remarkForm.title && (
                    <h4 className="font-semibold text-default-900 mb-1">{remarkForm.title}</h4>
                  )}
                  {remarkForm.description && (
                    <p className="text-sm text-default-600">{remarkForm.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Chip size="sm" variant="flat" color="primary" className="capitalize">
                      {remarkForm.customType || remarkForm.type || t('students.profile.remarks.noType', 'No Type')}
                    </Chip>
                    {remarkForm.sendToParent && (
                      <Chip size="sm" variant="flat" color="success" startContent={<Mail size={12} />}>
                        {t('students.profile.remarks.willSend', 'Will Send')}
                      </Chip>
                    )}
                  </div>
                </div>
              )}
            </DrawerBody>
            <DrawerFooter className="border-t border-default-100">
              <Button
                variant="flat"
                onPress={() => {
                  resetForm();
                  onClose();
                }}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                color="primary"
                onPress={handleSaveRemark}
                startContent={<Plus size={16} />}
                isDisabled={!remarkForm.title.trim() || !remarkForm.description.trim() || (!remarkForm.type && !remarkForm.customType.trim())}
              >
                {remarkForm.sendToParent ? t('students.profile.remarks.saveAndSend', 'Save & Send') : t('students.profile.remarks.saveRemark', 'Save Remark')}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
