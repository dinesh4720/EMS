/**
 * Shared PropTypes shapes for reusable components.
 * Import these in component files to avoid duplicating shape definitions.
 */
import PropTypes from "prop-types";

/** Tab item shape used by MinimalTabs, PageLayout */
export const tabShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  icon: PropTypes.node,
});

/** Action button shape used by EmptyState */
export const actionShape = PropTypes.shape({
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.elementType,
});

/** Page header config shape used by PageLayout */
export const headerShape = PropTypes.shape({
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  helpUrl: PropTypes.string,
});

/** VirtualizedTable column definition */
export const columnShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  minWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  align: PropTypes.oneOf(["start", "end"]),
  headerContent: PropTypes.node,
  onSort: PropTypes.func,
});

/** Common size enum */
export const sizeProp = PropTypes.oneOf(["sm", "md", "lg"]);

/** Common padding enum */
export const paddingProp = PropTypes.oneOf(["none", "sm", "md", "lg"]);
