/**
 * cn - Utility for merging class names
 * Simple implementation without external dependencies
 */

export function cn(...classes) {
  return classes
    .filter(Boolean)
    .flat(Infinity)
    .join(' ')
    .trim();
}

export default cn;
