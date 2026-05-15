import { useState, useEffect, useMemo } from "react";
import { Button, Input, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Plus, Search, MoreVertical, Truck, Edit2, Trash2 } from "lucide-react";
import { transportApi } from "../../services/api";
import toast from "react-hot-toast";
import VehicleModal from "./VehicleModal";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import logger from '../../utils/logger';

export default function VehiclesTab() {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await transportApi.getVehicles();
      setVehicles(res?.data || []);
    } catch (error) {
      logger.error('Failed to load vehicles:', error);
      setLoadError(error);
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
        v.driverId?.name?.toLowerCase().includes(q) ||
        v.conductorId?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [vehicles, statusFilter, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await transportApi.deleteVehicle(deleteTarget._id);
      toast.success(t('toast.success.vehicleDeleted'));
      fetchVehicles();
    } catch {
      toast.error(t('toast.error.failedToDeleteVehicle'));
    } finally {
      setDeleteTarget(null);
    }
  };

  const statusColorMap = { active: "success", inactive: "default", maintenance: "warning" };

  if (loading) return <TablePageSkeleton title={false} kpiCards={0} columns={5} rows={5} />;
  if (loadError) {
    return (
      <ErrorState
        title={t('pages.failedToLoadVehicles', { defaultValue: 'Failed to load vehicles' })}
        error={loadError}
        onRetry={fetchVehicles}
      />
    );
  }

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
        <EmptyState
          icon={Truck}
          size="lg"
          title={t('pages.noVehiclesFound')}
          description={
            vehicles.length === 0
              ? t('pages.addYourFirstVehicleToTheFleet')
              : t('pages.noResultsMatchYourFilters', { defaultValue: 'No results match your filters' })
          }
          action={
            vehicles.length === 0 ? (
              <Button
                color="primary"
                size="sm"
                startContent={<Plus size={16} />}
                onPress={() => { setEditingVehicle(null); setIsModalOpen(true); }}
              >
                Add Vehicle
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((vehicle) => (
            <div
              key={vehicle._id}
              className="bg-surface border border-divider rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-fg">{vehicle.registrationNumber}</h3>
                  <p className="text-xs text-fg-muted mt-0.5">
                    {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ") || "No details"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Chip size="sm" variant="flat" color={statusColorMap[vehicle.status] || "default"}>
                    {vehicle.status}
                  </Chip>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light" aria-label="Vehicle actions"><MoreVertical size={16} /></Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem key="edit" startContent={<Edit2 size={14} />} onPress={() => { setEditingVehicle(vehicle); setIsModalOpen(true); }}>{t('pages.edit1')}</DropdownItem>
                      <DropdownItem key="delete" startContent={<Trash2 size={14} />} className="text-danger" color="danger" onPress={() => setDeleteTarget(vehicle)}>{t('pages.delete1')}</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>

              {/* Capacity */}
              {vehicle.capacity && (
                <p className="text-xs text-fg-muted mb-2">Capacity: {vehicle.capacity} seats</p>
              )}

              {/* Driver & Conductor */}
              <div className="mt-3 pt-3 border-t border-divider space-y-1.5">
                {vehicle.driverId?.name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-fg-muted">{t('pages.driver')}</span>
                    <span className="text-fg font-medium">
                      {vehicle.driverId.name}
                      {vehicle.driverId.status && vehicle.driverId.status !== 'active' && (
                        <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">({vehicle.driverId.status})</span>
                      )}
                    </span>
                  </div>
                )}
                {vehicle.conductorId?.name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-fg-muted">{t('pages.conductor')}</span>
                    <span className="text-fg font-medium">
                      {vehicle.conductorId.name}
                      {vehicle.conductorId.status && vehicle.conductorId.status !== 'active' && (
                        <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">({vehicle.conductorId.status})</span>
                      )}
                    </span>
                  </div>
                )}
                {!vehicle.driverId?.name && !vehicle.conductorId?.name && (
                  <p className="text-xs text-fg-faint italic">{t('pages.noStaffAssigned')}</p>
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirm.deleteVehicle', { regNum: deleteTarget?.registrationNumber || '' })}
        message={t('confirm.deleteVehicle', { regNum: deleteTarget?.registrationNumber || '' })}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
