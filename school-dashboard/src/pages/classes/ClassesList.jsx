import { safeGetItem, safeSetItem } from '../../utils/safeStorage';
import { useState, useEffect } from "react";
import logger from "../../utils/logger";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Spinner
} from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Settings, BookOpen } from "lucide-react";
import ClassTeacherAssignmentModal from "./components/ClassTeacherAssignmentModal";
import { useTranslation } from 'react-i18next';
import SearchInput from "../../components/ui/SearchInput";
import IconButton from "../../components/ui/IconButton";
import EmptyState from "../../components/ui/EmptyState";

import { ITEMS_PER_LOAD, AVAILABLE_COLUMNS, COLUMNS_SCHEMA_VERSION } from './classesListConstants';
import { useApp } from '../../context/AppContext';
import { toTodayDateString } from '../../utils/dateFormatter';
import { useClassesListData } from './useClassesListData';
import { EditColumnsModal } from './components/EditColumnsModal';
import { EditClassModal } from './components/EditClassModal';
import { DeleteClassModal } from './components/DeleteClassModal';
import { renderClassParentRow } from './components/ClassParentRow';
import { renderClassChildRow } from './components/ClassChildRow';


export default function ClassesList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // All data logic lives in the custom hook
  const {
    searchQuery,
    setSearchQuery,
    sortDescriptor,
    setSortDescriptor,
    visibleItems,
    hasMore,
    isLoading,
    loaderRef,
    expandedClasses,
    toggleClassExpansion,
    feeDefaulters,
    attendanceData,
    academicPerformance,
    classSettingsMap,
  } = useClassesListData();

  const { students } = useApp();

  const [selectedKeys, setSelectedKeys] = useState(new Set([]));

  // Column visibility state (versioned to invalidate stale localStorage)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = safeGetItem('classes_columns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.version === COLUMNS_SCHEMA_VERSION && Array.isArray(parsed.columns)) {
          return parsed.columns;
        }
      } catch { /* ignore corrupt data */ }
    }
    return AVAILABLE_COLUMNS;
  });
  const [showColumnModal, setShowColumnModal] = useState(false);

  // Assign teacher modal state
  const [assignTeacherModal, setAssignTeacherModal] = useState(false);
  const [selectedClassForTeacher, setSelectedClassForTeacher] = useState(null);

  // Edit / Delete class state
  const [editClassModal, setEditClassModal] = useState(false);
  const [deleteClassModal, setDeleteClassModal] = useState(false);
  const [selectedClassForEdit, setSelectedClassForEdit] = useState(null);
  const [selectedClassForDelete, setSelectedClassForDelete] = useState(null);

  // Save column visibility to localStorage (with schema version)
  useEffect(() => {
    safeSetItem('classes_columns', JSON.stringify({ version: COLUMNS_SCHEMA_VERSION, columns: visibleColumns }));
  }, [visibleColumns]);

  // Handle row click
  const handleRowClick = (item) => {
    if (item.type === 'child') {
      navigate(`/classes/${item.data.id}`);
    }
  };

  // Toggle column visibility - safely handle column state
  const toggleColumn = (key) => {
    setVisibleColumns(prev => {
      try {
        if (!prev || !Array.isArray(prev)) {
          return AVAILABLE_COLUMNS.map(col => ({ ...col }));
        }
        return prev.map(col => {
          if (!col) {
            const found = AVAILABLE_COLUMNS.find(c => c.key === key);
            return found || AVAILABLE_COLUMNS[0];
          }
          if (col.fixed) return col;
          if (col.key === key) return { ...col, visible: !col.visible };
          return col;
        }).filter(col => col != null);
      } catch (error) {
        logger.error('Error toggling column:', error);
        return AVAILABLE_COLUMNS.map(col => ({ ...col }));
      }
    });
  };

  // Get visible columns - ensure we always return a valid array with no nulls
  const getVisibleColumns = () => {
    try {
      if (!visibleColumns || !Array.isArray(visibleColumns)) {
        return AVAILABLE_COLUMNS.filter(col => col && typeof col === 'object' && col.visible);
      }
      const filtered = visibleColumns.filter(col => col && typeof col === 'object' && col.visible && col.key);
      return filtered.length > 0 ? filtered : AVAILABLE_COLUMNS.filter(col => col && typeof col === 'object' && col.visible);
    } catch (error) {
      logger.error('Error getting visible columns:', error);
      return AVAILABLE_COLUMNS.filter(col => col && typeof col === 'object' && col.visible);
    }
  };

  // Handle assign teacher
  const handleAssignTeacher = (cls) => {
    setSelectedClassForTeacher(cls);
    setAssignTeacherModal(true);
  };

  // Handle edit / delete class
  const handleEditClass = (cls) => {
    setSelectedClassForEdit(cls);
    setEditClassModal(true);
  };

  const handleDeleteClass = (cls) => {
    setSelectedClassForDelete(cls);
    setDeleteClassModal(true);
  };

  const handleDownloadReport = (cls) => {
    const classStudents = students.filter(s => String(s.classId?._id || s.classId) === String(cls.id));
    if (classStudents.length === 0) {
      toast.error(t('toast.error.noStudentsToExport', 'No students to export'));
      return;
    }
    const headers = [t('common.name', 'Name'), t('classes.rollNo', 'Roll No'), t('classes.admissionNo', 'Admission No'), t('common.gender', 'Gender'), t('classes.parentName', 'Parent Name'), t('classes.parentPhone', 'Parent Phone')];
    const rows = classStudents.map(s => [s.name || '', s.rollNo || '', s.admissionNo || '', s.gender || '', s.parentName || s.fatherName || '', s.parentPhone || '']);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cls?.name || 'class'}-${cls?.section || ''}-report-${toTodayDateString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success(t('toast.success.reportExported', 'Report exported'));
  };

  // Render a table row item (parent or child).
  // IMPORTANT: We call plain functions (not JSX components) so that
  // HeroUI's collection system receives <TableRow> elements directly.
  const renderItem = (item) => {
    if (!item || !item.type || !item.data) {
      const cols = getVisibleColumns();
      return <TableRow key="invalid-item">{cols.map((c, i) => <TableCell key={c?.key || i}>{' '}</TableCell>)}</TableRow>;
    }

    if (item.type === 'parent') {
      const group = item.data;
      if (!group) {
        const cols = getVisibleColumns();
        return <TableRow key="empty-parent">{cols.map((c, i) => <TableCell key={c?.key || i}>{' '}</TableCell>)}</TableRow>;
      }

      return renderClassParentRow({
        group,
        isExpanded: expandedClasses.has(group?.classNum),
        pendingCount: group?.totalPendingFees || 0,
        visibleColumns: getVisibleColumns(),
        onToggleExpansion: toggleClassExpansion,
        t,
      });
    }

    // Child row - individual section
    const cls = item.data;
    if (!cls || !cls.id) {
      const cols = getVisibleColumns();
      return <TableRow key="empty-child">{cols.map((c, i) => <TableCell key={c?.key || i}>{' '}</TableCell>)}</TableRow>;
    }

    const classKey = `${cls?.name || ''}-${cls?.section || ''}`;
    const pendingCount = feeDefaulters?.filter(s => s?.class === classKey)?.length || 0;
    const classAttendanceData = attendanceData?.[cls?.id];
    const attendanceValue = classAttendanceData?.overallPercentage || classAttendanceData?.attendanceRate || cls?.averageAttendance || cls?.attendance || null;
    const academicData = academicPerformance?.[cls?.id] || {};
    const academicAverage = academicData?.classAverage || cls?.averageAcademicPerformance || 0;
    const classSettings = classSettingsMap?.[cls?.id];

    return renderClassChildRow({
      cls,
      pendingCount,
      attendanceValue,
      academicAverage,
      classSettings,
      visibleColumns: getVisibleColumns(),
      onAssignTeacher: handleAssignTeacher,
      onEditClass: handleEditClass,
      onDeleteClass: handleDeleteClass,
      onDownloadReport: handleDownloadReport,
      onRowClick: () => handleRowClick(item),
      t,
      navigate,
    });
  };

  return (
    <div className="w-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6">
        {/* Left Side - Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SearchInput
            name="class-search-query"
            placeholder={t('pages.searchClasses1')}
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-full sm:max-w-[350px] px-3 py-2 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 focus-within:border-gray-400 dark:focus-within:border-zinc-600 transition-all"
          />
        </div>

        {/* Right Side - Filters */}
        <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <IconButton
            onClick={() => setShowColumnModal(true)}
            aria-label={t('pages.editColumns')}
            variant="outline"
            size="md"
            icon={<Settings size={16} />}
            title={t('pages.editColumns')}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
      <Table
        key={`table-${getVisibleColumns().map(c => c?.key).join('-')}`}
        aria-label={t('aria.tables.classesList')}
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        removeWrapper
        radius="none"
        classNames={{
          base: "[&_table]:w-full [&_table]:border-spacing-0 [&_table]:select-text",
          thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12",
          th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors cursor-pointer [&_svg]:text-default-300 [&:hover_svg]:text-default-500 [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default select-none",
          td: "py-0 border-b border-default-200 group-data-[last=true]:border-none last:pr-6 select-text transition-colors",
          tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-0 [&>tr[data-selected=true]>td]:bg-primary-50",
          tr: "transition-colors hover:bg-gray-50 dark:hover:bg-zinc-900 data-[selected=true]:bg-primary-50",
        }}
      >
        <TableHeader>
          {getVisibleColumns()
            .filter(col => col && typeof col === 'object' && col.key && col.visible)
            .map((col) => (
              <TableColumn
                key={col.key}
                allowsSorting={col.key !== 'actions'}>
                {col.labelKey ? t(col.labelKey, col.label || '') : (col.label || '')}
              </TableColumn>
            ))
          }
        </TableHeader>
        <TableBody
          items={visibleItems.filter(item => item && item.type && item.data)}
          emptyContent={
            <EmptyState
              icon={BookOpen}
              title={t('classes.emptyStateTitle', 'No classes found')}
              description={t('classes.emptyStateDescription', 'Get started by creating your first class')}
              size="lg"
            />
          }
        >
          {renderItem}
        </TableBody>
      </Table>
      </div>

      {/* Lazy Loading Indicator */}
      <div ref={loaderRef} className="flex justify-center py-4">
        {isLoading && <Spinner size="sm" color="primary" />}
        {!hasMore && visibleItems.length > ITEMS_PER_LOAD && (
          <span className="text-default-400 text-sm">{t('pages.allClassesLoaded')}</span>
        )}
      </div>

      {/* Edit Columns Modal */}
      <EditColumnsModal
        isOpen={showColumnModal}
        onClose={() => setShowColumnModal(false)}
        getVisibleColumns={getVisibleColumns()}
        toggleColumn={toggleColumn}
      />

      {/* Assign Teacher Modal */}
      <ClassTeacherAssignmentModal
        isOpen={assignTeacherModal}
        onClose={() => setAssignTeacherModal(false)}
        classId={selectedClassForTeacher?.id}
        className={selectedClassForTeacher?.name}
        section={selectedClassForTeacher?.section}
        currentTeacherId={selectedClassForTeacher?.classTeacherId}
      />

      {/* Edit Class Modal */}
      <EditClassModal
        isOpen={editClassModal}
        onClose={() => { setEditClassModal(false); setSelectedClassForEdit(null); }}
        classData={selectedClassForEdit}
      />

      {/* Delete Class Confirmation Modal */}
      <DeleteClassModal
        isOpen={deleteClassModal}
        onClose={() => { setDeleteClassModal(false); setSelectedClassForDelete(null); }}
        classData={selectedClassForDelete}
      />
    </div>
  );
}
