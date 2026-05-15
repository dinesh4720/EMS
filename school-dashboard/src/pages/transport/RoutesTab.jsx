import { useState, useEffect, useMemo } from "react";
import { Button, Input, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Plus, Search, MoreVertical, MapPin, Users, Edit2, Trash2, UserPlus, Bus, Route as RouteIcon } from "lucide-react";
import { transportApi } from "../../services/api";
import { useApp } from "../../context/AppContext";
import { CURRENT_ACADEMIC_YEAR } from "../../utils/constants";
import toast from "react-hot-toast";
import RouteModal from "./RouteModal";
import StudentAssignModal from "./StudentAssignModal";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import logger from '../../utils/logger';


export default function RoutesTab() {
  const { t } = useTranslation();
  const { schoolSettings } = useApp();
  const academicYear = schoolSettings?.academicYear || CURRENT_ACADEMIC_YEAR;

  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
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
      setLoadError(null);
      const [routesRes, vehiclesRes] = await Promise.all([
        transportApi.getRoutes({ academicYear }),
        transportApi.getVehicles(),
      ]);
      setRoutes(routesRes?.data || []);
      setVehicles(vehiclesRes?.data || []);
    } catch (error) {
      logger.error('Failed to load transport data:', error);
      setLoadError(error);
      toast.error(t('toast.error.failedToLoadRoutes'));
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh — updates route data in the background without showing the skeleton loader.
  // Used after student assign/remove so route card counts update without disrupting the open modal.
  const silentRefresh = async () => {
    try {
      const [routesRes, vehiclesRes] = await Promise.all([
        transportApi.getRoutes({ academicYear }),
        transportApi.getVehicles(),
      ]);
      setRoutes(routesRes?.data || []);
      setVehicles(vehiclesRes?.data || []);
    } catch (error) {
      logger.error('Failed to refresh transport data:', error);
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
      logger.error('Failed to delete route:', error);
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

  // Compute stats from real data — "buses on route" = distinct vehicles assigned to active routes
  const stats = useMemo(() => {
    const activeRoutes = routes.filter((r) => r.status === 'active');
    const busesOnRouteIds = new Set(
      activeRoutes
        .map((r) => r.vehicleId?._id?.toString() || r.vehicleId?.toString())
        .filter(Boolean)
    );
    const totalStudents = routes.reduce((sum, r) => sum + (r.students?.length || 0), 0);
    return {
      totalRoutes: routes.length,
      activeRoutes: activeRoutes.length,
      busesOnRoute: busesOnRouteIds.size,
      totalStudents,
    };
  }, [routes]);

  if (loading) return <TablePageSkeleton title={false} kpiCards={4} columns={5} rows={5} />;
  if (loadError) {
    return (
      <ErrorState
        title={t('pages.failedToLoadTransportData', { defaultValue: 'Failed to load transport data' })}
        error={loadError}
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('pages.totalRoutes')} value={stats.totalRoutes} icon={RouteIcon} color="blue" />
        <StatCard label={t('pages.activeRoutes')} value={stats.activeRoutes} icon={RouteIcon} color="green" />
        <StatCard
          label={t('pages.busesOnRoute')}
          value={stats.busesOnRoute}
          icon={Bus}
          color="amber"
          subtext={t('pages.ofTotalVehicles', { count: vehicles.length })}
        />
        <StatCard label={t('pages.totalStudents1')} value={stats.totalStudents} icon={Users} color="purple" />
      </div>

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
                {statusFilter === "all" ? t('pages.allStatus1') : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
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
          {t('pages.addRoute')}
        </Button>
      </div>

      {/* Route Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={MapPin}
          size="lg"
          title={t('pages.noRoutesFound')}
          description={
            routes.length === 0
              ? t('pages.createYourFirstTransportRouteToGetStarted')
              : t('pages.noResultsMatchYourFilters', { defaultValue: 'No results match your filters' })
          }
          action={
            routes.length === 0 ? (
              <Button
                color="primary"
                size="sm"
                startContent={<Plus size={16} />}
                onPress={() => { setEditingRoute(null); setIsRouteModalOpen(true); }}
              >
                {t('pages.addRoute')}
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((route) => (
            <div
              key={route._id}
              className="bg-surface border border-divider rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-fg">{route.routeName}</h3>
                  <p className="text-xs text-fg-muted mt-0.5">#{route.routeNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Chip size="sm" variant="flat" color={route.status === "active" ? "success" : "default"}>
                    {route.status}
                  </Chip>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light" aria-label={t('pages.routeActions')}><MoreVertical size={16} /></Button>
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
                <p className="text-xs text-fg-muted mb-2">
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
                      <div className="flex items-center gap-1.5 text-fg">
                        <MapPin size={14} />
                        <span>{route.stops?.length || 0} stops</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${isOverCapacity ? 'text-red-600 dark:text-red-400 font-medium' : isNearCapacity ? 'text-amber-600 dark:text-amber-400' : 'text-fg'}`}>
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
                <div className="mt-3 pt-3 border-t border-divider">
                  <div className="flex flex-wrap gap-1.5">
                    {route.stops.slice(0, 4).map((stop) => (
                      <span key={stop._id} className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-fg-muted">
                        {stop.name}
                      </span>
                    ))}
                    {route.stops.length > 4 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-fg-muted">
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
        onSaved={silentRefresh}
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
