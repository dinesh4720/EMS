import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardBody, CardHeader, Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem, Spinner } from "@heroui/react";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";
import { getDateLocale } from '../../i18n/index';
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';


export default function HolidaySettings() {
  const { t } = useTranslation();
  const { events, addEvent, updateEvent, deleteEvent, loading, currentAcademicYear } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    holidayType: "School",
    description: ""
  });
  const [saving, setSaving] = useState(false);
  // AUDIT-128: State-driven delete confirmation instead of confirm()
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Lazy loading state
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  const holidays = events.filter(e => e.type === "holiday");
  // AUDIT-122: Use spread to avoid mutating the context array
  const sortedHolidays = useMemo(() =>
    [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date)),
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

    // Academic year validation: date must fall within current academic year (Apr–Mar)
    const [startYearStr] = (currentAcademicYear || "").split("-");
    const startYear = parseInt(startYearStr, 10);
    if (startYear) {
      const ayStart = new Date(startYear, 3, 1); // April 1
      const ayEnd = new Date(startYear + 1, 2, 31); // March 31
      const selectedDate = new Date(formData.date);
      if (selectedDate < ayStart || selectedDate > ayEnd) {
        toast.error(`Date must be within academic year ${currentAcademicYear} (Apr ${startYear} – Mar ${startYear + 1})`);
        return;
      }
    }

    // Duplicate date validation: no two holidays on the same date
    const editingId = editingHoliday?._id || editingHoliday?.id;
    const duplicate = holidays.find(h => {
      const hId = h._id || h.id;
      return h.date === formData.date && hId !== editingId;
    });
    if (duplicate) {
      toast.error(`A holiday already exists on this date: "${duplicate.title}"`);
      return;
    }

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
        await updateEvent(editingHoliday._id || editingHoliday.id, holidayData);
        toast.success(t('toast.success.holidayUpdatedSuccessfully'));
      } else {
        await addEvent(holidayData);
        toast.success(t('toast.success.holidayAddedSuccessfully'));
      }
      onClose();
    } catch (error) {
      console.error('Failed to save holiday:', error);
      toast.error(t('toast.error.failedToSaveHoliday'));
    } finally {
      setSaving(false);
    }
  };

  // AUDIT-128: Replaced confirm() with state-driven confirmation
  const handleDelete = async (id) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      toast(t('confirm.deleteHoliday') + ' Click delete again to confirm.', { icon: '\u26A0\uFE0F', duration: 3000 });
      setTimeout(() => setPendingDeleteId(null), 3000);
      return;
    }
    setPendingDeleteId(null);
    try {
      await deleteEvent(id);
      toast.success(t('toast.success.holidayDeletedSuccessfully'));
    } catch (error) {
      console.error('Failed to delete holiday:', error);
      toast.error(t('toast.error.failedToDeleteHoliday'));
    }
  };

  const holidayTypeColors = {
    "National": "success",
    "Regional": "warning",
    "School": "primary"
  };

  if (loading) {
    return (
      <TablePageSkeleton />
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-default-800">{t('pages.holidayManagement')}</h2>
          <p className="text-sm text-default-500">{t('pages.manageSchoolHolidaysAndAcademicCalendar')}</p>
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
            <span className="text-xs text-success-700 uppercase tracking-wider">{t('pages.totalHolidays')}</span>
          </div>
          <p className="text-2xl font-semibold text-success-700">{holidays.length}</p>
        </div>

        <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-warning-600" />
            <span className="text-xs text-warning-700 uppercase tracking-wider">{t('pages.national')}</span>
          </div>
          <p className="text-2xl font-semibold text-warning-700">
            {holidays.filter(h => h.holidayType === "National").length}
          </p>
        </div>

        <div className="p-4 bg-default-50 rounded-lg border border-default-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-default-500" />
            <span className="text-xs text-default-500 uppercase tracking-wider">{t('pages.regional')}</span>
          </div>
          <p className="text-2xl font-semibold text-default-900">
            {holidays.filter(h => h.holidayType === "Regional").length}
          </p>
        </div>

        <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-primary-600" />
            <span className="text-xs text-primary-700 uppercase tracking-wider">{t('pages.school1')}</span>
          </div>
          <p className="text-2xl font-semibold text-primary-700">
            {holidays.filter(h => h.holidayType === "School").length}
          </p>
        </div>
      </div>

      <Card className="shadow-sm border border-default-200 rounded-lg">
        <CardBody className="p-0">
          <Table
            aria-label={t('aria.misc.holidays')}
            removeWrapper
            classNames={{
              base: "overflow-visible",
              th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200",
              td: "py-5 border-b border-default-100",
              tbody: "[&>tr:last-child>td]:border-none"
            }}
          >
            <TableHeader>
              <TableColumn scope="col">{t('pages.hOLIDAYName')}</TableColumn>
              <TableColumn scope="col">{t('pages.dATE')}</TableColumn>
              <TableColumn scope="col">{t('pages.tYPE')}</TableColumn>
              <TableColumn scope="col">{t('pages.dAY')}</TableColumn>
              <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No holidays added yet">
              {visibleHolidays.map((holiday) => {
                const date = new Date(holiday.date);
                const dayName = date.toLocaleDateString(getDateLocale(), { weekday: 'short' });
                return (
                  <TableRow key={holiday._id || holiday.id}>
                    <TableCell className="font-medium text-default-700">{holiday.title}</TableCell>
                    <TableCell className="text-sm text-default-600">
                      {date.toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'short', year: 'numeric' })}
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
                          onPress={() => handleDelete(holiday._id || holiday.id)}
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
              label={t('pages.holidayName')}
              placeholder={t('settings.holidayNamePlaceholder')}
              value={formData.title}
              onValueChange={(v) => setFormData({ ...formData, title: v })}
              variant="bordered"
            />
            <Input
              size="sm"
              type="date"
              label={t('pages.date2')}
              value={formData.date}
              onValueChange={(v) => setFormData({ ...formData, date: v })}
              variant="bordered"
            />
            <Select
              size="sm"
              label={t('pages.holidayType')}
              variant="bordered"
              selectedKeys={[formData.holidayType]}
              onChange={(e) => setFormData({ ...formData, holidayType: e.target.value })}
            >
              <SelectItem key="National" value="National">{t('pages.nationalHoliday')}</SelectItem>
              <SelectItem key="Regional" value="Regional">{t('pages.regionalHoliday')}</SelectItem>
              <SelectItem key="School" value="School">{t('pages.schoolHoliday')}</SelectItem>
            </Select>
            <Input
              size="sm"
              label={t('pages.descriptionOptional')}
              placeholder={t('pages.additionalDetails')}
              value={formData.description}
              onValueChange={(v) => setFormData({ ...formData, description: v })}
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>{t('pages.cancel2')}</Button>
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
