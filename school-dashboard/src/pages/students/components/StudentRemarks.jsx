import { request } from '../../../services/api.js';
import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, Select, SelectItem, Input, Textarea, Checkbox, Dropdown, DropdownMenu, DropdownTrigger, DropdownItem, Tooltip } from "@heroui/react";
import { MessageSquare, AlertCircle, Award, CalendarCheck, Heart, Mail, Plus, Edit, Trash2, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";
import { getDateLocale } from '../../../i18n/index';
import { useTranslation } from 'react-i18next';


export default function StudentRemarks({
  studentId,
  student,
  remarks,
  remarksLoading,
  remarksCategoryFilter,
  onRemarksChange,
  onCategoryFilterChange
}) {
  const { t } = useTranslation();
  const [isRemarkOpen, setIsRemarkOpen] = useState(false);
  const [remarkForm, setRemarkForm] = useState({
    type: "",
    customType: "",
    title: "",
    description: "",
    sendToParent: false
  });

  const handleSaveRemark = async () => {
    // Validate form
    if (!remarkForm.title.trim()) {
      toast.error(t('toast.error.pleaseEnterATitle'));
      return;
    }
    if (!remarkForm.type && !remarkForm.customType.trim()) {
      toast.error(t('toast.error.pleaseSelectOrEnterARemarkType'));
      return;
    }
    if (!remarkForm.description.trim()) {
      toast.error(t('toast.error.pleaseEnterADescription'));
      return;
    }

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
        toast.success(`Remark added and sent to ${student.parentName || 'parent'}`);
      } else {
        toast.success(t('toast.success.remarkAddedSuccessfully'));
      }

      setRemarkForm({
        type: "",
        customType: "",
        title: "",
        description: "",
        sendToParent: false
      });
      setIsRemarkOpen(false);
    } catch (error) {
      console.error("Error saving remark:", error);
      toast.error(error.message || "Failed to save remark");
    }
  };

  const getCategoryColor = (category) => {
    // All categories now use gray styling
    return 'default';
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'academic': return MessageSquare;
      case 'behavioral': return AlertCircle;
      case 'achievement': return Award;
      case 'attendance': return CalendarCheck;
      case 'health': return Heart;
      default: return MessageSquare;
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg dark:bg-zinc-800 dark:text-zinc-400">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{t('pages.studentRemarks')}</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.notesAndObservationsAboutTheStudent')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              size="sm"
              placeholder={t('pages.filterByCategory')}
              className="w-full sm:w-48"
              variant="bordered"
              selectedKeys={remarksCategoryFilter === 'all' ? [] : [remarksCategoryFilter]}
              onSelectionChange={(keys) => onCategoryFilterChange(Array.from(keys)[0] || 'all')}
            >
              <SelectItem key="all">{t('pages.allCategories')}</SelectItem>
              <SelectItem key="academic">{t('pages.academic1')}</SelectItem>
              <SelectItem key="behavioral">{t('pages.behavioral1')}</SelectItem>
              <SelectItem key="achievement">{t('pages.achievement1')}</SelectItem>
              <SelectItem key="attendance">{t('pages.attendance2')}</SelectItem>
              <SelectItem key="health">{t('pages.health1')}</SelectItem>
              <SelectItem key="general">{t('pages.general1')}</SelectItem>
            </Select>
            <Button size="sm" color="primary" variant="flat" startContent={<Plus size={16} />} onPress={() => setIsRemarkOpen(true)}>{t('pages.addRemark')}</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {remarksLoading ? (
            <div className="text-center py-12">
              <p className="text-default-500">{t('pages.loadingRemarks')}</p>
            </div>
          ) : remarks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg dark:border-zinc-700">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-3 dark:text-zinc-600" />
              <h4 className="font-semibold text-gray-700 mb-1 dark:text-zinc-300">{t('pages.noRemarksYet')}</h4>
              <p className="text-sm text-gray-500 mb-4 dark:text-zinc-400">{t('pages.addYourFirstRemarkOrObservationAboutThisStudent')}</p>
              <Button color="primary" variant="flat" startContent={<Plus size={16} />} onPress={() => setIsRemarkOpen(true)}>
                Add First Remark
              </Button>
            </div>
          ) : (
            remarks.map((remark) => {
              const CategoryIcon = getCategoryIcon(remark.category);

              return (
                <div key={remark._id} className="group flex flex-col sm:flex-row gap-4 p-5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 dark:bg-zinc-800 dark:text-zinc-400`}>
                      <CategoryIcon size={20} />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1 dark:text-zinc-100">{remark.title}</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <Chip size="sm" variant="flat" className="bg-gray-100 text-gray-600 capitalize dark:bg-zinc-800 dark:text-zinc-400">{remark.category}</Chip>
                          {remark.sentToParent ? (
                            <Chip size="sm" variant="flat" className="bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400" startContent={<Mail size={12} />}>{t('pages.sentToParent')}</Chip>
                          ) : (
                            <Chip size="sm" variant="flat" className="bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">{t('pages.staffOnly')}</Chip>
                          )}
                          <span className="text-xs text-gray-400 dark:text-zinc-500">
                            • {remark.authorName || 'System'} • {new Date(remark.date).toLocaleDateString(getDateLocale(), { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label={t('aria.menus.remarkActions')}>
                          <DropdownItem key="edit" startContent={<Edit size={14} />}>{t('pages.edit1')}</DropdownItem>
                          <DropdownItem key="resend" startContent={<Mail size={14} />}>{t('pages.resendToParent')}</DropdownItem>
                          <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 size={14} />}>{t('pages.delete1')}</DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed dark:text-zinc-400">
                      {remark.description}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Remark Drawer */}
      <Drawer
        isOpen={isRemarkOpen}
        onOpenChange={setIsRemarkOpen}
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
              <DrawerHeader className="border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg dark:bg-zinc-800">
                    <MessageSquare size={20} className="text-gray-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{t('pages.addRemark')}</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.addANoteOrObservationAboutTheStudent')}</p>
                  </div>
                </div>
              </DrawerHeader>
              <DrawerBody className="p-6 space-y-6">
                {/* Remark Type - Dropdown with Custom Option */}
                <div className="space-y-2">
                  <Select
                    label={t('pages.remarkType1')}
                    placeholder={t('pages.selectTypeOrEnterCustom')}
                    variant="bordered"
                    selectedKeys={remarkForm.type ? [remarkForm.type] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0];
                      setRemarkForm({ ...remarkForm, type: selected, customType: "" });
                    }}
                  >
                    <SelectItem key="academic">{t('pages.academic1')}</SelectItem>
                    <SelectItem key="behavioral">{t('pages.behavioral1')}</SelectItem>
                    <SelectItem key="achievement">{t('pages.achievement1')}</SelectItem>
                    <SelectItem key="attendance">{t('pages.attendance2')}</SelectItem>
                    <SelectItem key="health">{t('pages.health1')}</SelectItem>
                    <SelectItem key="general">{t('pages.general1')}</SelectItem>
                    <SelectItem key="custom">{t('pages.customType1')}</SelectItem>
                  </Select>

                  {/* Show custom type input when "custom" is selected */}
                  {remarkForm.type === "custom" && (
                    <Input
                      label={t('pages.customType2')}
                      placeholder={t('pages.enterCustomRemarkType')}
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
                  label={t('pages.title1')}
                  placeholder="e.g. Excellent Performance in Mathematics"
                  variant="bordered"
                  value={remarkForm.title}
                  onChange={(e) => setRemarkForm({ ...remarkForm, title: e.target.value })}
                  maxLength={100}
                  description={`${remarkForm.title.length}/100 characters`}
                  isRequired
                />

                {/* Description */}
                <Textarea
                  label={t('pages.description1')}
                  placeholder={t('pages.enterDetailedRemarkOrObservation')}
                  minRows={5}
                  variant="bordered"
                  value={remarkForm.description}
                  onChange={(e) => setRemarkForm({ ...remarkForm, description: e.target.value })}
                  maxLength={500}
                  description={`${remarkForm.description.length}/500 characters`}
                  isRequired
                />

                {/* Send to Parent */}
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800">
                  <Checkbox size="sm"
                    isSelected={remarkForm.sendToParent}
                    onValueChange={(checked) => setRemarkForm({ ...remarkForm, sendToParent: checked })}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-zinc-100">{t('pages.sendToParent1')}</span>
                      <span className="text-xs text-gray-500 dark:text-zinc-400">
                        {remarkForm.sendToParent
                          ? `Will be sent to ${student.parentEmail || student.parentPhone || 'parent'}`
                          : 'Remark will only be visible to staff'
                        }
                      </span>
                    </div>
                  </Checkbox>
                </div>

                {/* Preview */}
                {(remarkForm.title || remarkForm.description) && (
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-2 dark:text-zinc-400">{t('pages.preview1')}</p>
                    {remarkForm.title && (
                      <h4 className="font-semibold text-gray-900 mb-1 dark:text-zinc-100">{remarkForm.title}</h4>
                    )}
                    {remarkForm.description && (
                      <p className="text-sm text-gray-600 dark:text-zinc-400">{remarkForm.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Chip size="sm" variant="flat" className="bg-gray-100 text-gray-600 capitalize dark:bg-zinc-800 dark:text-zinc-400">
                        {remarkForm.customType || remarkForm.type || "No Type"}
                      </Chip>
                      {remarkForm.sendToParent && (
                        <Chip size="sm" variant="flat" className="bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400" startContent={<Mail size={12} />}>
                          Will Send
                        </Chip>
                      )}
                    </div>
                  </div>
                )}
              </DrawerBody>
              <DrawerFooter className="border-t border-gray-100 dark:border-zinc-800">
                <Button
                  variant="flat"
                  onPress={() => {
                    setRemarkForm({
                      type: "",
                      customType: "",
                      title: "",
                      description: "",
                      sendToParent: false
                    });
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleSaveRemark}
                  startContent={<Plus size={16} />}
                  isDisabled={!remarkForm.title.trim() || !remarkForm.description.trim() || (!remarkForm.type && !remarkForm.customType.trim())}
                >
                  {remarkForm.sendToParent ? "Save & Send" : "Save Remark"}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
