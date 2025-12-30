import { useState } from "react";
import { Tabs, Tab, Card, CardBody, Input, Button, Chip, Divider, Switch, Select, SelectItem, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { BookOpen, Calendar, Clock, GraduationCap, Plus, Save, Trash2, AlertCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import ClassSectionsSettings from "./ClassSectionsSettings";

export default function AcademicSettings() {
    const { schoolSettings, updateSchoolSettings, addSubject, deleteSubject, loading } = useApp();
    const [activeTab, setActiveTab] = useState("schedule");
    const [editingSection, setEditingSection] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [newSubject, setNewSubject] = useState({ name: "", code: "" });
    const [localSettings, setLocalSettings] = useState(schoolSettings);
    const [saving, setSaving] = useState(false);

    // Sync local settings when context updates
    // This ensures we have data if the page loads before context is fully ready
    if (schoolSettings && (!localSettings || (localSettings.academicYear !== schoolSettings.academicYear && !editingSection))) {
        if (schoolSettings && !localSettings) setLocalSettings(schoolSettings);
    }

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSchoolSettings(localSettings);
            setEditingSection(null);
            // Success toast would go here
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
        if (editingSection !== 'workingDays') return;
        const days = localSettings.workingDays.includes(day)
            ? localSettings.workingDays.filter(d => d !== day)
            : [...localSettings.workingDays, day];
        setLocalSettings({ ...localSettings, workingDays: days });
    };

    if (loading) return <div className="flex justify-center p-10"><Spinner size="lg" /></div>;

    const SectionHeader = ({ title, icon: Icon, section, colorClass = "bg-primary" }) => (
        <div className="flex justify-between items-start mb-6 relative z-10">
            <h3 className="text-lg font-bold text-default-900 flex items-center gap-2">
                <span className={`w-1 h-6 ${colorClass} rounded-full`}></span>
                {title}
            </h3>
            {editingSection === section ? (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="light" color="danger" onPress={handleCancel} disabled={saving}>Cancel</Button>
                    <Button size="sm" color="primary" onPress={handleSave} isLoading={saving} startContent={<Save size={14} />}>
                        Save
                    </Button>
                </div>
            ) : (
                <Button size="sm" variant="light" color="primary" onPress={() => setEditingSection(section)} isDisabled={editingSection !== null} startContent={<Plus size={16} className="rotate-45" />}>
                    Edit
                </Button>
            )}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto pb-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default-200 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-default-900">Academic Configuration</h2>
                    <p className="text-sm text-default-500 mt-1">Manage academic sessions, timings, subjects, and class structures.</p>
                </div>
            </div>

            <Tabs
                selectedKey={activeTab}
                onSelectionChange={setActiveTab}
                variant="underlined"
                classNames={{
                    tabList: "gap-6 border-b border-default-200 w-full p-0",
                    cursor: "w-full bg-primary",
                    tab: "max-w-fit px-0 h-10 pb-2",
                    tabContent: "group-data-[selected=true]:text-primary group-data-[selected=true]:font-semibold font-medium text-default-500"
                }}
            >
                <Tab key="schedule" title={
                    <div className="flex items-center gap-2">
                        <Calendar size={18} />
                        <span>Schedule & Timings</span>
                    </div>
                }>
                    <div className="pt-4 space-y-8 animate-fade-in">

                        {/* Academic Year Card */}
                        <div className={`border rounded-xl p-6 lg:p-8 relative overflow-hidden transition-colors ${editingSection === 'academicYear' ? 'border-primary ring-1 ring-primary bg-white' : 'border-default-200 bg-white'}`}>
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Calendar size={120} />
                            </div>

                            <SectionHeader title="Academic Session" icon={Calendar} section="academicYear" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-default-600 block">Current Session Name</label>
                                    {editingSection === 'academicYear' ? (
                                        <Input
                                            value={localSettings.academicYear}
                                            onValueChange={(v) => setLocalSettings({ ...localSettings, academicYear: v })}
                                            placeholder="e.g. 2024-2025"
                                            size="lg"
                                            variant="bordered"
                                            classNames={{ inputWrapper: "bg-white" }}
                                            startContent={<Calendar size={18} className="text-default-400" />}
                                        />
                                    ) : (
                                        <div className="h-12 flex items-center text-lg font-semibold text-default-900 px-1">{localSettings.academicYear}</div>
                                    )}
                                    <p className="text-xs text-default-400">This label will appear on all reports and documents.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-default-600 block">Start Date</label>
                                        {editingSection === 'academicYear' ? (
                                            <Input
                                                type="date"
                                                value={localSettings.academicYearStart}
                                                onValueChange={(v) => setLocalSettings({ ...localSettings, academicYearStart: v })}
                                                variant="bordered"
                                                size="lg"
                                                classNames={{ inputWrapper: "bg-white" }}
                                            />
                                        ) : (
                                            <div className="h-12 flex items-center font-medium text-default-900 px-1">{localSettings.academicYearStart}</div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-default-600 block">End Date</label>
                                        {editingSection === 'academicYear' ? (
                                            <Input
                                                type="date"
                                                value={localSettings.academicYearEnd}
                                                onValueChange={(v) => setLocalSettings({ ...localSettings, academicYearEnd: v })}
                                                variant="bordered"
                                                size="lg"
                                                classNames={{ inputWrapper: "bg-white" }}
                                            />
                                        ) : (
                                            <div className="h-12 flex items-center font-medium text-default-900 px-1">{localSettings.academicYearEnd}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Day Structure Card */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className={`col-span-1 lg:col-span-2 border rounded-xl p-6 lg:p-8 transition-colors ${editingSection === 'timings' ? 'border-primary ring-1 ring-primary bg-white' : 'border-default-200 bg-white'}`}>
                                <SectionHeader title="School Timings" icon={Clock} section="timings" colorClass="bg-secondary" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-sm font-medium text-default-500 uppercase tracking-wider mb-4">Daily Schedule</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 border border-default-200 rounded-lg hover:border-primary/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-success-50 text-success-600 rounded-lg"><Clock size={16} /></div>
                                                    <span className="font-medium text-default-700">School Starts</span>
                                                </div>
                                                {editingSection === 'timings' ? (
                                                    <input
                                                        type="time"
                                                        value={localSettings.schoolStartTime}
                                                        onChange={(e) => setLocalSettings({ ...localSettings, schoolStartTime: e.target.value })}
                                                        className="bg-transparent font-bold text-default-900 focus:outline-none text-right"
                                                    />
                                                ) : (
                                                    <span className="font-bold text-default-900">{localSettings.schoolStartTime}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between p-3 border border-default-200 rounded-lg hover:border-primary/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-danger-50 text-danger-600 rounded-lg"><Clock size={16} /></div>
                                                    <span className="font-medium text-default-700">School Ends</span>
                                                </div>
                                                {editingSection === 'timings' ? (
                                                    <input
                                                        type="time"
                                                        value={localSettings.schoolEndTime}
                                                        onChange={(e) => setLocalSettings({ ...localSettings, schoolEndTime: e.target.value })}
                                                        className="bg-transparent font-bold text-default-900 focus:outline-none text-right"
                                                    />
                                                ) : (
                                                    <span className="font-bold text-default-900">{localSettings.schoolEndTime}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-default-500 uppercase tracking-wider mb-4">Period Structure</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between gap-4">
                                                {editingSection === 'timings' ? (
                                                    <Input
                                                        type="number"
                                                        label="Period (mins)"
                                                        value={localSettings.periodDuration}
                                                        onValueChange={(v) => setLocalSettings({ ...localSettings, periodDuration: parseInt(v) })}
                                                        variant="bordered"
                                                        labelPlacement="outside"
                                                    />
                                                ) : (
                                                    <div className="flex-1 space-y-1">
                                                        <span className="text-xs text-default-500 block">Period (mins)</span>
                                                        <p className="font-semibold text-lg">{localSettings.periodDuration}</p>
                                                    </div>
                                                )}
                                                {editingSection === 'timings' ? (
                                                    <Input
                                                        type="number"
                                                        label="Periods/Day"
                                                        value={localSettings.periodsPerDay}
                                                        onValueChange={(v) => setLocalSettings({ ...localSettings, periodsPerDay: parseInt(v) })}
                                                        variant="bordered"
                                                        labelPlacement="outside"
                                                    />
                                                ) : (
                                                    <div className="flex-1 space-y-1">
                                                        <span className="text-xs text-default-500 block">Periods/Day</span>
                                                        <p className="font-semibold text-lg">{localSettings.periodsPerDay}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 bg-default-50 rounded-lg mt-4 flex items-start gap-3">
                                                <AlertCircle size={16} className="text-default-500 mt-1 shrink-0" />
                                                <p className="text-xs text-default-500 leading-relaxed">
                                                    Total instructional time: <span className="font-bold text-default-700">{Math.floor((localSettings.periodsPerDay * localSettings.periodDuration) / 60)}h {(localSettings.periodsPerDay * localSettings.periodDuration) % 60}m</span>.
                                                    Ensure this fits within the school start and end times, including breaks.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`col-span-1 border rounded-xl p-6 lg:p-8 flex flex-col transition-colors ${editingSection === 'workingDays' ? 'border-primary ring-1 ring-primary bg-white' : 'border-default-200 bg-white'}`}>
                                <SectionHeader title="Working Days" icon={Calendar} section="workingDays" colorClass="bg-warning" />

                                <div className="flex-1 flex flex-col gap-2">
                                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                                        const isActive = localSettings.workingDays.includes(day);
                                        return (
                                            <button
                                                key={day}
                                                onClick={() => toggleWorkingDay(day)}
                                                disabled={editingSection !== 'workingDays'}
                                                className={`w-full p-3 rounded-lg flex items-center justify-between text-sm transition-all duration-200 border ${isActive
                                                    ? 'bg-primary/5 border-primary text-primary font-bold'
                                                    : 'bg-white border-transparent hover:bg-default-50 text-default-500'
                                                    } ${editingSection !== 'workingDays' ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                                            >
                                                <span>{day === "Mon" ? "Monday" : day === "Tue" ? "Tuesday" : day === "Wed" ? "Wednesday" : day === "Thu" ? "Thursday" : day === "Fri" ? "Friday" : day === "Sat" ? "Saturday" : "Sunday"}</span>
                                                {isActive && <div className="w-2 h-2 rounded-full bg-primary shadow-sm" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </Tab>

                <Tab key="subjects" title={
                    <div className="flex items-center gap-2">
                        <BookOpen size={18} />
                        <span>Subjects</span>
                    </div>
                }>
                    <div className="pt-4 space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-default-900">Subject Repository</h3>
                            <Button color="primary" radius="full" startContent={<Plus size={16} />} onPress={onOpen} className="shadow-md">
                                Add Subject
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {schoolSettings.subjects.length > 0 ? (
                                schoolSettings.subjects.map((subject) => (
                                    <div key={subject.id} className="group p-4 bg-white border border-default-200 rounded-xl hover:border-primary transition-all duration-200 shadow-sm flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                                                {subject.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-default-900">{subject.name}</h4>
                                                <p className="text-xs text-default-500 font-mono bg-default-100 px-1.5 py-0.5 rounded inline-block mt-1">{subject.code}</p>
                                            </div>
                                        </div>
                                        <Button isIconOnly variant="light" color="danger" size="sm" onPress={() => deleteSubject(subject.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center text-default-400 bg-white border border-default-200 rounded-xl border-dashed">
                                    <BookOpen size={32} className="mb-3 opacity-50" />
                                    <p>No subjects defined yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Tab>

                <Tab key="classes" title={
                    <div className="flex items-center gap-2">
                        <GraduationCap size={18} />
                        <span>Classes & Sections</span>
                    </div>
                }>
                    <div className="pt-4 animate-fade-in">
                        <ClassSectionsSettings />
                    </div>
                </Tab>
            </Tabs>

            {/* Add Subject Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="sm">
                <ModalContent>
                    <ModalHeader>Add New Subject</ModalHeader>
                    <ModalBody>
                        <div className="space-y-4 py-2">
                            <Input
                                label="Subject Name"
                                placeholder="e.g., Mathematics"
                                value={newSubject.name}
                                onValueChange={(v) => setNewSubject({ ...newSubject, name: v })}
                                variant="bordered"
                                labelPlacement="outside"
                            />
                            <Input
                                label="Subject Code"
                                placeholder="e.g., MATH"
                                value={newSubject.code}
                                onValueChange={(v) => setNewSubject({ ...newSubject, code: v.toUpperCase() })}
                                variant="bordered"
                                labelPlacement="outside"
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
