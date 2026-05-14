import { useState, useEffect } from "react";
import logger from "../../utils/logger";
import { Card, Button, Input, Select, SelectItem, Switch, Tabs, Tab, Chip, Divider, RadioGroup, Radio } from "@heroui/react";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { Save, Plus, Trash2, Hash, FileText } from "lucide-react";
import { settingsApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

const yearFormatOptions = [
  { value: 'YYYY', label: 'Full Year (2024)' },
  { value: 'YY', label: 'Short Year (24)' },
  { value: 'none', label: 'No Year' }
];

const separatorOptions = [
  { value: '-', label: 'Dash (-)' },
  { value: '/', label: 'Slash (/)' },
  { value: '_', label: 'Underscore (_)' },
  { value: '', label: 'None' }
];

const resetFrequencyOptions = [
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'never', label: 'Never' }
];

const uploadTypeOptions = [
  { value: 'single', label: 'Single File' },
  { value: 'multiple', label: 'Multiple Files' },
  { value: 'front-back', label: 'Front & Back' }
];

export default function AdmissionFormSettings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("admission-id");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Admission ID Config
  const [admissionIdConfig, setAdmissionIdConfig] = useState({
    prefix: 'ADM',
    yearFormat: 'YYYY',
    separator: '-',
    numberPadding: 4,
    startingNumber: 1,
    currentNumber: 0,
    resetFrequency: 'yearly'
  });
  const [previewId, setPreviewId] = useState('');

  // Roll Number Config
  const [rollNumberConfig, setRollNumberConfig] = useState({
    format: 'sequential',
    startingNumber: 1,
    resetPerClass: true
  });

  // Document Config
  const [documentConfigs, setDocumentConfigs] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    loadConfigurations(controller.signal);
    return () => controller.abort();
  }, []);

  // Generate preview locally (client-side only, no API call)
  useEffect(() => {
    const now = new Date();
    let preview = admissionIdConfig.prefix;
    
    if (admissionIdConfig.yearFormat !== 'none') {
      if (admissionIdConfig.separator) preview += admissionIdConfig.separator;
      preview += admissionIdConfig.yearFormat === 'YYYY' ? now.getFullYear() : String(now.getFullYear()).slice(-2);
    }
    
    if (admissionIdConfig.separator) preview += admissionIdConfig.separator;
    preview += String(admissionIdConfig.currentNumber + 1).padStart(admissionIdConfig.numberPadding, '0');
    
    setPreviewId(preview);
  }, [admissionIdConfig]);

  const loadConfigurations = async (signal) => {
    setLoading(true);
    try {
      const [idConfig, rollConfig, docConfigs] = await Promise.all([
        settingsApi.getAdmissionIdConfig({ signal }),
        settingsApi.getRollNumberConfig({ signal }),
        settingsApi.getDocumentConfig({ signal })
      ]);

      if (signal?.aborted) return;

      if (idConfig) {
        setAdmissionIdConfig(idConfig);
      }

      if (rollConfig) {
        setRollNumberConfig(rollConfig);
      }

      if (docConfigs && docConfigs.length > 0) {
        setDocumentConfigs(docConfigs);
      } else {
        // Set default document configs
        setDocumentConfigs([
          { documentName: 'Birth Certificate', isRequired: true, uploadType: 'single', allowedFormats: ['pdf', 'jpg', 'png'], maxFileSize: 5242880, displayOrder: 1, description: 'Student birth certificate' },
          { documentName: 'Transfer Certificate', isRequired: false, uploadType: 'single', allowedFormats: ['pdf', 'jpg', 'png'], maxFileSize: 5242880, displayOrder: 2, description: 'TC from previous school' },
          { documentName: 'Aadhaar Card', isRequired: false, uploadType: 'front-back', allowedFormats: ['pdf', 'jpg', 'png'], maxFileSize: 5242880, displayOrder: 3, description: 'Aadhaar card (front and back)' },
          { documentName: 'Other Documents', isRequired: false, uploadType: 'multiple', allowedFormats: ['pdf', 'jpg', 'png'], maxFileSize: 5242880, displayOrder: 4, description: 'Any other relevant documents (medical records, previous report cards, etc.)' }
        ]);
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      logger.error('Error loading configurations:', error);
      toast.error(t('toast.error.failedToLoadConfigurations'));
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleSaveAdmissionIdConfig = async () => {
    setSaving(true);
    try {
      await settingsApi.updateAdmissionIdConfig(admissionIdConfig);
      toast.success(t('toast.success.admissionIdConfigurationSavedSuccessfully'));
    } catch (error) {
      logger.error('Error saving admission ID config:', error);
      toast.error(t('toast.error.failedToSaveConfiguration'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRollNumberConfig = async () => {
    setSaving(true);
    try {
      await settingsApi.updateRollNumberConfig(rollNumberConfig);
      toast.success(t('toast.success.rollNumberConfigurationSavedSuccessfully'));
    } catch (error) {
      logger.error('Error saving roll number config:', error);
      toast.error(t('toast.error.failedToSaveConfiguration'));
    } finally {
      setSaving(false);
    }
  };

  // AUDIT-134: Fixed save logic to handle mix of new and existing document configs
  const handleSaveDocumentConfig = async () => {
    setSaving(true);
    try {
      const existingDocs = documentConfigs.filter(doc => doc._id || doc.id);
      const newDocs = documentConfigs.filter(doc => !doc._id && !doc.id);

      if (existingDocs.length > 0) {
        await settingsApi.bulkUpdateDocumentConfig(existingDocs);
      }
      for (const doc of newDocs) {
        await settingsApi.createDocumentConfig(doc);
      }

      toast.success(t('toast.success.documentConfigurationSavedSuccessfully'));
      await loadConfigurations();
    } catch (error) {
      logger.error('Error saving document config:', error);
      toast.error(t('toast.error.failedToSaveConfiguration'));
    } finally {
      setSaving(false);
    }
  };

  const addDocumentConfig = () => {
    setDocumentConfigs([
      ...documentConfigs,
      {
        documentName: '',
        isRequired: false,
        uploadType: 'single',
        allowedFormats: ['pdf', 'jpg', 'png'],
        maxFileSize: 5242880,
        displayOrder: documentConfigs.length + 1,
        description: ''
      }
    ]);
  };

  const removeDocumentConfig = (index) => {
    setDocumentConfigs(documentConfigs.filter((_, i) => i !== index));
  };

  const updateDocumentConfig = (index, field, value) => {
    const updated = [...documentConfigs];
    updated[index] = { ...updated[index], [field]: value };
    setDocumentConfigs(updated);
  };

  if (loading) {
    return (
      <TablePageSkeleton />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-default-900">{t('pages.admissionFormConfiguration')}</h2>
        <p className="text-sm text-default-500 mt-1">
          Configure admission ID format and document requirements for student admissions
        </p>
      </div>

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
        variant="underlined"
        classNames={{
          tabList: "gap-6 border-b border-default-200",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary"
        }}
      >
        <Tab
          key="admission-id"
          title={
            <div className="flex items-center gap-2">
              <Hash size={18} />
              <span>{t('pages.admissionIdFormat')}</span>
            </div>
          }
        >
          <Card className="p-6 mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-default-900 mb-2">{t('pages.admissionIdConfiguration')}</h3>
                <p className="text-sm text-default-500">
                  Configure how admission IDs are generated for new students
                </p>
              </div>

              <Divider />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('pages.prefix')}
                  placeholder={t('settings.admissionPrefixPlaceholder')}
                  value={admissionIdConfig.prefix}
                  onValueChange={(value) => setAdmissionIdConfig({ ...admissionIdConfig, prefix: value })}
                  variant="bordered"
                  description="Text that appears at the start of the ID"
                />

                <Select
                  label={t('pages.yearFormat')}
                  placeholder={t('pages.selectYearFormat')}
                  selectedKeys={[admissionIdConfig.yearFormat]}
                  onSelectionChange={(keys) => setAdmissionIdConfig({ ...admissionIdConfig, yearFormat: Array.from(keys)[0] })}
                  variant="bordered"
                  description="How the year should be displayed"
                >
                  {yearFormatOptions.map((option) => (
                    <SelectItem key={option.value} textValue={option.label}>{option.label}</SelectItem>
                  ))}
                </Select>

                <Select
                  label={t('pages.separator')}
                  placeholder={t('pages.selectSeparator')}
                  selectedKeys={[admissionIdConfig.separator]}
                  onSelectionChange={(keys) => setAdmissionIdConfig({ ...admissionIdConfig, separator: Array.from(keys)[0] })}
                  variant="bordered"
                  description="Character between parts of the ID"
                >
                  {separatorOptions.map((option) => (
                    <SelectItem key={option.value} textValue={option.label}>{option.label}</SelectItem>
                  ))}
                </Select>

                <Input
                  type="number"
                  label={t('pages.numberPadding')}
                  placeholder={t('settings.paddingPlaceholder')}
                  value={String(admissionIdConfig.numberPadding)}
                  onValueChange={(value) => setAdmissionIdConfig({ ...admissionIdConfig, numberPadding: parseInt(value) || 4 })}
                  variant="bordered"
                  description="Number of digits (e.g., 4 = 0001)"
                  min={1}
                  max={10}
                />

                <Input
                  type="number"
                  label={t('pages.startingNumber')}
                  placeholder={t('settings.startingNumberPlaceholder')}
                  value={String(admissionIdConfig.startingNumber)}
                  onValueChange={(value) => setAdmissionIdConfig({ ...admissionIdConfig, startingNumber: parseInt(value) || 1 })}
                  variant="bordered"
                  description="First number to use"
                  min={1}
                />

                <Select
                  label={t('pages.resetFrequency')}
                  placeholder={t('pages.selectResetFrequency')}
                  selectedKeys={[admissionIdConfig.resetFrequency]}
                  onSelectionChange={(keys) => setAdmissionIdConfig({ ...admissionIdConfig, resetFrequency: Array.from(keys)[0] })}
                  variant="bordered"
                  description="When to reset the counter"
                >
                  {resetFrequencyOptions.map((option) => (
                    <SelectItem key={option.value} textValue={option.label}>{option.label}</SelectItem>
                  ))}
                </Select>
              </div>

              <Divider />

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-default-700">{t('pages.preview1')}</p>
                    <p className="text-xs text-default-500 mt-1">{t('pages.nextAdmissionIdWillBe')}</p>
                  </div>
                  <Chip size="lg" color="primary" variant="flat" className="font-mono text-lg px-4">
                    {previewId}
                  </Chip>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="flat"
                  onPress={() => loadConfigurations()}
                >
                  Reset
                </Button>
                <Button
                  color="primary"
                  startContent={<Save size={18} />}
                  onPress={handleSaveAdmissionIdConfig}
                  isLoading={saving}
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </Card>
        </Tab>

        <Tab
          key="roll-number"
          title={
            <div className="flex items-center gap-2">
              <Hash size={18} />
              <span>{t('pages.rollNumberFormat')}</span>
            </div>
          }
        >
          <Card className="p-6 mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-default-900 mb-2">{t('pages.rollNumberConfiguration')}</h3>
                <p className="text-sm text-default-500">
                  Configure how roll numbers are assigned to students
                </p>
              </div>

              <Divider />

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-default-700 mb-2 block">{t('pages.formatType')}</label>
                  <RadioGroup
                    value={rollNumberConfig.format}
                    onValueChange={(value) => setRollNumberConfig({ ...rollNumberConfig, format: value })}
                  >
                    <Radio value="sequential">
                      <div>
                        <div className="font-medium">{t('pages.sequential')}</div>
                        <div className="text-xs text-default-500">{t('pages.rollNumbersAssignedSequentially123')}</div>
                      </div>
                    </Radio>
                    <Radio value="class-based">
                      <div>
                        <div className="font-medium">{t('pages.classBased')}</div>
                        <div className="text-xs text-default-500">{t('pages.rollNumbersBasedOnClassEG10a00110a002')}</div>
                      </div>
                    </Radio>
                  </RadioGroup>
                </div>

                <Input
                  type="number"
                  label={t('pages.startingNumber')}
                  labelPlacement="outside"
                  placeholder={t('settings.startingNumberPlaceholder')}
                  value={rollNumberConfig.startingNumber.toString()}
                  onValueChange={(value) => setRollNumberConfig({ ...rollNumberConfig, startingNumber: parseInt(value) || 1 })}
                  description="The first roll number to assign"
                  variant="bordered"
                />

                <Switch
                  isSelected={rollNumberConfig.resetPerClass}
                  onValueChange={(value) => setRollNumberConfig({ ...rollNumberConfig, resetPerClass: value })}
                >
                  <div>
                    <div className="font-medium">{t('pages.resetPerClass')}</div>
                    <div className="text-xs text-default-500">{t('pages.startRollNumbersFromBeginningForEachClass')}</div>
                  </div>
                </Switch>

                <div className="bg-default-100 p-4 rounded-lg">
                  <p className="text-sm font-medium text-default-700 mb-2">{t('pages.preview1')}</p>
                  <p className="text-xs text-default-500 mb-2">
                    Example roll numbers for Class 10-A:
                  </p>
                  <div className="flex gap-2">
                    <Chip size="sm" variant="flat">
                      {rollNumberConfig.format === 'class-based' ? '10A-' : ''}{rollNumberConfig.startingNumber.toString().padStart(3, '0')}
                    </Chip>
                    <Chip size="sm" variant="flat">
                      {rollNumberConfig.format === 'class-based' ? '10A-' : ''}{(rollNumberConfig.startingNumber + 1).toString().padStart(3, '0')}
                    </Chip>
                    <Chip size="sm" variant="flat">
                      {rollNumberConfig.format === 'class-based' ? '10A-' : ''}{(rollNumberConfig.startingNumber + 2).toString().padStart(3, '0')}
                    </Chip>
                  </div>
                </div>
              </div>

              <Divider />

              <div className="flex justify-end">
                <Button
                  color="primary"
                  startContent={<Save size={18} />}
                  onPress={handleSaveRollNumberConfig}
                  isLoading={saving}
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </Card>
        </Tab>

        <Tab
          key="documents"
          title={
            <div className="flex items-center gap-2">
              <FileText size={18} />
              <span>{t('pages.documentRequirements')}</span>
            </div>
          }
        >
          <Card className="p-6 mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-default-900 mb-2">{t('pages.documentConfiguration')}</h3>
                  <p className="text-sm text-default-500">
                    Configure which documents are required during student admission
                  </p>
                </div>
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Plus size={18} />}
                  onPress={addDocumentConfig}
                >
                  Add Document
                </Button>
              </div>

              <Divider />

              <div className="space-y-4">
                {documentConfigs.map((doc, index) => (
                  <Card key={doc._id || doc.documentName || index} className="p-4 border border-default-200">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <Input
                          label={t('pages.documentName')}
                          placeholder={t('settings.documentNamePlaceholder')}
                          value={doc.documentName}
                          onValueChange={(value) => updateDocumentConfig(index, 'documentName', value)}
                          variant="bordered"
                          className="flex-1"
                          isRequired
                        />
                        <Button
                          isIconOnly
                          color="danger"
                          variant="light"
                          onPress={() => removeDocumentConfig(index)}
                          className="mt-6"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                          label={t('pages.uploadType')}
                          placeholder={t('pages.selectType1')}
                          selectedKeys={[doc.uploadType]}
                          onSelectionChange={(keys) => updateDocumentConfig(index, 'uploadType', Array.from(keys)[0])}
                          variant="bordered"
                        >
                          {uploadTypeOptions.map((option) => (
                            <SelectItem key={option.value} textValue={option.label}>{option.label}</SelectItem>
                          ))}
                        </Select>

                        <Input
                          type="number"
                          label={t('pages.maxFileSizeMb')}
                          value={String(Math.round(doc.maxFileSize / 1048576))}
                          onValueChange={(value) => updateDocumentConfig(index, 'maxFileSize', parseInt(value) * 1048576 || 5242880)}
                          variant="bordered"
                          min={1}
                          max={50}
                        />

                        <div className="flex items-center gap-4 mt-6">
                          <Switch
                            isSelected={doc.isRequired}
                            onValueChange={(value) => updateDocumentConfig(index, 'isRequired', value)}
                          >
                            <span className="text-sm">{t('pages.required1')}</span>
                          </Switch>
                        </div>
                      </div>

                      <Input
                        label={t('pages.description1')}
                        placeholder={t('pages.briefDescriptionOfThisDocument')}
                        value={doc.description}
                        onValueChange={(value) => updateDocumentConfig(index, 'description', value)}
                        variant="bordered"
                      />
                    </div>
                  </Card>
                ))}

                {documentConfigs.length === 0 && (
                  <div className="text-center py-12 text-default-400">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <p>{t('pages.noDocumentsConfigured')}</p>
                    <p className="text-sm mt-1">Click "Add Document" to create a new document requirement</p>
                  </div>
                )}
              </div>

              <Divider />

              <div className="flex justify-end gap-3">
                <Button
                  variant="flat"
                  onPress={() => loadConfigurations()}
                >
                  Reset
                </Button>
                <Button
                  color="primary"
                  startContent={<Save size={18} />}
                  onPress={handleSaveDocumentConfig}
                  isLoading={saving}
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}
