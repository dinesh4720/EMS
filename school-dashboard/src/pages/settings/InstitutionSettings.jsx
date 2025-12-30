import { useState } from "react";
import { Button, Input, Chip, Select, SelectItem, Divider, Spinner } from "@heroui/react";
import { Save, Building2, FileText, Edit2, Upload, X } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function InstitutionSettings() {
  const { schoolSettings, updateSchoolSettings, loading } = useApp();
  const [localSettings, setLocalSettings] = useState(schoolSettings);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState(null); // 'identity', 'branding', or null

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSchoolSettings(localSettings);
      setEditingSection(null);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalSettings(schoolSettings);
    setEditingSection(null);
  };

  const handleFileUpload = (field, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings((prev) => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const boards = ["CBSE", "ICSE", "State Board", "IB", "IGCSE", "NIOS"];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const DataField = ({ label, value }) => (
    <div className="space-y-1">
      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{label}</span>
      <p className="font-medium text-default-900">{value || "—"}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-8">
      {/* Unified Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-default-900">Institution Profile</h2>
          <p className="text-sm text-default-500 mt-1">Manage your institution's core identity and branding details.</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Section 1: Identity & Contact */}
        <div className={`rounded-xl border transition-all duration-300 ${editingSection === 'identity' ? 'border-primary ring-1 ring-primary bg-white' : 'border-default-200 bg-white hover:border-default-300'}`}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${editingSection === 'identity' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-default-900">Identity & Contact</h3>
                  <p className="text-xs text-default-500">Basic details about your school</p>
                </div>
              </div>
              {editingSection === 'identity' ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="light" color="danger" onPress={handleCancel} disabled={saving}>Cancel</Button>
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
                    label="Institution Name"
                    value={localSettings.name}
                    onValueChange={(v) => setLocalSettings({ ...localSettings, name: v })}
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{ inputWrapper: "bg-white border-default-200" }}
                  />
                </div>
                <Input
                  label="UDISE No."
                  value={localSettings.udiseNo}
                  onValueChange={(v) => setLocalSettings({ ...localSettings, udiseNo: v })}
                  variant="bordered"
                  labelPlacement="outside"
                  classNames={{ inputWrapper: "bg-white border-default-200" }}
                />
                <Input
                  label="Affiliation No."
                  value={localSettings.affiliationNo}
                  onValueChange={(v) => setLocalSettings({ ...localSettings, affiliationNo: v })}
                  variant="bordered"
                  labelPlacement="outside"
                  classNames={{ inputWrapper: "bg-white border-default-200" }}
                />
                <Select
                  label="Board of Education"
                  selectedKeys={localSettings.boardOfEducation ? [localSettings.boardOfEducation] : []}
                  onChange={(e) => setLocalSettings({ ...localSettings, boardOfEducation: e.target.value })}
                  variant="bordered"
                  labelPlacement="outside"
                  classNames={{ trigger: "bg-white border-default-200" }}
                >
                  {boards.map(board => (
                    <SelectItem key={board} value={board}>{board}</SelectItem>
                  ))}
                </Select>
                <Input
                  label="Email Address"
                  value={localSettings.email}
                  onValueChange={(v) => setLocalSettings({ ...localSettings, email: v })}
                  variant="bordered"
                  labelPlacement="outside"
                  classNames={{ inputWrapper: "bg-white border-default-200" }}
                />
                <Input
                  label="Phone Number"
                  value={localSettings.phone}
                  onValueChange={(v) => setLocalSettings({ ...localSettings, phone: v })}
                  variant="bordered"
                  labelPlacement="outside"
                  classNames={{ inputWrapper: "bg-white border-default-200" }}
                />
                <div className="md:col-span-2 lg:col-span-3">
                  <Input
                    label="Address"
                    value={localSettings.address}
                    onValueChange={(v) => setLocalSettings({ ...localSettings, address: v })}
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{ inputWrapper: "bg-white border-default-200" }}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                <DataField label="Institution Name" value={localSettings.name} />
                <DataField label="UDISE No." value={localSettings.udiseNo} />
                <DataField label="Affiliation No." value={localSettings.affiliationNo} />
                <DataField label="Board" value={localSettings.boardOfEducation} />
                <DataField label="Email" value={localSettings.email} />
                <DataField label="Phone" value={localSettings.phone} />
                <div className="md:col-span-2 lg:col-span-3">
                  <DataField label="Address" value={localSettings.address} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Branding */}
        <div className={`rounded-xl border transition-all duration-300 ${editingSection === 'branding' ? 'border-primary ring-1 ring-primary bg-white' : 'border-default-200 bg-white hover:border-default-300'}`}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${editingSection === 'branding' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-default-900">Official Branding</h3>
                  <p className="text-xs text-default-500">Logos and signatures for official documents</p>
                </div>
              </div>
              {editingSection === 'branding' ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="light" color="danger" onPress={handleCancel} disabled={saving}>Cancel</Button>
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
                <div className="w-32 h-32 rounded-full bg-white border border-default-200 flex items-center justify-center overflow-hidden relative shadow-sm">
                  {localSettings.logo ? (
                    <img src={localSettings.logo} alt="Logo" className="w-full h-full object-contain p-4" />
                  ) : (
                    <Building2 size={32} className="text-default-300" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-default-900">Institution Logo</h4>
                  {editingSection === 'branding' && <p className="text-xs text-default-500 mt-1">Recommended: 200x200px PNG</p>}
                </div>
                {editingSection === 'branding' && (
                  <>
                    <Button size="sm" color="primary" variant="flat" onPress={() => document.getElementById('logo-upload').click()} startContent={<Upload size={14} />}>Upload New</Button>
                    <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('logo', e)} />
                  </>
                )}
              </div>

              {/* Principal Sig */}
              <div className="p-6 border border-default-200 rounded-xl bg-default-50 flex flex-col items-center text-center gap-4 group hover:border-primary/30 transition-colors">
                <div className="w-40 h-24 rounded-lg bg-white border border-default-200 flex items-center justify-center overflow-hidden relative shadow-sm">
                  {localSettings.principalSignature ? (
                    <img src={localSettings.principalSignature} alt="Principal Signature" className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-xs text-default-400 italic">No Signature</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-default-900">Principal Signature</h4>
                  {editingSection === 'branding' && <p className="text-xs text-default-500 mt-1">For official documents</p>}
                </div>
                {editingSection === 'branding' && (
                  <>
                    <Button size="sm" color="primary" variant="flat" onPress={() => document.getElementById('principal-sig-upload').click()} startContent={<Upload size={14} />}>Upload New</Button>
                    <input id="principal-sig-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('principalSignature', e)} />
                  </>
                )}
              </div>

              {/* Correspondent Sig */}
              <div className="p-6 border border-default-200 rounded-xl bg-default-50 flex flex-col items-center text-center gap-4 group hover:border-primary/30 transition-colors">
                <div className="w-40 h-24 rounded-lg bg-white border border-default-200 flex items-center justify-center overflow-hidden relative shadow-sm">
                  {localSettings.correspondentSignature ? (
                    <img src={localSettings.correspondentSignature} alt="Correspondent Signature" className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-xs text-default-400 italic">No Signature</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-default-900">Correspondent Signature</h4>
                  {editingSection === 'branding' && <p className="text-xs text-default-500 mt-1">For official documents</p>}
                </div>
                {editingSection === 'branding' && (
                  <>
                    <Button size="sm" color="primary" variant="flat" onPress={() => document.getElementById('correspondent-sig-upload').click()} startContent={<Upload size={14} />}>Upload New</Button>
                    <input id="correspondent-sig-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('correspondentSignature', e)} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
