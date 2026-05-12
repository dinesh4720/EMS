import { useState, useEffect } from "react";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { Save, Building2, FileText, Edit2, Upload, X } from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  ErrorState,
} from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { BOARDS_OF_EDUCATION } from "../../utils/constants";
import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesModal from '../../components/modals/UnsavedChangesModal';
import { useSettingsDirty } from '../../context/SettingsNavigationContext';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';
import { cn } from '../../utils/cn';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

function DataField({ label, value }) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
        {label}
      </span>
      <p className="font-medium text-fg">{value || "—"}</p>
    </div>
  );
}

function SectionShell({ icon: Icon, title, description, isEditing, anyEditing, onEdit, onCancel, onSave, saving, children }) {
  return (
    <Card
      padding="none"
      radius="lg"
      className={cn(
        "transition-colors",
        isEditing && "ring-1 ring-[var(--color-primary)] border-[var(--color-primary)]"
      )}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-6 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "p-2 rounded-lg shrink-0",
                isEditing ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              )}
            >
              <Icon size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-fg">
                {title}
              </h3>
              <p className="text-xs text-fg-muted">{description}</p>
            </div>
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving} icon={<X size={14} />}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={onSave} loading={saving} icon={<Save size={14} />}>
                Save changes
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              icon={<Edit2 size={14} />}
              onClick={onEdit}
              disabled={anyEditing}
            >
              Edit
            </Button>
          )}
        </div>
        {children}
      </div>
    </Card>
  );
}

function BrandAsset({ label, src, hint, isEditing, fallback, shape = "circle", onUpload }) {
  const inputId = `brand-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="p-6 border border-divider rounded-xl bg-surface-2 flex flex-col items-center text-center gap-4 transition-colors hover:border-[var(--color-primary)]/30">
      <div
        className={cn(
          "bg-surface border border-divider flex items-center justify-center overflow-hidden shadow-sm",
          shape === "circle" ? "w-32 h-32 rounded-full" : "w-40 h-24 rounded-lg"
        )}
      >
        {src ? (
          <img
            src={src}
            alt={label}
            className="w-full h-full object-contain p-3"
            loading="lazy"
            decoding="async"
          />
        ) : (
          fallback
        )}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-fg">{label}</h4>
        {isEditing && hint && (
          <p className="text-xs text-fg-muted mt-1">{hint}</p>
        )}
      </div>
      {isEditing && (
        <>
          <Button
            size="sm"
            variant="secondary"
            icon={<Upload size={14} />}
            onClick={() => document.getElementById(inputId)?.click()}
          >
            Upload new
          </Button>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUpload}
          />
        </>
      )}
    </div>
  );
}

export default function InstitutionSettings() {
  const { t } = useTranslation();
  const { schoolSettings, updateSchoolSettings, loading } = useApp();
  const [localSettings, setLocalSettings] = useState(schoolSettings);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [editingSection, setEditingSection] = useState(null); // 'identity', 'branding', or null

  const { isBlocked, proceed, reset } = useUnsavedChanges(isDirty);

  const { setDirty } = useSettingsDirty();
  useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);

  useEffect(() => {
    if (schoolSettings && !localSettings) {
      setLocalSettings(schoolSettings);
    }
  }, [schoolSettings, localSettings]);

  const updateLocalSettings = (updater) => {
    setLocalSettings(updater);
    setIsDirty(true);
  };

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

  const handleFileUpload = (field, event) => {
    const file = event.target.files[0];
    if (!file) return;
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
  };

  if (loading) {
    return <TablePageSkeleton />;
  }

  if (!localSettings) {
    return (
      <div className="max-w-4xl mx-auto pb-10">
        <ErrorState
          title="Unable to load settings"
          description="We couldn't load your institution settings. Please refresh the page."
        />
      </div>
    );
  }

  const isEditingIdentity = editingSection === 'identity';
  const isEditingBranding = editingSection === 'branding';
  const anyEditing = editingSection !== null;

  return (
    <>
      <div className="max-w-4xl mx-auto pb-10 space-y-6">
        <PageHeader
          title={t('pages.institutionProfile')}
          description={t('pages.manageYourInstitutionSCoreIdentityAndBrandingDetails')}
          bordered={false}
          size="lg"
          className="px-0"
        />

        <div className="space-y-6">
          <SectionShell
            icon={Building2}
            title={t('pages.identityContact')}
            description={t('pages.basicDetailsAboutYourSchool')}
            isEditing={isEditingIdentity}
            anyEditing={anyEditing}
            onEdit={() => setEditingSection('identity')}
            onCancel={handleCancel}
            onSave={handleSave}
            saving={saving}
          >
            {isEditingIdentity ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-6">
                <div className="md:col-span-2 lg:col-span-1">
                  <Input
                    label={t('pages.institutionName')}
                    value={localSettings.name || ''}
                    onChange={(e) => updateLocalSettings((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <Input
                  label={t('pages.uDISENo')}
                  value={localSettings.udiseNo || ''}
                  onChange={(e) => updateLocalSettings((prev) => ({ ...prev, udiseNo: e.target.value }))}
                />
                <Input
                  label={t('pages.affiliationNo')}
                  value={localSettings.affiliationNo || ''}
                  onChange={(e) => updateLocalSettings((prev) => ({ ...prev, affiliationNo: e.target.value }))}
                />
                <Select
                  label={t('pages.boardOfEducation')}
                  value={localSettings.boardOfEducation || ''}
                  placeholder="Select board"
                  onChange={(e) => updateLocalSettings((prev) => ({ ...prev, boardOfEducation: e.target.value }))}
                >
                  {BOARDS_OF_EDUCATION.map((board) => (
                    <option key={board} value={board}>{board}</option>
                  ))}
                </Select>
                <Input
                  label={t('pages.emailAddress')}
                  type="email"
                  value={localSettings.email || ''}
                  onChange={(e) => updateLocalSettings((prev) => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  label={t('pages.phoneNumber')}
                  value={localSettings.phone || ''}
                  onChange={(e) => updateLocalSettings((prev) => ({ ...prev, phone: e.target.value }))}
                />
                <div className="md:col-span-2 lg:col-span-3">
                  <Input
                    label={t('pages.address2')}
                    value={localSettings.address || ''}
                    onChange={(e) => updateLocalSettings((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-6">
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
          </SectionShell>

          <SectionShell
            icon={FileText}
            title={t('pages.officialBranding')}
            description={t('pages.logosAndSignaturesForOfficialDocuments')}
            isEditing={isEditingBranding}
            anyEditing={anyEditing}
            onEdit={() => setEditingSection('branding')}
            onCancel={handleCancel}
            onSave={handleSave}
            saving={saving}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <BrandAsset
                label={t('pages.institutionLogo')}
                src={localSettings.logo}
                hint={t('pages.recommended200x200pxPng')}
                isEditing={isEditingBranding}
                shape="circle"
                fallback={<Building2 size={32} className="text-fg-faint" />}
                onUpload={(e) => handleFileUpload('logo', e)}
              />
              <BrandAsset
                label={t('pages.principalSignature')}
                src={localSettings.principalSignature}
                hint={t('pages.forOfficialDocuments')}
                isEditing={isEditingBranding}
                shape="wide"
                fallback={<span className="text-xs text-fg-faint italic">{t('pages.noSignature')}</span>}
                onUpload={(e) => handleFileUpload('principalSignature', e)}
              />
              <BrandAsset
                label={t('pages.correspondentSignature')}
                src={localSettings.correspondentSignature}
                hint={t('pages.forOfficialDocuments')}
                isEditing={isEditingBranding}
                shape="wide"
                fallback={<span className="text-xs text-fg-faint italic">{t('pages.noSignature')}</span>}
                onUpload={(e) => handleFileUpload('correspondentSignature', e)}
              />
            </div>
          </SectionShell>
        </div>
      </div>

      <UnsavedChangesModal isOpen={isBlocked} onDiscard={proceed} onCancel={reset} />
    </>
  );
}
