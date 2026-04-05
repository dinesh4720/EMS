import { createContext, useContext, useMemo } from "react";

/**
 * Context for StudentsTable action handlers.
 *
 * Holds stable callbacks/setters so they don't need to be drilled
 * through props.  Data that changes per-render (visibleItems, selectedKeys,
 * etc.) stays as regular props on <StudentsTableVirtualized> so React.memo
 * can do shallow-compare on them.
 */
const StudentsTableContext = createContext(null);

export function StudentsTableProvider({ actions, children }) {
    // Stabilise the context value object itself so consumers don't
    // re-render just because the parent re-renders.  All individual
    // callbacks inside `actions` should already be stable (useCallback /
    // refs from the hook), so this memo is effectively free.
    const value = useMemo(() => actions, [
        // selection
        actions.setSelectedKeys,
        // sort
        actions.setSortDescriptor,
        // phone editing
        actions.setEditingPhoneId,
        actions.setPhoneInput,
        actions.handleSavePhone,
        // row actions
        actions.handlePinStudent,
        actions.handleUnpinStudent,
        actions.setSelectedStudent,
        actions.setIsEditDrawerOpen,
        actions.setStudentToDelete,
        actions.onDeleteOpen,
        actions.setStatusChangeData,
        actions.onStatusChangeOpen,
        actions.setTcStudents,
        actions.onTcModalOpen,
        actions.handleBulkAction,
        actions.onPromoteOpen,
        // misc
        actions.closeAllDropdowns,
        actions.onClearFilters,
    ]);

    return (
        <StudentsTableContext.Provider value={value}>
            {children}
        </StudentsTableContext.Provider>
    );
}

export function useStudentsTableActions() {
    const ctx = useContext(StudentsTableContext);
    if (!ctx) {
        throw new Error(
            "useStudentsTableActions must be used within <StudentsTableProvider>"
        );
    }
    return ctx;
}
