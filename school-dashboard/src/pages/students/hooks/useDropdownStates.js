import { useState } from 'react';

export function useDropdownStates() {
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [bulkDropdownOpen, setBulkDropdownOpen] = useState(false);
  const [filtersDropdownOpen, setFiltersDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  return {
    statusDropdownOpen, setStatusDropdownOpen,
    bulkDropdownOpen, setBulkDropdownOpen,
    filtersDropdownOpen, setFiltersDropdownOpen,
    sortDropdownOpen, setSortDropdownOpen,
    columnsDropdownOpen, setColumnsDropdownOpen,
    moreDropdownOpen, setMoreDropdownOpen,
  };
}
