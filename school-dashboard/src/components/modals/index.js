/**
 * Generic/shared modals live alongside this file.
 *
 * Import modals directly from their defining file. Do NOT add wildcard
 * re-exports (e.g. `export * from './students'`) — they pull every
 * domain modal into the same chunk and defeat code-splitting.
 *
 * Usage:
 *   import UnsavedChangesModal from '@/components/modals/UnsavedChangesModal';
 *   import { WriteRemarkModal } from '@/pages/students/components/modals/WriteRemarkModal';
 */
export { default as UnsavedChangesModal } from './UnsavedChangesModal';
