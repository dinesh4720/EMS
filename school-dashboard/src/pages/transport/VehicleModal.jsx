import { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, SelectItem, Textarea, Divider,
} from "@heroui/react";
import { transportApi, staffApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

export default function VehicleModal({ isOpen, onClose, vehicle, onSaved }) {
  const { t } = useTranslation();
  const isEdit = !!vehicle;

  const [form, setForm] = useState({
    registrationNumber: "",
    make: "",
    model: "",
    year: "",
    capacity: "",
    color: "",
    status: "active",
    notes: "",
    driverId: "",
    conductorId: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (vehicle) {
        setForm({
          registrationNumber: vehicle.registrationNumber || "",
          make: vehicle.make || "",
          model: vehicle.model || "",
          year: vehicle.year?.toString() || "",
          capacity: vehicle.capacity?.toString() || "",
          color: vehicle.color || "",
          status: vehicle.status || "active",
          notes: vehicle.notes || "",
          driverId: vehicle.driverId?._id || vehicle.driverId || "",
          conductorId: vehicle.conductorId?._id || vehicle.conductorId || "",
        });
      } else {
        setForm({
          registrationNumber: "", make: "", model: "", year: "", capacity: "", color: "",
          status: "active", notes: "", driverId: "", conductorId: "",
        });
      }
    }
  }, [isOpen, vehicle]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setStaffLoading(true);
    staffApi.getAll()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : res?.data || [];
        // Filter to active staff only for new assignments
        setStaffList(list.filter((s) => s.status !== 'terminated' && s.status !== 'suspended'));
      })
      .catch(() => {
        if (!cancelled) toast.error(t('toast.error.failedToLoadStaff'));
      })
      .finally(() => {
        if (!cancelled) setStaffLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, t]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };

  const handleSave = async () => {
    if (!form.registrationNumber.trim()) {
      setErrors({ registrationNumber: t('toast.error.registrationNumberIsRequired') });
      toast.error(t('toast.error.registrationNumberIsRequired'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        registrationNumber: form.registrationNumber.trim(),
        make: form.make.trim() || undefined,
        model: form.model.trim() || undefined,
        year: form.year ? Number(form.year) : undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        color: form.color.trim() || undefined,
        status: form.status,
        notes: form.notes.trim() || undefined,
        driverId: form.driverId || undefined,
        conductorId: form.conductorId || undefined,
      };

      if (isEdit) {
        await transportApi.updateVehicle(vehicle._id, payload);
        toast.success(t('toast.success.vehicleUpdated'));
      } else {
        await transportApi.createVehicle(payload);
        toast.success(t('toast.success.vehicleCreated'));
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  const renderStaffLabel = (staff) => {
    if (!staff) return '';
    const roles = Array.isArray(staff.role) ? staff.role.join(', ') : staff.role || '';
    return `${staff.name}${staff.code ? ` (${staff.code})` : ''}${roles ? ` — ${roles}` : ''}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setErrors({}); }} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{isEdit ? "Edit Vehicle" : "Add Vehicle"}</ModalHeader>
        <ModalBody className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('pages.registrationNumber')}
              placeholder={t('transport.regNumberPlaceholder')}
              value={form.registrationNumber}
              onValueChange={(v) => updateField("registrationNumber", v)}
              isRequired
              isInvalid={!!errors.registrationNumber}
              errorMessage={errors.registrationNumber}
            />
            <Select
              label={t('pages.status2')}
              selectedKeys={[form.status]}
              onSelectionChange={(keys) => updateField("status", [...keys][0])}
            >
              <SelectItem key="active">{t('pages.active')}</SelectItem>
              <SelectItem key="inactive">{t('pages.inactive')}</SelectItem>
              <SelectItem key="maintenance">{t('pages.maintenance')}</SelectItem>
            </Select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label={t('pages.make')} placeholder={t('transport.makePlaceholder')} value={form.make} onValueChange={(v) => updateField("make", v)} />
            <Input label={t('pages.model')} placeholder={t('transport.modelPlaceholder')} value={form.model} onValueChange={(v) => updateField("model", v)} />
            <Input label={t('pages.year1')} placeholder={t('transport.yearPlaceholder')} type="number" value={form.year} onValueChange={(v) => updateField("year", v)} />
            <Input label={t('pages.capacity')} placeholder={t('transport.capacityPlaceholder')} type="number" value={form.capacity} onValueChange={(v) => updateField("capacity", v)} />
          </div>

          <Input label={t('pages.color')} placeholder={t('transport.colorPlaceholder')} value={form.color} onValueChange={(v) => updateField("color", v)} />

          <Textarea
            label={t('pages.notes1')}
            placeholder={t('pages.optionalNotes')}
            value={form.notes}
            onValueChange={(v) => updateField("notes", v)}
            minRows={2}
          />

          <Divider />

          {/* Driver */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-3">{t('pages.driverDetails')}</h3>
            <Select
              label={t('pages.driver')}
              placeholder={t('pages.selectDriver')}
              selectedKeys={form.driverId ? [form.driverId] : []}
              onSelectionChange={(keys) => updateField("driverId", [...keys][0] || "")}
              isLoading={staffLoading}
            >
              <SelectItem key="">{t('pages.none')}</SelectItem>
              {staffList.map((staff) => (
                <SelectItem key={staff._id || staff.id}>
                  {renderStaffLabel(staff)}
                </SelectItem>
              ))}
            </Select>
          </div>

          <Divider />

          {/* Conductor */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-3">{t('pages.conductorDetails')}</h3>
            <Select
              label={t('pages.conductor')}
              placeholder={t('pages.selectConductor')}
              selectedKeys={form.conductorId ? [form.conductorId] : []}
              onSelectionChange={(keys) => updateField("conductorId", [...keys][0] || "")}
              isLoading={staffLoading}
            >
              <SelectItem key="">{t('pages.none')}</SelectItem>
              {staffList.map((staff) => (
                <SelectItem key={staff._id || staff.id}>
                  {renderStaffLabel(staff)}
                </SelectItem>
              ))}
            </Select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>{t('pages.cancel2')}</Button>
          <Button color="primary" onPress={handleSave} isLoading={saving}>
            {isEdit ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
