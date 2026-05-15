// Transform backend permissions array to frontend object format
export const permissionsArrayToObject = (permsArray = []) => {
  const obj = {};
  permsArray.forEach(p => {
    obj[p.module] = { view: !!p.view, create: !!p.create, edit: !!p.edit, delete: !!p.delete, publish: !!p.publish };
  });
  return obj;
};

// Transform frontend permissions object to backend array format
export const permissionsObjectToArray = (permsObj = {}) => {
  return Object.entries(permsObj).map(([module, actions]) => ({
    module,
    ...actions,
  }));
};

// Count total enabled permissions in a permissions object
export const countPermissions = (permsObj = {}) => {
  return Object.values(permsObj).reduce((total, actions) => {
    return total + Object.values(actions).filter(Boolean).length;
  }, 0);
};
