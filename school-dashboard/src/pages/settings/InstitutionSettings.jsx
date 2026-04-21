import { useState, useEffect } from "react";
import { Button, Input, Chip, Select, SelectItem, Divider } from "@heroui/react";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { Save, Building2, FileText, Edit2, Upload, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { BOARDS_OF_EDUCATION } from "../../utils/constants";
import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesModal from '../../components/modals/UnsavedChangesModal';
import { useSettingsDirty } from '../../context/SettingsNavigationContext';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';


export default function InstitutionSettings() {
  const { t } = useTranslation();
  const { schoolSettings, updateSchoolSettings, loading } = useApp();
  const [localSettings, setLocalSettings] = useState(schoolSettings);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { isBlocked, proceed, reset } = useUnsavedChanges(isDirty);

  // Register dirty state with the settings sidebar so navigating away shows a warning
  const { setDirty } = useSettingsDirty();
  useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);

  const updateLocalSettings = (updater) => {
    setLocalSettings(updater);
    setIsDirty(true);
  };

  useEffect(() => {
    if (schoolSettings && !localSettings) {
      setLocalSettings(schoolSettings);
    }
  }, [schoolSettings]);
  const [editingSection, setEditingSection] = useState(null); // 'identity', 'branding', or null

  // AUDIT-125: Added toast feedback for success/error
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSchoolSettings(localSettings);
      setIsDirty(false);
      setEditingSection(null);
      toast.success('Settings saved successfully');
    } catch (error) {
      logger.error('Failed to save settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalSettings(schoolSettings);
    setIsDirty(false);
    setEditingSection(null);
  };

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  const handleFileUpload = (field, event) => {
    const file = event.target.files[0];
    if (file) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(t('toast.error.invalidFileType', 'Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed'));
        event.target.value = null;
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(t('toast.error.fileTooLarge', 'File size must be less than 5MB'));
        event.target.value = null;
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateLocalSettings((prev) => ({ ...prev, [field]: reader.result }));
        reader.onloadend = null;
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <TablePageSkeleton />
    );
  }

  const DataField = ({ label, value }) => (
    <div className="space-y-1">
      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{label}</span>
      <p className="font-medium text-default-900">{value || "—"}</p>
    </div>
  );

  return (
    <>
    <div className="max-w-4xl mx-auto pb-10 space-y-8">
      {/* Unified Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-default-900">{t('pages.institutionProfile')}</h2>
          <p className="text-sm text-default-500 mt-1">{t('pages.manageYourInstitutionSCoreIdentityAndBrandingDetails')}</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Section 1: Identity & Contact */}
        <div className={`rounded-xl border transition-all duration-300 ${editingSection === 'identity' ? 'border-primary ring-1 ring-primary bg-white dark:bg-zinc-950' : 'border-default-200 bg-white dark:bg-zinc-950 hover:border-default-300'}`}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${editingSection === 'identity' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-default-900">{t('pages.identityContact')}</h3>
                  <p className="text-xs text-default-500">{t('pages.basicDetailsAboutYourSchool')}</p>
                </div>
              </div>
              {editingSection === 'identity' ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="light" color="danger" onPress={handleCancel} isDisabled={saving}>{t('pages.cancel2')}</Button>
                  <Button size="sm" color="primary" onPress={handleSave} isLoading={saving} startContent={<Save size={14} />}>
                    Save Changes
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="light" color="primary" startContent={<Edit2 size={16} />} onPress={() => setEditingSection('identity')} isDisabled={editingSection !== null}>
                  Edit Details
                </Button>
              )}
            </div>

            {editingSection === 'identity' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 animate-fade-in">
                <div className="md:col-span-2 lg:col-span-1">
                  <Input
                    label={t('pages.institutionName')}
                    value={localSettings.name}
                    onValueChange={(v) => updateLocalSettings(prev => ({ ...prev, name: v }))}
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{ inputWrapper: "bg-white dark:bg-zinc-950 border-default-200" }}
                  />
                </div>
                <Input
                  label={t('pages.uDISENo')}
                  value={localSettings.udiseNo}
                  onValueChange={(v) => updateLocalSettings({ ...localSettings, udiseNo: v })}
                  variant="bordered"
                  labelPlacement="outside"
                  classNames={{ inputWrapper: "bg-white dark:bg-zinc-950 border-default-200" }}
                />
                <Input
                  label={t('pages.affiliationNo')}
                  value={localSettings.affiliationNo}
                  onValueChange={(v) => updateLocalSettings({ ...localSettings, affiliationNo: v })}
                  variant="bordered"
                  labelPlacement="outside"
                  classNames={{ inputWrapper: "bg-white dark:bg-zinc-950 border-default-200" }}
                />
                <Select
                  label={t('pages.boardOfEducation')}
                  selectedKeys={localSettings.boardOfEducation ? [localSettings.boardOfEducation] : []}
                  onChange={(e) => updateLocalSettings({ ...localSettings, boardOfEducation: e.target.value })}
                  variant="bordered"
                  labelPlacement="outside"
                  classNames={{ trigger: "bg-white dark:bg-zinc-950 border-default-200" }}
                >
                  {BOARDS_OF_EDUCATION.map(board => (
                    <SelectItem key={board} value={board}>{board}</SelectItem>
                  ))}
                </Select>
                <Input
                  label={t('pages.emailAddress')}
                  value={localSettings.email}
                  onValueChange={(v) => updateLocalSettings({ ...localSettings, email: v })}
                  variant="bordered"
                  labelPlacement="outside"
                  classNames={{ inputWrapper: "bg-white dark:bg-zinc-950 border-default-200" }}
                />
                <Input
                  label={t('pages.phoneNumber')}
                  value={localSettings.phone}
                  onValueChange={(v) => updateLocalSettings({ ...localSettings, phone: v })}
                  variant="bordered"
                  labelPlacement="outside"
                  classNames={{ inputWrapper: "bg-white dark:bg-zinc-950 border-default-200" }}
                />
                <div className="md:col-span-2 lg:col-span-3">
                  <Input
                    label={t('pages.address2')}
                    value={localSettings.address}
                    onValueChange={(v) => updateLocalSettings({ ...localSettings, address: v })}
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{ inputWrapper: "bg-white dark:bg-zinc-950 border-default-200" }}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                <DataField label={t('pages.institutionName')} value={localSettings.name} />
                <DataField label={t('pages.uDISENo')} value={localSettings.udiseNo} />
                <DataField label={t('pages.affiliationNo')} value={localSettings.affiliationNo} />
                <DataField label={t('pages.board')} value={localSettings.boardOfEducation} />
                <DataField label={t('pages.email1')} value={localSettings.email} />
                <DataField label={t('pages.phone1')} value={localSettings.phone} />
                <div className="md:col-span-2 lg:col-span-3">
                  <DataField label={t('pages.address2')} value={localSettings.address} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Branding */}
        <div className={`rounded-xl border transition-all duration-300 ${editingSection === 'branding' ? 'border-primary ring-1 ring-primary bg-white dark:bg-zinc-950' : 'border-default-200 bg-white dark:bg-zinc-950 hover:border-default-300'}`}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${editingSection === 'branding' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-default-900">{t('pages.officialBranding')}</h3>
                  <p className="text-xs text-default-500">{t('pages.logosAndSignaturesForOfficialDocuments')}</p>
                </div>
              </div>
              {editingSection === 'branding' ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="light" color="danger" onPress={handleCancel} isDisabled={saving}>{t('pages.cancel2')}</Button>
                  <Button size="sm" color="primary" onPress={handleSave} isLoading={saving} startContent={<Save size={14} />}>
                    Save Changes
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="light" color="primary" startContent={<Edit2 size={16} />} onPress={() => setEditingSection('branding')} isDisabled={editingSection !== null}>
                  Edit Details
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Logo */}
              <div className="p-6 border border-default-200 rounded-xl bg-default-50 flex flex-col items-center text-center gap-4 group hover:border-primary/30 transition-colors">
                <div className="w-32 h-32 rounded-full bg-white dark:bg-zinc-950 border border-default-200 flex items-center justify-center overflow-hidden relative shadow-sm">
                  {localSettings.logo ? (
                    <img src={localSettings.logo} alt="Logo" className="w-full h-full object-contain p-4" loading="lazy" decoding="async" />
                  ) : (
                    <Building2 size={32} className="text-default-300" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-default-900">{t('pages.institutionLogo')}</h4>
                  {editingSection === 'branding' && <p className="text-xs text-default-500 mt-1">{t('pages.recommended200x200pxPng')}</p>}
                </div>
                {editingSection === 'branding' && (
                  <>
                    <Button size="sm" color="primary" variant="flat" onPress={() => document.getElementById('logo-upload').click()} startContent={<Upload size={14} />}>{t('pages.uploadNew')}</Button>
                    <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('logo', e)} />
                  </>
                )}
              </div>

              {/* Principal Sig */}
              <div className="p-6 border border-default-200 rounded-xl bg-default-50 flex flex-col items-center text-center gap-4 group hover:border-primary/30 transition-colors">
                <div className="w-40 h-24 rounded-lg bg-white dark:bg-zinc-950 border border-default-200 flex items-center justify-center overflow-hidden relative shadow-sm">
                  {localSettings.principalSignature ? (
                    <img src={localSettings.principalSignature} alt="Principal Signature" className="w-full h-full object-contain p-2" loading="lazy" decoding="async" />
                  ) : (
                    <span className="text-xs text-default-400 italic">{t('pages.noSignature')}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-default-900">{t('pages.principalSignature')}</h4>
                  {editingSection === 'branding' && <p className="text-xs text-default-500 mt-1">{t('pages.forOfficialDocuments')}</p>}
                </div>
                {editingSection === 'branding' && (
                  <>
                    <Button size="sm" color="primary" variant="flat" onPress={() => document.getElementById('principal-sig-upload').click()} startContent={<Upload size={14} />}>{t('pages.uploadNew')}</Button>
                    <input id="principal-sig-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('principalSignature', e)} />
                  </>
                )}
              </div>

              {/* Correspondent Sig */}
              <div className="p-6 border border-default-200 rounded-xl bg-default-50 flex flex-col items-center text-center gap-4 group hover:border-primary/30 transition-colors">
                <div className="w-40 h-24 rounded-lg bg-white dark:bg-zinc-950 border border-default-200 flex items-center justify-center overflow-hidden relative shadow-sm">
                  {localSettings.correspondentSignature ? (
                    <img src={localSettings.correspondentSignature} alt="Correspondent Signature" className="w-full h-full object-contain p-2" loading="lazy" decoding="async" />
                  ) : (
                    <span className="text-xs text-default-400 italic">{t('pages.noSignature')}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-default-900">{t('pages.correspondentSignature')}</h4>
                  {editingSection === 'branding' && <p className="text-xs text-default-500 mt-1">{t('pages.forOfficialDocuments')}</p>}
                </div>
                {editingSection === 'branding' && (
                  <>
                    <Button size="sm" color="primary" variant="flat" onPress={() => document.getElementById('correspondent-sig-upload').click()} startContent={<Upload size={14} />}>{t('pages.uploadNew')}</Button>
                    <input id="correspondent-sig-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('correspondentSignature', e)} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UnsavedChangesModal isOpen={isBlocked} onDiscard={proceed} onCancel={reset} />
    </>
  );
}
