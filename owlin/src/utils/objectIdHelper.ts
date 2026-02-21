/**
 * Utility functions to detect and handle MongoDB ObjectIds
 * that might be incorrectly displayed as names
 */

/**
 * Check if a string looks like a MongoDB ObjectId
 * @param {string} str - The string to check
 * @returns {boolean} - True if it looks like an ObjectId
 */
export function isObjectId(str: string | undefined | null): boolean {
  if (!str || typeof str !== 'string') return false
  // MongoDB ObjectId is a 24-character hexadecimal string
  return /^[a-f\d]{24}$/i.test(str)
}

/**
 * Get a safe display name, falling back to alternatives if the name is an ObjectId
 * @param {object} entity - The entity object (staff, student, user, etc.)
 * @param {string} fallbackField - The field to use as fallback (e.g., 'code', 'username', 'email')
 * @returns {string} - A safe display name
 */
export function getSafeDisplayName(
  entity: { name?: string; id?: string; [key: string]: any } | undefined | null,
  fallbackField: string = 'id'
): string {
  if (!entity) return 'Unknown'
  
  const name = entity.name
  
  // If name exists and is not an ObjectId, use it
  if (name && !isObjectId(name)) {
    return name
  }
  
  // Name is missing or is an ObjectId, try fallback
  if (fallbackField && entity[fallbackField] && !isObjectId(entity[fallbackField])) {
    return entity[fallbackField]
  }
  
  // Try common fallback fields
  const fallbacks = ['username', 'email', 'code', 'staffId', 'admissionId', 'rollNo']
  for (const field of fallbacks) {
    if (entity[field] && !isObjectId(entity[field])) {
      return entity[field]
    }
  }
  
  // Last resort: return a shortened ID
  const id = entity.id || entity._id
  if (id) {
    return `User ${id.toString().slice(-8)}`
  }
  
  return 'Unknown'
}

/**
 * Get initials from a name, handling ObjectId cases
 * @param {string} name - The name to get initials from
 * @param {string} fallback - Fallback character if name is invalid
 * @returns {string} - The initials (1-2 characters)
 */
export function getSafeInitials(name: string | undefined | null, fallback: string = '?'): string {
  if (!name || isObjectId(name)) {
    return fallback
  }
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return fallback
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}
