import { useState, useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, SelectItem, Textarea, Divider,
} from "@heroui/react";
import { transportApi } from "../../services/api";
import toast from "react-hot-toast";

export default function VehicleModal({ isOpen, onClose, vehicle, onSaved }) {
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
    driver: { name: "", phone: "", licenseNumber: "", licenseExpiry: "" },
    conductor: { name: "", phone: "" },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
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
          driver: {
            name: vehicle.driver?.name || "",
            phone: vehicle.driver?.phone || "",
            licenseNumber: vehicle.driver?.licenseNumber || "",
            licenseExpiry: vehicle.driver?.licenseExpiry?.split("T")[0] || "",
          },
          conductor: {
            name: vehicle.conductor?.name || "",
            phone: vehicle.conductor?.phone || "",
          },
        });
      } else {
        setForm({
          registrationNumber: "", make: "", model: "", year: "", capacity: "", color: "",
          status: "active", notes: "",
          driver: { name: "", phone: "", licenseNumber: "", licenseExpiry: "" },
          conductor: { name: "", phone: "" },
        });
      }
    }
  }, [isOpen, vehicle]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateDriver = (field, value) =>
    setForm((prev) => ({ ...prev, driver: { ...prev.driver, [field]: value } }));

  const updateConductor = (field, value) =>
    setForm((prev) => ({ ...prev, conductor: { ...prev.conductor, [field]: value } }));

  const handleSave = async () => {
    if (!form.registrationNumber.trim()) {
      toast.error("Registration number is required");
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
      };

      // Only include driver/conductor if any field is filled
      if (form.driver.name || form.driver.phone || form.driver.licenseNumber) {
        payload.driver = {
          name: form.driver.name.trim() || undefined,
          phone: form.driver.phone.trim() || undefined,
          licenseNumber: form.driver.licenseNumber.trim() || undefined,
          licenseExpiry: form.driver.licenseExpiry || undefined,
        };
      }
      if (form.conductor.name || form.conductor.phone) {
        payload.conductor = {
          name: form.conductor.name.trim() || undefined,
          phone: form.conductor.phone.trim() || undefined,
        };
      }

      if (isEdit) {
        await transportApi.updateVehicle(vehicle._id, payload);
        toast.success("Vehicle updated");
      } else {
        await transportApi.createVehicle(payload);
        toast.success("Vehicle created");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{isEdit ? "Edit Vehicle" : "Add Vehicle"}</ModalHeader>
        <ModalBody className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Registration Number"
              placeholder="e.g. KA-01-AB-1234"
              value={form.registrationNumber}
              onValueChange={(v) => updateField("registrationNumber", v)}
              isRequired
            />
            <Select
              label="Status"
              selectedKeys={[form.status]}
              onSelectionChange={(keys) => updateField("status", [...keys][0])}
            >
              <SelectItem key="active">Active</SelectItem>
              <SelectItem key="inactive">Inactive</SelectItem>
              <SelectItem key="maintenance">Maintenance</SelectItem>
            </Select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="Make" placeholder="e.g. Tata" value={form.make} onValueChange={(v) => updateField("make", v)} />
            <Input label="Model" placeholder="e.g. Starbus" value={form.model} onValueChange={(v) => updateField("model", v)} />
            <Input label="Year" placeholder="2024" type="number" value={form.year} onValueChange={(v) => updateField("year", v)} />
            <Input label="Capacity" placeholder="40" type="number" value={form.capacity} onValueChange={(v) => updateField("capacity", v)} />
          </div>

          <Input label="Color" placeholder="e.g. Yellow" value={form.color} onValueChange={(v) => updateField("color", v)} />

          <Textarea
            label="Notes"
            placeholder="Optional notes"
            value={form.notes}
            onValueChange={(v) => updateField("notes", v)}
            minRows={2}
          />

          <Divider />

          {/* Driver */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-3">Driver Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Driver Name" value={form.driver.name} onValueChange={(v) => updateDriver("name", v)} />
              <Input label="Phone" value={form.driver.phone} onValueChange={(v) => updateDriver("phone", v)} />
              <Input label="License Number" value={form.driver.licenseNumber} onValueChange={(v) => updateDriver("licenseNumber", v)} />
              <Input label="License Expiry" type="date" value={form.driver.licenseExpiry} onValueChange={(v) => updateDriver("licenseExpiry", v)} />
            </div>
          </div>

          <Divider />

          {/* Conductor */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-3">Conductor Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Conductor Name" value={form.conductor.name} onValueChange={(v) => updateConductor("name", v)} />
              <Input label="Phone" value={form.conductor.phone} onValueChange={(v) => updateConductor("phone", v)} />
            </div>
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
