import { useCallback, useEffect, useMemo, useState } from "react";

const getCellValue = (row, column) => {
  if (typeof column.accessor === "function") return column.accessor(row);
  if (column.accessor) return row[column.accessor];
  return row[column.key];
};

const compareValues = (left, right) => {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  if (typeof left === "number" && typeof right === "number") return left - right;
  if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime();
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
};

export default function useDataTable({
  data,
  columns,
  keyField = "id",
  searchKeys,
  defaultSort,
  sortState,
  onSortChange,
  defaultPageSize = 10,
  page: controlledPage,
  pageSize: controlledPageSize,
  onPageChange,
  onPageSizeChange,
  serverMode = false,
  totalItems: serverTotalItems,
  onFilteredDataChange,
}) {
  const [internalSort, setInternalSort] = useState(defaultSort || null);
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState({});
  const [hiddenColumns, setHiddenColumns] = useState(
    () => new Set(columns.filter((col) => col.hidden).map((col) => col.key))
  );
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(defaultPageSize);

  const sort = sortState !== undefined ? sortState : internalSort;
  const page = controlledPage ?? internalPage;
  const pageSize = controlledPageSize ?? internalPageSize;

  const visibleColumns = useMemo(
    () => columns.filter((col) => !hiddenColumns.has(col.key)),
    [columns, hiddenColumns]
  );

  const toggleColumn = useCallback((key) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const resetColumns = useCallback(() => {
    setHiddenColumns(new Set(columns.filter((col) => col.hidden).map((col) => col.key)));
  }, [columns]);

  const handleSort = useCallback(
    (columnKey) => {
      const col = columns.find((candidate) => candidate.key === columnKey);
      if (!col?.sortable) return;
      let next;
      if (!sort || sort.column !== columnKey) next = { column: columnKey, direction: "asc" };
      else if (sort.direction === "asc") next = { column: columnKey, direction: "desc" };
      else next = null;
      if (onSortChange) onSortChange(next);
      if (sortState === undefined) setInternalSort(next);
    },
    [columns, sort, sortState, onSortChange]
  );

  const setFilter = useCallback((columnKey, value) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (value === "" || value == null) delete next[columnKey];
      else next[columnKey] = value;
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setColumnFilters({});
    setSearch("");
  }, []);

  const processedRows = useMemo(() => {
    if (serverMode) return data;

    let rows = data;

    if (search.trim() && searchKeys?.length) {
      const needle = search.trim().toLowerCase();
      rows = rows.filter((row) =>
        searchKeys.some((key) => {
          const col = columns.find((candidate) => candidate.key === key) || { key };
          const val = getCellValue(row, col);
          return val != null && String(val).toLowerCase().includes(needle);
        })
      );
    }

    const filterEntries = Object.entries(columnFilters);
    if (filterEntries.length) {
      rows = rows.filter((row) =>
        filterEntries.every(([colKey, filterValue]) => {
          const col = columns.find((candidate) => candidate.key === colKey) || { key: colKey };
          const val = getCellValue(row, col);
          if (Array.isArray(filterValue)) {
            if (!filterValue.length) return true;
            return filterValue.includes(val);
          }
          if (val == null) return false;
          return String(val).toLowerCase().includes(String(filterValue).toLowerCase());
        })
      );
    }

    if (sort?.column) {
      const col = columns.find((candidate) => candidate.key === sort.column);
      if (col) {
        const dir = sort.direction === "desc" ? -1 : 1;
        rows = [...rows].sort(
          (left, right) => dir * compareValues(getCellValue(left, col), getCellValue(right, col))
        );
      }
    }

    return rows;
  }, [data, search, searchKeys, columnFilters, columns, sort, serverMode]);

  useEffect(() => {
    onFilteredDataChange?.(processedRows);
  }, [processedRows, onFilteredDataChange]);

  const totalItems = serverMode ? serverTotalItems ?? 0 : processedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      if (onPageChange) onPageChange(totalPages);
      if (controlledPage === undefined) setInternalPage(totalPages);
    }
  }, [page, totalPages, onPageChange, controlledPage]);

  const paginatedRows = useMemo(() => {
    if (serverMode) return processedRows;
    const start = (page - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, page, pageSize, serverMode]);

  const changePage = useCallback(
    (next) => {
      if (onPageChange) onPageChange(next);
      if (controlledPage === undefined) setInternalPage(next);
    },
    [onPageChange, controlledPage]
  );

  const changePageSize = useCallback(
    (next) => {
      if (onPageSizeChange) onPageSizeChange(next);
      if (controlledPageSize === undefined) setInternalPageSize(next);
      changePage(1);
    },
    [onPageSizeChange, controlledPageSize, changePage]
  );

  useEffect(() => {
    if (controlledPage === undefined) setInternalPage(1);
  }, [search, columnFilters, controlledPage]);

  return {
    visibleColumns,
    hiddenColumns,
    toggleColumn,
    resetColumns,
    sort,
    handleSort,
    search,
    setSearch,
    columnFilters,
    setFilter,
    clearFilters,
    rows: paginatedRows,
    totalItems,
    totalPages,
    page,
    pageSize,
    changePage,
    changePageSize,
    getRowKey: (row, index) => row?.[keyField] ?? index,
    getCellValue,
  };
}
