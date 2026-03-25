/**
 * Modal barrel exports.
 *
 * Generic/shared modals are defined here.
 * Domain-specific modals remain co-located with their pages but are
 * re-exported from domain barrels for clean imports.
 *
 * Usage:
 *   import { WriteRemarkModal } from '@/components/modals/students';
 *   import { CreateExamModal } from '@/components/modals/academics';
 */
export { default as UnsavedChangesModal } from './UnsavedChangesModal';

// Domain barrel re-exports
export * from './students';
export * from './academics';
export * from './library';
export * from './staffs';
export * from './classes';
export * from './messaging';
export * from './homework';
export * from './transport';
