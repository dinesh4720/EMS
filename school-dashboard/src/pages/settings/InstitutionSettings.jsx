import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Input, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem, Divider, Spinner } from "@heroui/react";
import { Save, Plus, Clock, Upload, Building2, FileText } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function InstitutionSettings() {
  const { schoolSettings, updateSchoolSettings, addSubject, deleteSubject, loading } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newSubject, setNewSubject] = useState({ name: "", code: "" });
  const [localSettings, setLocalSettings] = useState(schoolSettings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSchoolSettings(localSettings);
      // Show success message
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.name.trim() || !newSubject.code.trim()) return;
    try {
      await addSubject(newSubject);
      setNewSubject({ name: "", code: "" });
      onClose();
    } catch (error) {
      console.error('Failed to add subject:', error);
    }
  };

  const toggleWorkingDay = (day) => {
    const days = localSettings.workingDays.includes(day)
      ? localSettings.workingDays.filter(d => d !== day)
      : [...localSettings.workingDays, day];
    setLocalSettings({ ...localSettings, workingDays: days });
  };

  const handleFileUpload = (field, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings({ ...localSettings, [field]: reader.result });
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Institution Profile
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your institution's basic information, academic year, and school timings
        </p>
      </div>

      <div className="flex justify-end">
        <Button 
          color="primary" 
          size="sm" 
          startContent={<Save size={16} />} 
          onPress={handleSave}
          isLoading={saving}
          className="transition-all duration-200"
        >
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Basic Institution Info */}
        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-primary" />
              <h3 className="text-sm font-semibold text-default-700">Institution Profile</h3>
            </div>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <Input 
              size="sm" 
              label="Institution Name" 
              variant="bordered" 
              value={localSettings.name} 
              onValueChange={(v) => setLocalSettings({ ...localSettings, name: v })} 
            />
            <Input 
              size="sm" 
              label="UDISE No." 
              variant="bordered" 
              value={localSettings.udiseNo} 
              onValueChange={(v) => setLocalSettings({ ...localSettings, udiseNo: v })} 
            />
            <Input 
              size="sm" 
              label="Affiliation No." 
              variant="bordered" 
              value={localSettings.affiliationNo} 
              onValueChange={(v) => setLocalSettings({ ...localSettings, affiliationNo: v })} 
            />
            <Select 
              size="sm" 
              label="Board of Education" 
              variant="bordered"
              selectedKeys={[localSettings.boardOfEducation]}
              onChange={(e) => setLocalSettings({ ...localSettings, boardOfEducation: e.target.value })}
            >
              {boards.map(board => (
                <SelectItem key={board} value={board}>{board}</SelectItem>
              ))}
            </Select>
            <Input 
              size="sm" 
              label="Address" 
              variant="bordered" 
              value={localSettings.address} 
              onValueChange={(v) => setLocalSettings({ ...localSettings, address: v })} 
            />
            <div className="grid grid-cols-2 gap-3">
              <Input 
                size="sm" 
                label="Phone" 
                variant="bordered" 
                value={localSettings.phone} 
                onValueChange={(v) => setLocalSettings({ ...localSettings, phone: v })} 
              />
              <Input 
                size="sm" 
                label="Email" 
                variant="bordered" 
                value={localSettings.email} 
                onValueChange={(v) => setLocalSettings({ ...localSettings, email: v })} 
              />
            </div>
          </CardBody>
        </Card>

        {/* Logo & Signatures */}
        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              <h3 className="text-sm font-semibold text-default-700">Logo & Signatures</h3>
            </div>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            {/* Institution Logo */}
            <div>
              <label className="text-xs font-medium text-default-600 mb-2 block">Institution Logo</label>
              <div className="flex items-center gap-3">
                {localSettings.logo && (
                  <img src={localSettings.logo} alt="Logo" className="w-16 h-16 object-contain border border-default-200 rounded-lg p-1" />
                )}
                <Button 
                  size="sm" 
                  variant="flat" 
                  color="primary" 
                  startContent={<Upload size={14} />}
                  onPress={() => document.getElementById('logo-upload').click()}
                >
                  {localSettings.logo ? 'Change Logo' : 'Upload Logo'}
                </Button>
                <input 
                  id="logo-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleFileUpload('logo', e)}
                />
              </div>
            </div>

            <Divider />

            {/* Principal Signature */}
            <div>
              <label className="text-xs font-medium text-default-600 mb-2 block">Principal Signature</label>
              <div className="flex items-center gap-3">
                {localSettings.principalSignature && (
                  <img src={localSettings.principalSignature} alt="Principal Signature" className="w-24 h-12 object-contain border border-default-200 rounded-lg p-1 bg-white" />
                )}
                <Button 
                  size="sm" 
                  variant="flat" 
                  color="primary" 
                  startContent={<Upload size={14} />}
                  onPress={() => document.getElementById('principal-sig-upload').click()}
                >
                  {localSettings.principalSignature ? 'Change' : 'Upload'}
                </Button>
                <input 
                  id="principal-sig-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleFileUpload('principalSignature', e)}
                />
              </div>
            </div>

            <Divider />

            {/* Correspondent Signature */}
            <div>
              <label className="text-xs font-medium text-default-600 mb-2 block">Correspondent Signature</label>
              <div className="flex items-center gap-3">
                {localSettings.correspondentSignature && (
                  <img src={localSettings.correspondentSignature} alt="Correspondent Signature" className="w-24 h-12 object-contain border border-default-200 rounded-lg p-1 bg-white" />
                )}
                <Button 
                  size="sm" 
                  variant="flat" 
                  color="primary" 
                  startContent={<Upload size={14} />}
                  onPress={() => document.getElementById('correspondent-sig-upload').click()}
                >
                  {localSettings.correspondentSignature ? 'Change' : 'Upload'}
                </Button>
                <input 
                  id="correspondent-sig-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleFileUpload('correspondentSignature', e)}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Academic Year */}
        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">Academic Year</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <Input 
              size="sm" 
              label="Academic Year" 
              variant="bordered" 
              value={localSettings.academicYear} 
              onValueChange={(v) => setLocalSettings({ ...localSettings, academicYear: v })}
              description="e.g., 2024-25"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input 
                size="sm" 
                type="date" 
                label="Start Date" 
                variant="bordered" 
                value={localSettings.academicYearStart} 
                onValueChange={(v) => setLocalSettings({ ...localSettings, academicYearStart: v })} 
              />
              <Input 
                size="sm" 
                type="date" 
                label="End Date" 
                variant="bordered" 
                value={localSettings.academicYearEnd} 
                onValueChange={(v) => setLocalSettings({ ...localSettings, academicYearEnd: v })} 
              />
            </div>
            <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-xs text-primary-700">
                Current Academic Year: <strong>{localSettings.academicYear}</strong>
              </p>
            </div>
          </CardBody>
        </Card>

        {/* School Timings */}
        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              <h3 className="text-sm font-semibold text-default-700">School Timings</h3>
            </div>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input 
                size="sm" 
                type="time" 
                label="School Start Time" 
                variant="bordered" 
                value={localSettings.schoolStartTime} 
                onValueChange={(v) => setLocalSettings({ ...localSettings, schoolStartTime: v })} 
              />
              <Input 
                size="sm" 
                type="time" 
                label="School End Time" 
                variant="bordered" 
                value={localSettings.schoolEndTime} 
                onValueChange={(v) => setLocalSettings({ ...localSettings, schoolEndTime: v })} 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input 
                size="sm" 
                type="number" 
                label="Period Duration (min)" 
                variant="bordered" 
                value={localSettings.periodDuration} 
                onValueChange={(v) => setLocalSettings({ ...localSettings, periodDuration: parseInt(v) })} 
              />
              <Input 
                size="sm" 
                type="number" 
                label="Periods Per Day" 
                variant="bordered" 
                value={localSettings.periodsPerDay} 
                onValueChange={(v) => setLocalSettings({ ...localSettings, periodsPerDay: parseInt(v) })} 
              />
            </div>
            <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-xs text-primary-700">
                Total school hours: <strong>{Math.floor((localSettings.periodsPerDay * localSettings.periodDuration) / 60)}h {(localSettings.periodsPerDay * localSettings.periodDuration) % 60}m</strong>
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Working Days */}
        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">Working Days</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <div className="grid grid-cols-7 gap-2 text-center">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div 
                  key={day} 
                  onClick={() => toggleWorkingDay(day)}
                  className={`p-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 ${
                    localSettings.workingDays.includes(day) 
                      ? 'bg-success-50 text-success-700 border border-success-200' 
                      : 'bg-default-100 text-default-500 border border-default-200'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            <p className="text-xs text-default-500 text-center">Click to toggle working days</p>
          </CardBody>
        </Card>

        {/* Subjects */}
        <Card className="shadow-sm border border-default-200 rounded-lg">
          <CardHeader className="py-4 px-4 bg-default-50/50 border-b border-default-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-default-700">Subjects</h3>
            <Button size="sm" variant="flat" color="primary" startContent={<Plus size={14} />} onPress={onOpen}>Add</Button>
          </CardHeader>
          <CardBody className="p-4">
            <div className="flex flex-wrap gap-2">
              {schoolSettings.subjects.map((subject) => (
                <Chip 
                  key={subject.id} 
                  variant="flat" 
                  color="primary"
                  onClose={() => deleteSubject(subject.id)}
                  classNames={{ closeButton: "text-primary hover:bg-primary/20" }}
                >
                  {subject.name} ({subject.code})
                </Chip>
              ))}
            </div>
            {schoolSettings.subjects.length === 0 && (
              <p className="text-sm text-default-400 text-center py-4">No subjects added yet</p>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalContent>
          <ModalHeader>Add New Subject</ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <Input 
                size="sm" 
                label="Subject Name" 
                placeholder="e.g., Mathematics" 
                value={newSubject.name} 
                onValueChange={(v) => setNewSubject({ ...newSubject, name: v })} 
                variant="bordered"
              />
              <Input 
                size="sm" 
                label="Subject Code" 
                placeholder="e.g., MATH" 
                value={newSubject.code} 
                onValueChange={(v) => setNewSubject({ ...newSubject, code: v.toUpperCase() })} 
                variant="bordered"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Cancel</Button>
            <Button color="primary" onPress={handleAddSubject} isDisabled={!newSubject.name.trim() || !newSubject.code.trim()}>Add Subject</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
