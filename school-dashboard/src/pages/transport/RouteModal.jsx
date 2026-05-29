import { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, SelectItem, Textarea, Divider,
} from "@heroui/react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { transportApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { routeSchema, parseFormSchema } from '../../validators/formSchemas';

const makeStop = () => ({ _key: `stop-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: "", address: "", pickupTime: "", dropTime: "" });

export default function RouteModal({ isOpen, onClose, route, vehicles, academicYear, onSaved }) {
  const { t } = useTranslation();
  const isEdit = !!route;

  const [form, setForm] = useState({
    routeName: "",
    routeNumber: "",
    vehicleId: "",
    status: "active",
    notes: "",
    stops: [],
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (route) {
        setForm({
          routeName: route.routeName || "",
          routeNumber: route.routeNumber || "",
          vehicleId: route.vehicleId?._id || route.vehicleId || "",
          status: route.status || "active",
          notes: route.notes || "",
          stops: route.stops?.map((s, i) => ({
            _key: `stop-${s._id || `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`}`,
            name: s.name || "",
            address: s.address || "",
            pickupTime: s.pickupTime || "",
            dropTime: s.dropTime || "",
          })) || [],
        });
      } else {
        setForm({ routeName: "", routeNumber: "", vehicleId: "", status: "active", notes: "", stops: [] });
      }
    }
  }, [isOpen, route]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };

  const updateStop = (index, field, value) => {
    setForm((prev) => {
      const stops = [...prev.stops];
      stops[index] = { ...stops[index], [field]: value };
      return { ...prev, stops };
    });
  };

  const addStop = () => setForm((prev) => ({ ...prev, stops: [...prev.stops, makeStop()] }));

  const removeStop = (index) => {
    setForm((prev) => ({ ...prev, stops: prev.stops.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    const { success, errors: zodErrors } = parseFormSchema(routeSchema, form);
    if (!success) {
      setErrors(zodErrors);
      toast.error(Object.values(zodErrors)[0] || t('toast.error.routeNameAndNumberAreRequired'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        routeName: form.routeName.trim(),
        routeNumber: form.routeNumber.trim(),
        academicYear,
        status: form.status,
        notes: form.notes.trim() || undefined,
        vehicleId: form.vehicleId || undefined,
        stops: form.stops
          .filter((s) => s.name.trim())
          .map((s, i) => ({ ...s, name: s.name.trim(), order: i })),
      };

      if (isEdit) {
        await transportApi.updateRoute(route._id, payload);
        toast.success(t('toast.success.routeUpdated'));
      } else {
        await transportApi.createRoute(payload);
        toast.success(t('toast.success.routeCreated'));
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to save route");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setErrors({}); }} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{isEdit ? "Edit Route" : "Add Route"}</ModalHeader>
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('pages.routeName')}
              placeholder={t('transport.routeNamePlaceholder')}
              value={form.routeName}
              onValueChange={(v) => updateField("routeName", v)}
              isRequired
              isInvalid={!!errors.routeName}
              errorMessage={errors.routeName}
            />
            <Input
              label={t('pages.routeNumber')}
              placeholder={t('transport.routeNumberPlaceholder')}
              value={form.routeNumber}
              onValueChange={(v) => updateField("routeNumber", v)}
              isRequired
              isInvalid={!!errors.routeNumber}
              errorMessage={errors.routeNumber}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('pages.vehicle')}
              placeholder={t('pages.selectVehicle')}
              selectedKeys={form.vehicleId ? [form.vehicleId] : []}
              onSelectionChange={(keys) => updateField("vehicleId", [...keys][0] || "")}
            >
              {(vehicles || []).filter((v) => v.status === "active").map((v) => (
                <SelectItem key={v._id}>
                  {v.registrationNumber} {v.make ? `(${v.make} ${v.model || ""})` : ""}
                </SelectItem>
              ))}
            </Select>
            <Select
              label={t('pages.status2')}
              selectedKeys={[form.status]}
              onSelectionChange={(keys) => updateField("status", [...keys][0])}
            >
              <SelectItem key="active">{t('pages.active')}</SelectItem>
              <SelectItem key="inactive">{t('pages.inactive')}</SelectItem>
            </Select>
          </div>

          <Textarea
            label={t('pages.notes1')}
            placeholder={t('pages.optionalNotesAboutThisRoute')}
            value={form.notes}
            onValueChange={(v) => updateField("notes", v)}
            minRows={2}
          />

          <Divider />

          {/* Stops */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-fg">{t('pages.stops')}</h3>
              <Button size="sm" variant="flat" startContent={<Plus size={14} />} onPress={addStop}>
                {t('pages.addStop')}
              </Button>
            </div>

            {form.stops.length === 0 ? (
              <p className="text-sm text-fg-faint text-center py-4">{t('pages.noStopsAddedYet')}</p>
            ) : (
              <div className="space-y-3">
                {form.stops.map((stop, index) => (
                  <div key={stop._key} className="flex gap-2 items-start bg-surface-2 rounded-lg p-3">
                    <div className="pt-2 text-fg-faint">
                      <GripVertical size={14} />
                    </div>
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Input
                        size="sm"
                        placeholder={t('pages.stopName')}
                        value={stop.name}
                        onValueChange={(v) => updateStop(index, "name", v)}
                      />
                      <Input
                        size="sm"
                        placeholder={t('pages.address2')}
                        value={stop.address}
                        onValueChange={(v) => updateStop(index, "address", v)}
                      />
                      <Input
                        size="sm"
                        placeholder={t('pages.pickupTime')}
                        type="time"
                        value={stop.pickupTime}
                        onValueChange={(v) => updateStop(index, "pickupTime", v)}
                      />
                      <Input
                        size="sm"
                        placeholder={t('pages.dropTime')}
                        type="time"
                        value={stop.dropTime}
                        onValueChange={(v) => updateStop(index, "dropTime", v)}
                      />
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => removeStop(index)}
                      className="mt-0.5"
                      aria-label={t('pages.removeStop')}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
