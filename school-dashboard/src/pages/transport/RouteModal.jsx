import { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, SelectItem, Textarea, Divider,
} from "@heroui/react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { transportApi } from "../../services/api";
import toast from "react-hot-toast";

const EMPTY_STOP = { name: "", address: "", pickupTime: "", dropTime: "" };

export default function RouteModal({ isOpen, onClose, route, vehicles, academicYear, onSaved }) {
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

  useEffect(() => {
    if (isOpen) {
      if (route) {
        setForm({
          routeName: route.routeName || "",
          routeNumber: route.routeNumber || "",
          vehicleId: route.vehicleId?._id || route.vehicleId || "",
          status: route.status || "active",
          notes: route.notes || "",
          stops: route.stops?.map((s) => ({
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

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateStop = (index, field, value) => {
    setForm((prev) => {
      const stops = [...prev.stops];
      stops[index] = { ...stops[index], [field]: value };
      return { ...prev, stops };
    });
  };

  const addStop = () => setForm((prev) => ({ ...prev, stops: [...prev.stops, { ...EMPTY_STOP }] }));

  const removeStop = (index) => {
    setForm((prev) => ({ ...prev, stops: prev.stops.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!form.routeName.trim() || !form.routeNumber.trim()) {
      toast.error("Route name and number are required");
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
        toast.success("Route updated");
      } else {
        await transportApi.createRoute(payload);
        toast.success("Route created");
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
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{isEdit ? "Edit Route" : "Add Route"}</ModalHeader>
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Route Name"
              placeholder="e.g. North Route"
              value={form.routeName}
              onValueChange={(v) => updateField("routeName", v)}
              isRequired
            />
            <Input
              label="Route Number"
              placeholder="e.g. R001"
              value={form.routeNumber}
              onValueChange={(v) => updateField("routeNumber", v)}
              isRequired
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Vehicle"
              placeholder="Select vehicle"
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
              label="Status"
              selectedKeys={[form.status]}
              onSelectionChange={(keys) => updateField("status", [...keys][0])}
            >
              <SelectItem key="active">Active</SelectItem>
              <SelectItem key="inactive">Inactive</SelectItem>
            </Select>
          </div>

          <Textarea
            label="Notes"
            placeholder="Optional notes about this route"
            value={form.notes}
            onValueChange={(v) => updateField("notes", v)}
            minRows={2}
          />

          <Divider />

          {/* Stops */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Stops</h3>
              <Button size="sm" variant="flat" startContent={<Plus size={14} />} onPress={addStop}>
                Add Stop
              </Button>
            </div>

            {form.stops.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-4">No stops added yet</p>
            ) : (
              <div className="space-y-3">
                {form.stops.map((stop, index) => (
                  <div key={index} className="flex gap-2 items-start bg-gray-50 dark:bg-zinc-900 rounded-lg p-3">
                    <div className="pt-2 text-gray-400">
                      <GripVertical size={14} />
                    </div>
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Input
                        size="sm"
                        placeholder="Stop name"
                        value={stop.name}
                        onValueChange={(v) => updateStop(index, "name", v)}
                      />
                      <Input
                        size="sm"
                        placeholder="Address"
                        value={stop.address}
                        onValueChange={(v) => updateStop(index, "address", v)}
                      />
                      <Input
                        size="sm"
                        placeholder="Pickup time"
                        type="time"
                        value={stop.pickupTime}
                        onValueChange={(v) => updateStop(index, "pickupTime", v)}
                      />
                      <Input
                        size="sm"
                        placeholder="Drop time"
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
          <Button variant="flat" onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={handleSave} isLoading={saving}>
            {isEdit ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
