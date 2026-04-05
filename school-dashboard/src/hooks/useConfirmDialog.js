import { useState, useCallback } from 'react';

/**
 * Hook to manage ConfirmDialog state.
 *
 * Usage:
 *   const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
 *
 *   showConfirm({
 *     title: 'Delete Item',
 *     message: 'Are you sure?',
 *     variant: 'danger',
 *     confirmText: 'Delete',
 *     onConfirm: async () => { await deleteItem(id); },
 *   });
 *
 *   <ConfirmDialog {...confirmState} onClose={closeConfirm} />
 */
export default function useConfirmDialog() {
  const [state, setState] = useState({
    isOpen: false,
    title: 'Confirm Action',
    message: '',
    variant: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isLoading: false,
    onConfirm: null,
  });

  const showConfirm = useCallback((opts) => {
    setState({
      isOpen: true,
      title: opts.title || 'Confirm Action',
      message: opts.message || '',
      variant: opts.variant || 'warning',
      confirmText: opts.confirmText || 'Confirm',
      cancelText: opts.cancelText || 'Cancel',
      isLoading: false,
      onConfirm: async () => {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
          await opts.onConfirm?.();
        } finally {
          setState(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return { confirmState: state, showConfirm, closeConfirm };
}
