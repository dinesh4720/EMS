export function extractRoleNames(roleValue) {
  if (Array.isArray(roleValue)) {
    return roleValue
      .flatMap((role) => extractRoleNames(role))
      .filter(Boolean);
  }

  if (typeof roleValue !== 'string') {
    return [];
  }

  return [roleValue.toLowerCase().trim()];
}

export function isSuperAdminRole(roleValue) {
  return extractRoleNames(roleValue).some(
    (role) => role === 'super admin' || role === 'superadmin'
  );
}
