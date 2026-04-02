import { useState, useEffect, useMemo } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, SelectItem, Chip, Divider, Switch,
} from "@heroui/react";
import { Search, UserPlus, Trash2 } from "lucide-react";
import { transportApi } from "../../services/api";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function StudentAssignModal({
  isOpen, onClose, route, onSaved }) {
  const { t } = useTranslation();
  const { students: allStudents } = useApp();

  const [routeDetail, setRouteDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [assigning, setAssigning] = useState(false);

  // New assignment form
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStopId, setSelectedStopId] = useState("");
  const [pickupActive, setPickupActive] = useState(true);
  const [dropActive, setDropActive] = useState(true);
  const [removeTarget, setRemoveTarget] = useState(null);

  const fetchRouteDetail = async () => {
    if (!route?._id) return;
    try {
      setLoading(true);
      const res = await transportApi.getRoute(route._id);
      setRouteDetail(res?.data || null);
    } catch {
      toast.error(t('toast.error.failedToLoadRouteDetails'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && route) {
      fetchRouteDetail();
      setSelectedStudentId("");
      setSelectedStopId("");
      setPickupActive(true);
      setDropActive(true);
      setSearch("");
    }
  }, [isOpen, route?._id]);

  const assignedStudentIds = useMemo(
    () => new Set((routeDetail?.students || []).map((s) => s.studentId?._id || s.studentId)),
    [routeDetail]
  );

  const availableStudents = useMemo(() => {
    const list = (allStudents || []).filter((s) => !assignedStudentIds.has(s._id));
    if (search.trim()) {
      const q = search.toLowerCase();
      return list.filter((s) => s.name?.toLowerCase().includes(q) || s.admissionId?.toLowerCase().includes(q));
    }
    return list;
  }, [allStudents, assignedStudentIds, search]);

  const stops = routeDetail?.stops || [];

  const handleAssign = async () => {
    if (!selectedStudentId) {
      toast.error(t('toast.error.selectAStudent'));
      return;
    }
    setAssigning(true);
    try {
      const payload = {
        studentId: selectedStudentId,
        stopId: selectedStopId || undefined,
        pickupActive,
        dropActive,
      };
      const res = await transportApi.assignStudent(route._id, payload);
      if (res?.warning) toast(res.warning, { icon: "⚠️" });
      else toast.success(t('toast.success.studentAssigned'));
      setSelectedStudentId("");
      setSelectedStopId("");
      fetchRouteDetail();
      onSaved?.();
    } catch (err) {
      toast.error(err?.message || "Failed to assign student");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await transportApi.removeStudent(route._id, removeTarget);
      toast.success(t('toast.success.studentRemoved'));
      fetchRouteDetail();
      onSaved?.();
    } catch {
      toast.error(t('toast.error.failedToRemoveStudent'));
    } finally {
      setRemoveTarget(null);
    }
  };

  const assignedStudents = routeDetail?.students || [];

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          Assign Students — {route?.routeName || "Route"}
        </ModalHeader>
        <ModalBody className="space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-zinc-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {/* Add student form */}
              <div className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.addStudent')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label={t('pages.student')}
                    placeholder={t('pages.searchSelectStudent')}
                    selectedKeys={selectedStudentId ? [selectedStudentId] : []}
                    onSelectionChange={(keys) => setSelectedStudentId([...keys][0] || "")}
                  >
                    {availableStudents.slice(0, 50).map((s) => (
                      <SelectItem key={s._id}>
                        {s.name} {s.admissionId ? `(${s.admissionId})` : ""}
                      </SelectItem>
                    ))}
                  </Select>
                  {stops.length > 0 && (
                    <Select
                      label={t('pages.stopOptional')}
                      placeholder={t('pages.selectStop')}
                      selectedKeys={selectedStopId ? [selectedStopId] : []}
                      onSelectionChange={(keys) => setSelectedStopId([...keys][0] || "")}
                    >
                      {stops.map((s) => (
                        <SelectItem key={s._id}>{s.name}</SelectItem>
                      ))}
                    </Select>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <Switch size="sm" isSelected={pickupActive} onValueChange={setPickupActive}>
                    Pickup
                  </Switch>
                  <Switch size="sm" isSelected={dropActive} onValueChange={setDropActive}>
                    Drop
                  </Switch>
                </div>
                <Button
                  size="sm"
                  color="primary"
                  startContent={<UserPlus size={14} />}
                  onPress={handleAssign}
                  isLoading={assigning}
                  isDisabled={!selectedStudentId}
                >
                  Assign
                </Button>
              </div>

              <Divider />

              {/* Assigned students list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                    Assigned Students ({assignedStudents.length})
                  </h4>
                  {assignedStudents.length > 5 && (
                    <Input
                      placeholder={t('pages.filter')}
                      value={search}
                      onValueChange={setSearch}
                      startContent={<Search size={14} />}
                      size="sm"
                      className="max-w-[200px]"
                    />
                  )}
                </div>

                {assignedStudents.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-6">{t('pages.noStudentsAssignedToThisRouteYet')}</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {assignedStudents.map((assignment) => {
                      const student = assignment.studentId;
                      const studentName = typeof student === "object" ? student.name : "Unknown";
                      const studentAdmId = typeof student === "object" ? student.admissionId : "";
                      const studentObjId = typeof student === "object" ? student._id : student;
                      const stop = stops.find((s) => s._id === assignment.stopId?.toString() || s._id === assignment.stopId);

                      return (
                        <div
                          key={studentObjId}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-zinc-900"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{studentName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {studentAdmId && <span className="text-xs text-gray-500 dark:text-zinc-400">{studentAdmId}</span>}
                              {stop && (
                                <Chip size="sm" variant="flat" color="primary" className="h-5 text-[10px]">
                                  {stop.name}
                                </Chip>
                              )}
                              {assignment.pickupActive && (
                                <Chip size="sm" variant="flat" color="success" className="h-5 text-[10px]">{t('pages.pickup')}</Chip>
                              )}
                              {assignment.dropActive && (
                                <Chip size="sm" variant="flat" color="secondary" className="h-5 text-[10px]">{t('pages.drop')}</Chip>
                              )}
                            </div>
                          </div>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => setRemoveTarget(studentObjId)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>{t('pages.close2')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

    <ConfirmDialog
      isOpen={!!removeTarget}
      onClose={() => setRemoveTarget(null)}
      onConfirm={handleRemove}
      title={t('confirm.removeStudentFromRoute')}
      message={t('confirm.removeStudentFromRoute')}
      confirmText="Remove"
      variant="danger"
    />
    </>
  );
}
