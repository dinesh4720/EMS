import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, Select, SelectItem, Input, Textarea, Checkbox, Dropdown, DropdownMenu, DropdownTrigger, DropdownItem, Tooltip } from "@heroui/react";
import { MessageSquare, AlertCircle, Award, CalendarCheck, Heart, Mail, Plus, Edit, Trash2, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";

const getAuthToken = () => {
  const storedUser = sessionStorage.getItem('app_user');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      return userData.token;
    } catch (err) {
      console.error('Failed to parse user data:', err);
      return null;
    }
  }
  return null;
};

export default function StudentRemarks({
  studentId,
  student,
  remarks,
  remarksLoading,
  remarksCategoryFilter,
  onRemarksChange,
  onCategoryFilterChange
}) {
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
      toast.error("Please enter a title");
      return;
    }
    if (!remarkForm.type && !remarkForm.customType.trim()) {
      toast.error("Please select or enter a remark type");
      return;
    }
    if (!remarkForm.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = getAuthToken();

      const remarkData = {
        title: remarkForm.title.trim(),
        description: remarkForm.description.trim(),
        category: remarkForm.customType.trim() || remarkForm.type,
        sentToParent: remarkForm.sendToParent
      };

      const response = await fetch(`${API_URL}/students/${studentId}/remarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(remarkData)
      });

      if (response.ok) {
        const savedRemark = await response.json();

        // Add to local state
        onRemarksChange([savedRemark, ...remarks]);

        // Show success message
        if (remarkForm.sendToParent) {
          toast.success(`Remark added and sent to ${student.parentName || 'parent'}`);
        } else {
          toast.success("Remark added successfully");
        }

        // Reset form and close drawer
        setRemarkForm({
          type: "",
          customType: "",
          title: "",
          description: "",
          sendToParent: false
        });
        setIsRemarkOpen(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error saving remark:", errorData);
        toast.error(errorData.error || "Failed to save remark");
      }
    } catch (error) {
      console.error("Error saving remark:", error);
      toast.error("Failed to save remark");
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Student Remarks</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Notes and observations about the student</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              size="sm"
              placeholder="Filter by category"
              className="w-full sm:w-48"
              variant="bordered"
              selectedKeys={remarksCategoryFilter === 'all' ? [] : [remarksCategoryFilter]}
              onSelectionChange={(keys) => onCategoryFilterChange(Array.from(keys)[0] || 'all')}
            >
              <SelectItem key="all">All Categories</SelectItem>
              <SelectItem key="academic">Academic</SelectItem>
              <SelectItem key="behavioral">Behavioral</SelectItem>
              <SelectItem key="achievement">Achievement</SelectItem>
              <SelectItem key="attendance">Attendance</SelectItem>
              <SelectItem key="health">Health</SelectItem>
              <SelectItem key="general">General</SelectItem>
            </Select>
            <Button size="sm" color="primary" variant="flat" startContent={<Plus size={16} />} onPress={() => setIsRemarkOpen(true)}>Add Remark</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {remarksLoading ? (
            <div className="text-center py-12">
              <p className="text-default-500">Loading remarks...</p>
            </div>
          ) : remarks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg dark:border-zinc-700">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-3 dark:text-zinc-600" />
              <h4 className="font-semibold text-gray-700 mb-1 dark:text-zinc-300">No remarks yet</h4>
              <p className="text-sm text-gray-500 mb-4 dark:text-zinc-400">Add your first remark or observation about this student</p>
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
                            <Chip size="sm" variant="flat" className="bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400" startContent={<Mail size={12} />}>Sent to Parent</Chip>
                          ) : (
                            <Chip size="sm" variant="flat" className="bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">Staff Only</Chip>
                          )}
                          <span className="text-xs text-gray-400 dark:text-zinc-500">
                            • {remark.authorName || 'System'} • {new Date(remark.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Remark actions">
                          <DropdownItem key="edit" startContent={<Edit size={14} />}>Edit</DropdownItem>
                          <DropdownItem key="resend" startContent={<Mail size={14} />}>Resend to Parent</DropdownItem>
                          <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 size={14} />}>Delete</DropdownItem>
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
                    <h3 className="text-lg font-semibold">Add Remark</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Add a note or observation about the student</p>
                  </div>
                </div>
              </DrawerHeader>
              <DrawerBody className="p-6 space-y-6">
                {/* Remark Type - Dropdown with Custom Option */}
                <div className="space-y-2">
                  <Select
                    label="Remark Type"
                    placeholder="Select type or enter custom"
                    variant="bordered"
                    selectedKeys={remarkForm.type ? [remarkForm.type] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0];
                      setRemarkForm({ ...remarkForm, type: selected, customType: "" });
                    }}
                  >
                    <SelectItem key="academic">Academic</SelectItem>
                    <SelectItem key="behavioral">Behavioral</SelectItem>
                    <SelectItem key="achievement">Achievement</SelectItem>
                    <SelectItem key="attendance">Attendance</SelectItem>
                    <SelectItem key="health">Health</SelectItem>
                    <SelectItem key="general">General</SelectItem>
                    <SelectItem key="custom">Custom Type...</SelectItem>
                  </Select>

                  {/* Show custom type input when "custom" is selected */}
                  {remarkForm.type === "custom" && (
                    <Input
                      label="Custom Type"
                      placeholder="Enter custom remark type"
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
                  label="Title"
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
                  label="Description"
                  placeholder="Enter detailed remark or observation..."
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
                      <span className="font-medium text-gray-900 dark:text-zinc-100">Send to Parent</span>
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
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-2 dark:text-zinc-400">Preview</p>
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
