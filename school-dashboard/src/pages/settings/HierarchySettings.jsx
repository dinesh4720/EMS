import { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  Button,
  Select,
  SelectItem,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { Network, Save, Users } from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import SkeletonTable from '../../components/skeletons/SkeletonTable';
import logger from '../../utils/logger';


export default function HierarchySettings() {
  const { t } = useTranslation();
  const { staff, updateStaff } = useApp();
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [bulkReporter, setBulkReporter] = useState("");

  const activeStaff = staff.filter(s => s.status === "active");

  // Build hierarchy map
  const hierarchyMap = useMemo(() => {
    const map = {};
    activeStaff.forEach(s => {
      if (s.reporterId) {
        if (!map[s.reporterId]) map[s.reporterId] = [];
        map[s.reporterId].push(s);
      }
    });
    return map;
  }, [activeStaff]);

  // Get reporting chain for a staff member
  const getReportingChain = (staffId) => {
    const chain = [];
    let current = activeStaff.find(s => s.id === staffId);
    
    while (current && current.reporterId && chain.length < 10) {
      const reporter = activeStaff.find(s => s.id === current.reporterId);
      if (!reporter) break;
      chain.push(reporter);
      current = reporter;
    }
    
    return chain;
  };

  // Check for circular reference
  const hasCircularReference = (staffId, reporterId) => {
    if (staffId === reporterId) return true;
    
    const chain = getReportingChain(reporterId);
    return chain.some(s => s.id === staffId);
  };

  // Get direct reportees
  const getDirectReportees = (staffId) => {
    return hierarchyMap[staffId] || [];
  };

  // Get all reportees (recursive)
  const getAllReportees = (staffId) => {
    const direct = getDirectReportees(staffId);
    const all = [...direct];
    
    direct.forEach(reportee => {
      all.push(...getAllReportees(reportee.id));
    });
    
    return all;
  };

  const handleUpdateReporter = async (staffId, reporterId) => {
    if (reporterId && hasCircularReference(staffId, reporterId)) {
      toast.error(t('toast.error.cannotAssignReporterThisWouldCreateACircularReference'));
      return;
    }

    setLoading(true);
    try {
      const staffMember = activeStaff.find(s => s.id === staffId);
      if (!staffMember) {
        toast.error(t('toast.error.staffMemberNotFound'));
        return;
      }
      
      // Only send the reporterId field to update
      await updateStaff(staffId, { reporterId: reporterId || null });
      toast.success(`Reporter updated for ${staffMember.name}`);
    } catch (error) {
      logger.error("Failed to update reporter:", error);
      toast.error(error.message || "Failed to update reporter");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkReporter || selectedStaff.length === 0) {
      toast.error(t('toast.error.pleaseSelectStaffMembersAndAReporter'));
      return;
    }

    // Check for circular references
    for (const staffId of selectedStaff) {
      if (hasCircularReference(staffId, bulkReporter)) {
        toast.error(`Cannot assign: Would create circular reference for ${activeStaff.find(s => s.id === staffId)?.name}`);
        return;
      }
    }

    setLoading(true);
    try {
      await Promise.all(
        selectedStaff.map(staffId => updateStaff(staffId, { reporterId: bulkReporter }))
      );
      setSelectedStaff([]);
      setBulkReporter("");
      toast.success(`Updated ${selectedStaff.length} staff members`);
    } catch (error) {
      logger.error("Failed to bulk assign:", error);
      toast.error(error.message || "Failed to bulk assign reporters");
    } finally {
      setLoading(false);
    }
  };

  const getReporterName = (reporterId) => {
    const reporter = activeStaff.find(s => s.id === reporterId);
    return reporter ? reporter.name : "-";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Network size={24} />
            Reporter-Reportee Hierarchy
          </h2>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            Manage organizational reporting structure and approval workflows
          </p>
        </div>
      </div>

      {/* Bulk Assignment */}
      {selectedStaff.length > 0 && (
        <Card className="rounded-lg border-2 border-primary-200 dark:border-primary-800">
          <CardBody className="p-4">
            <div className="flex items-center gap-4">
              <Chip color="primary" variant="flat">
                {selectedStaff.length} selected
              </Chip>
              <Select
                label={t('pages.assignReporter')}
                placeholder={t('pages.selectReporter')}
                selectedKeys={bulkReporter ? [String(bulkReporter)] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0];
                  setBulkReporter(selectedKey || "");
                }}
                variant="bordered"
                className="max-w-xs"
                size="sm"
              >
                {activeStaff
                  .filter(s => !selectedStaff.includes(s.id))
                  .map((s) => (
                    <SelectItem key={String(s.id)} value={String(s.id)}>
                      {s.name} ({s.role})
                    </SelectItem>
                  ))}
              </Select>
              <Button
                color="primary"
                startContent={<Save size={16} />}
                onPress={handleBulkAssign}
                isLoading={loading}
                className="transition-all duration-200"
              >
                Assign to Selected
              </Button>
              <Button
                variant="light"
                onPress={() => setSelectedStaff([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Hierarchy Table */}
      <Card className="rounded-lg">
        <CardBody className="p-0">
          <Table
            aria-label={t('aria.tables.staffHierarchy')}
            removeWrapper
            selectionMode="multiple"
            selectedKeys={selectedStaff}
            onSelectionChange={(keys) => {
              if (keys === "all") {
                setSelectedStaff(activeStaff.map(s => s.id));
              } else {
                setSelectedStaff(Array.from(keys));
              }
            }}
            classNames={{
              th: "bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 font-semibold",
              td: "py-4 transition-colors",
              tbody: "[&>tr[data-selected=true]>td]:bg-primary-50",
              tr: "transition-colors hover:bg-gray-50 dark:hover:bg-zinc-900 data-[selected=true]:bg-primary-50",
            }}
          >
            <TableHeader>
              <TableColumn scope="col">{t('pages.sTAFFMember')}</TableColumn>
              <TableColumn scope="col">{t('pages.rOLE')}</TableColumn>
              <TableColumn scope="col">{t('pages.cURRENTReporter')}</TableColumn>
              <TableColumn scope="col">{t('pages.dIRECTReportees')}</TableColumn>
              <TableColumn scope="col">{t('pages.aSSIGNReporter')}</TableColumn>
            </TableHeader>
            <TableBody
              items={activeStaff}
              emptyContent="No staff members found"
              loadingContent={<SkeletonTable columns={5} rows={5} />}
            >
              {(staffMember) => {
                const directReportees = getDirectReportees(staffMember.id);

                return (
                  <TableRow key={staffMember.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {staffMember.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-zinc-400">
                          {staffMember.code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color="primary">
                        {staffMember.role}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700 dark:text-zinc-300">
                        {staffMember.reporterId ? (
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-gray-500 dark:text-zinc-400" />
                            {getReporterName(staffMember.reporterId)}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-zinc-500">{t('pages.noReporter')}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {directReportees.length > 0 ? (
                          <>
                            <Users size={14} className="text-gray-500 dark:text-zinc-400" />
                            <span className="font-medium">{directReportees.length}</span>
                            <span className="text-xs text-gray-500 dark:text-zinc-400">
                              ({getAllReportees(staffMember.id).length} total)
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400 dark:text-zinc-500 text-sm">{t('pages.none1')}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        placeholder={t('pages.selectReporter')}
                        selectedKeys={staffMember.reporterId ? [String(staffMember.reporterId)] : []}
                        onSelectionChange={(keys) => {
                          const selectedKey = Array.from(keys)[0];
                          // AUDIT-126: Convert 'none' string to null for proper backend storage
                          handleUpdateReporter(staffMember.id, selectedKey === 'none' ? null : selectedKey || null);
                        }}
                        variant="bordered"
                        size="sm"
                        className="min-w-[200px]"
                        isDisabled={loading}
                      >
                        <SelectItem key="none" value="">
                          No reporter
                        </SelectItem>
                        {activeStaff
                          .filter(s => s.id !== staffMember.id)
                          .map((s) => (
                            <SelectItem key={String(s.id)} value={String(s.id)}>
                              {s.name} ({s.role})
                            </SelectItem>
                          ))}
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              }}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Hierarchy Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-lg">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Network size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeStaff.filter(s => !s.reporterId).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-zinc-400">
                  Top Level Staff
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="rounded-lg">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-100 dark:bg-success-900/30 rounded-lg">
                <Users size={20} className="text-success-600 dark:text-success-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeStaff.filter(s => getDirectReportees(s.id).length > 0).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-zinc-400">
                  Staff with Reportees
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="rounded-lg">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                <Users size={20} className="text-warning-600 dark:text-warning-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeStaff.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-zinc-400">
                  Total Active Staff
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
