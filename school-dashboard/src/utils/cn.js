import { twMerge } from 'tailwind-merge';

/**
 * cn - Utility for merging class names with Tailwind conflict resolution
 */
export function cn(...classes) {
  return twMerge(classes.filter(Boolean).flat(Infinity).join(' '));
}

export default cn;
