import { useState, useEffect, useMemo } from "react";
import { Button, Input, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Plus, Search, MoreVertical, Truck, Edit2, Trash2 } from "lucide-react";
import { transportApi } from "../../services/api";
import toast from "react-hot-toast";
import VehicleModal from "./VehicleModal";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';

export default function VehiclesTab() {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await transportApi.getVehicles();
      setVehicles(res?.data || []);
    } catch {
      toast.error(t('toast.error.failedToLoadVehicles'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const filtered = useMemo(() => {
    let list = vehicles;
    if (statusFilter !== "all") list = list.filter((v) => v.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        v.registrationNumber?.toLowerCase().includes(q) ||
        v.make?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.driver?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [vehicles, statusFilter, search]);

  const handleDelete = async (vehicle) => {
    if (!confirm(t('confirm.deleteVehicle', { regNum: vehicle.registrationNumber }))) return;
    try {
      await transportApi.deleteVehicle(vehicle._id);
      toast.success(t('toast.success.vehicleDeleted'));
      fetchVehicles();
    } catch {
      toast.error(t('toast.error.failedToDeleteVehicle'));
    }
  };

  const statusColorMap = { active: "success", inactive: "default", maintenance: "warning" };

  if (loading) return <TablePageSkeleton title={false} kpiCards={0} columns={5} rows={5} />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center flex-1 w-full sm:w-auto">
          <Input
            placeholder={t('pages.searchVehicles')}
            value={search}
            onValueChange={setSearch}
            startContent={<Search size={16} className="text-gray-400" />}
            size="sm"
            className="max-w-xs"
          />
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="flat">
                {statusFilter === "all" ? "All Status" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              selectionMode="single"
              selectedKeys={new Set([statusFilter])}
              onSelectionChange={(keys) => setStatusFilter([...keys][0])}
            >
              <DropdownItem key="all">{t('pages.allStatus1')}</DropdownItem>
              <DropdownItem key="active">{t('pages.active')}</DropdownItem>
              <DropdownItem key="inactive">{t('pages.inactive')}</DropdownItem>
              <DropdownItem key="maintenance">{t('pages.maintenance')}</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
        <Button
          color="primary"
          size="sm"
          startContent={<Plus size={16} />}
          onPress={() => { setEditingVehicle(null); setIsModalOpen(true); }}
        >
          Add Vehicle
        </Button>
      </div>

      {/* Vehicle Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-zinc-400">
          <Truck size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t('pages.noVehiclesFound')}</p>
          <p className="text-sm mt-1">{t('pages.addYourFirstVehicleToTheFleet')}</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((vehicle) => (
            <div
              key={vehicle._id}
              className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100">{vehicle.registrationNumber}</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ") || "No details"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Chip size="sm" variant="flat" color={statusColorMap[vehicle.status] || "default"}>
                    {vehicle.status}
                  </Chip>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light"><MoreVertical size={16} /></Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem key="edit" startContent={<Edit2 size={14} />} onPress={() => { setEditingVehicle(vehicle); setIsModalOpen(true); }}>{t('pages.edit1')}</DropdownItem>
                      <DropdownItem key="delete" startContent={<Trash2 size={14} />} className="text-danger" color="danger" onPress={() => handleDelete(vehicle)}>{t('pages.delete1')}</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>

              {/* Capacity */}
              {vehicle.capacity && (
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">Capacity: {vehicle.capacity} seats</p>
              )}

              {/* Driver & Conductor */}
              <div className="mt-3 pt-3 border-t border-gray-50 dark:border-zinc-800 space-y-1.5">
                {vehicle.driver?.name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-zinc-400">{t('pages.driver')}</span>
                    <span className="text-gray-900 dark:text-zinc-100 font-medium">{vehicle.driver.name}</span>
                  </div>
                )}
                {vehicle.conductor?.name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-zinc-400">{t('pages.conductor')}</span>
                    <span className="text-gray-900 dark:text-zinc-100 font-medium">{vehicle.conductor.name}</span>
                  </div>
                )}
                {!vehicle.driver?.name && !vehicle.conductor?.name && (
                  <p className="text-xs text-gray-400 dark:text-zinc-500 italic">{t('pages.noStaffAssigned')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingVehicle(null); }}
        vehicle={editingVehicle}
        onSaved={fetchVehicles}
      />
    </div>
  );
}
