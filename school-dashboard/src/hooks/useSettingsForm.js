import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

/**
 * Reusable hook for managing settings forms with standardized state pattern
 * Handles loading, saving, validation, and API interactions for settings components
 *
 * @param {Object} config - Configuration object
 * @param {Function} config.fetchFn - Async function to fetch data
 * @param {Function} config.saveFn - Async function to save data
 * @param {Function} config.deleteFn - Optional async function to delete data
 * @param {Object} config.initialState - Initial form state
 * @param {Function} config.validateFn - Optional validation function, returns error message or null
 * @param {string} config.successMessage - Success message for save operation
 * @param {string} config.errorMessage - Error message for save operation
 * @param {boolean} config.autoFetch - Whether to fetch data on mount (default: true)
 *
 * @returns {Object} Form state and handlers
 *
 * @example
 * const { data, loading, saving, handleSave, handleDelete, refresh } = useSettingsForm({
 *   fetchFn: () => api.getSettings(),
 *   saveFn: (data) => api.updateSettings(data),
 *   initialState: { name: '', value: '' },
 *   validateFn: (data) => data.name ? null : 'Name is required',
 *   successMessage: 'Settings saved successfully'
 * });
 */
export function useSettingsForm({
  fetchFn,
  saveFn,
  deleteFn,
  initialState,
  validateFn = null,
  successMessage = "Settings saved successfully",
  errorMessage = "Failed to save settings",
  autoFetch = true
}) {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data
  const refresh = useCallback(async () => {
    if (!fetchFn) return;

    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load data");
      toast.error(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && fetchFn) {
      refresh();
    }
  }, [autoFetch, fetchFn, refresh]);

  // Update a single field in the form data
  const updateField = useCallback((field, value) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Update multiple fields at once
  const updateFields = useCallback((updates) => {
    setData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Reset form to initial state
  const reset = useCallback(() => {
    setData(initialState);
    setError(null);
  }, [initialState]);

  // Save form data
  const handleSave = useCallback(async (customData = null) => {
    const dataToSave = customData || data;

    // Validate if validation function provided
    if (validateFn) {
      const validationError = validateFn(dataToSave);
      if (validationError) {
        toast.error(validationError);
        return false;
      }
    }

    if (!saveFn) {
      console.warn("No save function provided");
      return false;
    }

    try {
      setSaving(true);
      setError(null);
      const result = await saveFn(dataToSave);

      // Update local state with result if returned
      if (result) {
        setData(result);
      }

      toast.success(successMessage);
      return true;
    } catch (err) {
      console.error("Error saving data:", err);
      setError(err.message || errorMessage);
      toast.error(err.message || errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [data, saveFn, validateFn, successMessage, errorMessage]);

  // Delete item
  const handleDelete = useCallback(async (id) => {
    if (!deleteFn) {
      console.warn("No delete function provided");
      return false;
    }

    if (!confirm("Are you sure you want to delete this item?")) {
      return false;
    }

    try {
      setSaving(true);
      setError(null);
      await deleteFn(id);
      toast.success("Item deleted successfully");

      // Refresh data after delete
      if (fetchFn) {
        await refresh();
      }

      return true;
    } catch (err) {
      console.error("Error deleting item:", err);
      setError(err.message || "Failed to delete item");
      toast.error(err.message || "Failed to delete item");
      return false;
    } finally {
      setSaving(false);
    }
  }, [deleteFn, fetchFn, refresh]);

  return {
    // State
    data,
    loading,
    saving,
    error,
    // Actions
    updateField,
    updateFields,
    reset,
    handleSave,
    handleDelete,
    refresh,
    setData
  };
}

/**
 * Hook for managing list-based settings (like holidays, leave types, etc.)
 * Extends useSettingsForm with list-specific operations
 */
export function useSettingsList({
  fetchFn,
  saveFn,
  deleteFn,
  updateFn,
  initialState = [],
  validateFn = null,
  itemName = "item",
  autoFetch = true
}) {
  const [items, setItems] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Fetch items
  const refresh = useCallback(async () => {
    if (!fetchFn) return;

    try {
      setLoading(true);
      const result = await fetchFn();
      setItems(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Error fetching items:", err);
      toast.error(err.message || `Failed to load ${itemName}s`);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, itemName]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && fetchFn) {
      refresh();
    }
  }, [autoFetch, fetchFn, refresh]);

  // Add or update item
  const handleSave = useCallback(async (itemData) => {
    // Validate if validation function provided
    if (validateFn) {
      const validationError = validateFn(itemData);
      if (validationError) {
        toast.error(validationError);
        return false;
      }
    }

    if (!saveFn && !updateFn) {
      console.warn("No save or update function provided");
      return false;
    }

    try {
      setSaving(true);
      const isEdit = editingItem !== null;

      if (isEdit && updateFn) {
        await updateFn(editingItem, itemData);
        toast.success(`${itemName} updated successfully`);
      } else if (!isEdit && saveFn) {
        await saveFn(itemData);
        toast.success(`${itemName} created successfully`);
      }

      setEditingItem(null);
      await refresh();
      return true;
    } catch (err) {
      console.error(`Error saving ${itemName}:`, err);
      toast.error(err.message || `Failed to save ${itemName}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [editingItem, saveFn, updateFn, validateFn, itemName, refresh]);

  // Delete item
  const handleDelete = useCallback(async (id) => {
    if (!deleteFn) {
      console.warn("No delete function provided");
      return;
    }

    if (!confirm(`Are you sure you want to delete this ${itemName}?`)) {
      return;
    }

    try {
      setSaving(true);
      await deleteFn(id);
      toast.success(`${itemName} deleted successfully`);
      await refresh();
    } catch (err) {
      console.error(`Error deleting ${itemName}:`, err);
      toast.error(err.message || `Failed to delete ${itemName}`);
    } finally {
      setSaving(false);
    }
  }, [deleteFn, itemName, refresh]);

  // Start editing an item
  const startEdit = useCallback((item) => {
    setEditingItem(item);
  }, []);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditingItem(null);
  }, []);

  return {
    // State
    items,
    loading,
    saving,
    editingItem,
    // Actions
    handleSave,
    handleDelete,
    startEdit,
    cancelEdit,
    refresh,
    setItems
  };
}
