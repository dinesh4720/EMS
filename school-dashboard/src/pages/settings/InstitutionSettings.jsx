import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Input, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { Save, Plus, Clock } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function InstitutionSettings() {
  const { schoolSettings, updateSchoolSettings, addSubject, deleteSubject } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newSubject, setNewSubject] = useState({ name: "", code: "" });
  const [localSettings, setLocalSettings] = useState(schoolSettings);

  const handleSave = () => {
    updateSchoolSettings(localSettings);
  };

  const handleAddSubject = () => {
    if (!newSubject.name.trim() || !newSubject.code.trim()) return;
    addSubject(newSubject);
    setNewSubject({ name: "", code: "" });
    onClose();
  };

  const toggleWorkingDay = (day) => {
    const days = localSettings.workingDays.includes(day)
      ? localSettings.workingDays.filter(d => d !== day)
      : [...localSettings.workingDays, day];
    setLocalSettings({ ...localSettings, workingDays: days });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end mb-3">
        <Button color="primary" size="sm" startContent={<Save size={14} />} onPress={handleSave}>Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="shadow-sm border border-default-200 rounded-2xl">
          <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">Institution Profile</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <Input size="sm" label="Institution Name" variant="faded" value={localSettings.name} onValueChange={(v) => setLocalSettings({ ...localSettings, name: v })} />
            <Input size="sm" label="Address" variant="faded" value={localSettings.address} onValueChange={(v) => setLocalSettings({ ...localSettings, address: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Input size="sm" label="Phone" variant="faded" value={localSettings.phone} onValueChange={(v) => setLocalSettings({ ...localSettings, phone: v })} />
              <Input size="sm" label="Email" variant="faded" value={localSettings.email} onValueChange={(v) => setLocalSettings({ ...localSettings, email: v })} />
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-2xl">
          <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-100">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-default-700">School Timings</h3>
            </div>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input 
                size="sm" 
                type="time" 
                label="School Start Time" 
                variant="faded" 
                value={localSettings.schoolStartTime} 
                onValueChange={(v) => setLocalSettings({ ...localSettings, schoolStartTime: v })} 
              />
              <Input 
                size="sm" 
                type="time" 
                label="School End Time" 
                variant="faded" 
                value={localSettings.schoolEndTime} 
                onValueChange={(v) => setLocalSettings({ ...localSettings, schoolEndTime: v })} 
              />
            </div>
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-primary">
                An alert will be shown to users accessing the system before school hours ({localSettings.schoolStartTime}).
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-2xl">
          <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-100">
            <h3 className="text-sm font-semibold text-default-700">Working Days</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-4">
            <div className="grid grid-cols-7 gap-2 text-center">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div 
                  key={day} 
                  onClick={() => toggleWorkingDay(day)}
                  className={`p-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                    localSettings.workingDays.includes(day) 
                      ? 'bg-success-100 text-success-700 border border-success-200' 
                      : 'bg-default-100 text-default-500 border border-default-200'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            <p className="text-tiny text-default-500 text-center">Click to toggle working days</p>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-default-200 rounded-2xl">
          <CardHeader className="py-3 px-4 bg-default-50/50 border-b border-default-100 flex justify-between items-center">
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
              <Input size="sm" label="Subject Name" placeholder="e.g., Mathematics" value={newSubject.name} onValueChange={(v) => setNewSubject({ ...newSubject, name: v })} />
              <Input size="sm" label="Subject Code" placeholder="e.g., MATH" value={newSubject.code} onValueChange={(v) => setNewSubject({ ...newSubject, code: v.toUpperCase() })} />
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
