import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardBody, CardHeader, Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem, Spinner } from "@heroui/react";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function HolidaySettings() {
  const { events, addEvent, updateEvent, deleteEvent, loading } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    holidayType: "School",
    description: ""
  });
  const [saving, setSaving] = useState(false);

  // Lazy loading state
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  const holidays = events.filter(e => e.type === "holiday");
  const sortedHolidays = useMemo(() => 
    holidays.sort((a, b) => new Date(a.date) - new Date(b.date)),
    [holidays]
  );

  const visibleHolidays = useMemo(() => 
    sortedHolidays.slice(0, visibleCount),
    [sortedHolidays, visibleCount]
  );

  const hasMore = visibleCount < sortedHolidays.length;

  // Reset visible count when holidays change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [holidays.length]);

  // Lazy loading intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + ITEMS_PER_LOAD);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const handleOpen = (holiday = null) => {
    if (holiday) {
      setEditingHoliday(holiday);
      setFormData({
        title: holiday.title,
        date: holiday.date,
        holidayType: holiday.holidayType || "School",
        description: holiday.description || ""
      });
    } else {
      setEditingHoliday(null);
      setFormData({ title: "", date: "", holidayType: "School", description: "" });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.date) return;

    setSaving(true);
    try {
      const holidayData = {
        ...formData,
        type: "holiday",
        allDay: true,
        startTime: "",
        endTime: ""
      };

      if (editingHoliday) {
        await updateEvent(editingHoliday.id, holidayData);
      } else {
        await addEvent(holidayData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save holiday:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this holiday?")) {
      try {
        await deleteEvent(id);
      } catch (error) {
        console.error('Failed to delete holiday:', error);
      }
    }
  };

  const holidayTypeColors = {
    "National": "success",
    "Regional": "warning",
    "School": "primary"
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-default-800">Holiday Management</h2>
          <p className="text-sm text-default-500">Manage school holidays and academic calendar</p>
        </div>
        <Button 
          color="primary" 
          size="sm" 
          startContent={<Plus size={16} />} 
          onPress={() => handleOpen()}
          className="transition-all duration-200"
        >
          Add Holiday
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-success-50 rounded-lg border border-success-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-success-600" />
            <span className="text-xs text-success-700 uppercase tracking-wider">Total Holidays</span>
          </div>
          <p className="text-2xl font-semibold text-success-700">{holidays.length}</p>
        </div>

        <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-warning-600" />
            <span className="text-xs text-warning-700 uppercase tracking-wider">National</span>
          </div>
          <p className="text-2xl font-semibold text-warning-700">
            {holidays.filter(h => h.holidayType === "National").length}
          </p>
        </div>

        <div className="p-4 bg-default-50 rounded-lg border border-default-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-default-500" />
            <span className="text-xs text-default-500 uppercase tracking-wider">Regional</span>
          </div>
          <p className="text-2xl font-semibold text-default-900">
            {holidays.filter(h => h.holidayType === "Regional").length}
          </p>
        </div>

        <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-primary-600" />
            <span className="text-xs text-primary-700 uppercase tracking-wider">School</span>
          </div>
          <p className="text-2xl font-semibold text-primary-700">
            {holidays.filter(h => h.holidayType === "School").length}
          </p>
        </div>
      </div>

      <Card className="shadow-sm border border-default-200 rounded-lg">
        <CardBody className="p-0">
          <Table
            aria-label="Holidays"
            removeWrapper
            classNames={{
              base: "overflow-visible",
              th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200",
              td: "py-5 border-b border-default-100",
              tbody: "[&>tr:last-child>td]:border-none"
            }}
          >
            <TableHeader>
              <TableColumn>HOLIDAY NAME</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>DAY</TableColumn>
              <TableColumn align="end">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No holidays added yet">
              {visibleHolidays.map((holiday) => {
                const date = new Date(holiday.date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <TableRow key={holiday.id}>
                    <TableCell className="font-medium text-default-700">{holiday.title}</TableCell>
                    <TableCell className="text-sm text-default-600">
                      {date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="sm" 
                        variant="flat" 
                        color={holidayTypeColors[holiday.holidayType] || "default"}
                      >
                        {holiday.holidayType || "School"}
                      </Chip>
                    </TableCell>
                    <TableCell className="text-sm text-default-500">{dayName}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button 
                          isIconOnly 
                          size="sm" 
                          variant="light" 
                          color="primary" 
                          onPress={() => handleOpen(holiday)}
                          className="transition-all duration-200"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          isIconOnly 
                          size="sm" 
                          variant="light" 
                          color="danger" 
                          onPress={() => handleDelete(holiday.id)}
                          className="transition-all duration-200"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Lazy loading indicator */}
          <div ref={loaderRef} className="flex justify-center py-4">
            {isLoadingMore && <Spinner size="sm" color="primary" />}
            {!hasMore && sortedHolidays.length > ITEMS_PER_LOAD && (
              <span className="text-default-400 text-sm">All {sortedHolidays.length} holidays loaded</span>
            )}
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader>{editingHoliday ? "Edit Holiday" : "Add New Holiday"}</ModalHeader>
          <ModalBody className="gap-4">
            <Input
              size="sm"
              label="Holiday Name"
              placeholder="e.g., Independence Day"
              value={formData.title}
              onValueChange={(v) => setFormData({ ...formData, title: v })}
              variant="bordered"
            />
            <Input
              size="sm"
              type="date"
              label="Date"
              value={formData.date}
              onValueChange={(v) => setFormData({ ...formData, date: v })}
              variant="bordered"
            />
            <Select
              size="sm"
              label="Holiday Type"
              variant="bordered"
              selectedKeys={[formData.holidayType]}
              onChange={(e) => setFormData({ ...formData, holidayType: e.target.value })}
            >
              <SelectItem key="National" value="National">National Holiday</SelectItem>
              <SelectItem key="Regional" value="Regional">Regional Holiday</SelectItem>
              <SelectItem key="School" value="School">School Holiday</SelectItem>
            </Select>
            <Input
              size="sm"
              label="Description (Optional)"
              placeholder="Additional details"
              value={formData.description}
              onValueChange={(v) => setFormData({ ...formData, description: v })}
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Cancel</Button>
            <Button 
              color="primary" 
              onPress={handleSave}
              isDisabled={!formData.title.trim() || !formData.date}
              isLoading={saving}
            >
              {editingHoliday ? "Update" : "Add"} Holiday
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
