import PermissionGuard from "./PermissionGuard";

/**
 * Higher-order component to wrap components with permission checks
 * @param {Component} Component - Component to wrap
 * @param {string} module - Module name
 * @param {string} action - Action type (default: 'view')
 */
export function withPermission(Component, module, action = 'view') {
  const displayName = Component.displayName || Component.name || 'Component';
  function PermissionWrappedComponent(props) {
    return (
      <PermissionGuard module={module} action={action}>
        <Component {...props} />
      </PermissionGuard>
    );
  }
  PermissionWrappedComponent.displayName = `withPermission(${displayName})`;
  return PermissionWrappedComponent;
}

export default withPermission;
