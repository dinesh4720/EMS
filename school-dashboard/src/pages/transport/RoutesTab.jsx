import { useState, useEffect, useMemo } from "react";
import { Button, Input, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Plus, Search, MoreVertical, MapPin, Users, Edit2, Trash2, UserPlus } from "lucide-react";
import { transportApi } from "../../services/api";
import { useApp } from "../../context/AppContext";
import { CURRENT_ACADEMIC_YEAR } from "../../utils/constants";
import toast from "react-hot-toast";
import RouteModal from "./RouteModal";
import StudentAssignModal from "./StudentAssignModal";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function RoutesTab() {
  const { t } = useTranslation();
  const { schoolSettings } = useApp();
  const academicYear = schoolSettings?.academicYear || CURRENT_ACADEMIC_YEAR;

  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal state
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [assigningRoute, setAssigningRoute] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [routesRes, vehiclesRes] = await Promise.all([
        transportApi.getRoutes({ academicYear }),
        transportApi.getVehicles(),
      ]);
      setRoutes(routesRes?.data || []);
      setVehicles(vehiclesRes?.data || []);
    } catch (error) {
      console.error('Failed to load transport data:', error);
      toast.error(t('toast.error.failedToLoadRoutes'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [academicYear]);

  const filtered = useMemo(() => {
    let list = routes;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.routeName.toLowerCase().includes(q) || r.routeNumber.toLowerCase().includes(q));
    }
    return list;
  }, [routes, statusFilter, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await transportApi.deleteRoute(deleteTarget._id);
      toast.success(t('toast.success.routeDeleted'));
      fetchData();
    } catch (error) {
      console.error('Failed to delete route:', error);
      toast.error(t('toast.error.failedToDeleteRoute'));
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setIsRouteModalOpen(true);
  };

  const handleAssignStudents = (route) => {
    setAssigningRoute(route);
    setIsStudentModalOpen(true);
  };

  if (loading) return <TablePageSkeleton title={false} kpiCards={0} columns={5} rows={5} />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center flex-1 w-full sm:w-auto">
          <Input
            placeholder={t('pages.searchRoutes')}
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
            </DropdownMenu>
          </Dropdown>
        </div>
        <Button
          color="primary"
          size="sm"
          startContent={<Plus size={16} />}
          onPress={() => { setEditingRoute(null); setIsRouteModalOpen(true); }}
        >
          Add Route
        </Button>
      </div>

      {/* Route Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-zinc-400">
          <MapPin size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t('pages.noRoutesFound')}</p>
          <p className="text-sm mt-1">{t('pages.createYourFirstTransportRouteToGetStarted')}</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((route) => (
            <div
              key={route._id}
              className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100">{route.routeName}</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">#{route.routeNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Chip size="sm" variant="flat" color={route.status === "active" ? "success" : "default"}>
                    {route.status}
                  </Chip>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light"><MoreVertical size={16} /></Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem key="edit" startContent={<Edit2 size={14} />} onPress={() => handleEdit(route)}>{t('pages.edit1')}</DropdownItem>
                      <DropdownItem key="assign" startContent={<UserPlus size={14} />} onPress={() => handleAssignStudents(route)}>{t('pages.assignStudents')}</DropdownItem>
                      <DropdownItem key="delete" startContent={<Trash2 size={14} />} className="text-danger" color="danger" onPress={() => setDeleteTarget(route)}>{t('pages.delete1')}</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>

              {/* Vehicle info */}
              {route.vehicleId && (
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">
                  Vehicle: {route.vehicleId.registrationNumber} ({route.vehicleId.make} {route.vehicleId.model})
                </p>
              )}

              {/* Stats row */}
              {(() => {
                const studentCount = route.students?.length || 0;
                const capacity = route.vehicleId?.capacity;
                const isOverCapacity = capacity && studentCount > capacity;
                const isNearCapacity = capacity && !isOverCapacity && studentCount >= capacity * 0.9;
                return (
                  <>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-300">
                        <MapPin size={14} />
                        <span>{route.stops?.length || 0} stops</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${isOverCapacity ? 'text-red-600 dark:text-red-400 font-medium' : isNearCapacity ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-zinc-300'}`}>
                        <Users size={14} />
                        <span>{studentCount}{capacity ? `/${capacity}` : ''} students</span>
                      </div>
                    </div>
                    {isOverCapacity && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                        ⚠ Over capacity by {studentCount - capacity} student{studentCount - capacity > 1 ? 's' : ''}
                      </p>
                    )}
                    {isNearCapacity && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Near capacity ({capacity - studentCount} seat{capacity - studentCount !== 1 ? 's' : ''} remaining)
                      </p>
                    )}
                  </>
                );
              })()}

              {/* Stops preview */}
              {route.stops?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-50 dark:border-zinc-800">
                  <div className="flex flex-wrap gap-1.5">
                    {route.stops.slice(0, 4).map((stop) => (
                      <span key={stop._id} className="text-xs px-2 py-0.5 rounded-full bg-gray-50 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400">
                        {stop.name}
                      </span>
                    ))}
                    {route.stops.length > 4 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400">
                        +{route.stops.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <RouteModal
        isOpen={isRouteModalOpen}
        onClose={() => { setIsRouteModalOpen(false); setEditingRoute(null); }}
        route={editingRoute}
        vehicles={vehicles}
        academicYear={academicYear}
        onSaved={fetchData}
      />

      <StudentAssignModal
        isOpen={isStudentModalOpen}
        onClose={() => { setIsStudentModalOpen(false); setAssigningRoute(null); }}
        route={assigningRoute}
        onSaved={fetchData}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirm.deleteRoute', { name: deleteTarget?.routeName || '' })}
        message={t('confirm.deleteRoute', { name: deleteTarget?.routeName || '' })}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
