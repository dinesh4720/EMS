import { memo } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import ModalBase from "./ModalBase";

/**
 * Drawer — frosted-glass side panel (REVAMP-05).
 *
 * Native portal + focus trap + body scroll lock + ESC close. Outside-click
 * closes when `isDismissable` (default true). Slides in from the right
 * (or left) using --glass-bg / --glass-blur / --glass-border / --shadow-glass.
 *
 * Pre-revamp callers passed HeroUI sizes ("xs"…"5xl"); unknown sizes map to
 * "md". Top/bottom placements are not supported by the new primitive — they
 * coerce to right.
 */
const SIZE_CLASS = {
  xs: "ds-drawer--xs",
  sm: "ds-drawer--sm",
  md: "ds-drawer--md",
  lg: "ds-drawer--lg",
  xl: "ds-drawer--xl",
  "2xl": "ds-drawer--xl",
  "3xl": "ds-drawer--xl",
  "4xl": "ds-drawer--xl",
  "5xl": "ds-drawer--xl",
  full: "ds-drawer--full",
};

const DrawerHeader = ({ children, className = "" }) => (
  <div className={`ds-drawer__head ${className}`.trim()}>{children}</div>
);
const DrawerBody = ({ children, className = "" }) => (
  <div className={`ds-drawer__body ${className}`.trim()}>{children}</div>
);
const DrawerFooter = ({ children, className = "" }) => (
  <div className={`ds-drawer__foot ${className}`.trim()}>{children}</div>
);

const Drawer = memo(function Drawer({
  isOpen,
  onClose,
  title,
  description,
  footer,
  size = "md",
  placement = "right",
  hideCloseButton = false,
  isDismissable = true,
  children,
  ariaLabel,
  ariaDescribedBy,
  className = "",
}) {
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;
  const isLeft = placement === "left";
  const backdropClass = `ds-backdrop ds-backdrop--drawer ${
    isLeft ? "ds-backdrop--drawer-left" : ""
  }`.trim();
  const placementClass = isLeft ? "ds-drawer--left" : "";

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      portalId="ds-drawer-root"
      labelledBy={title ? "ds-drawer-title" : undefined}
      describedBy={ariaDescribedBy}
      className={backdropClass}
      closeOnBackdrop={isDismissable}
    >
      <div
        className={`ds-drawer ${sizeClass} ${placementClass} ${className}`.trim()}
        role="document"
        aria-label={!title && ariaLabel ? ariaLabel : undefined}
      >
        {(title || !hideCloseButton) && (
          <div className="ds-drawer__head">
            <div className="ds-modal__titles">
              {title ? (
                <span id="ds-drawer-title" className="ds-modal__title">
                  {title}
                </span>
              ) : null}
              {description ? (
                <span className="ds-modal__desc">{description}</span>
              ) : null}
            </div>
            {!hideCloseButton && (
              <button
                type="button"
                className="ds-modal__close"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        <DrawerBody>
          {typeof children === "function" ? children(onClose) : children}
        </DrawerBody>
        {footer ? (
          <DrawerFooter>
            {typeof footer === "function" ? footer(onClose) : footer}
          </DrawerFooter>
        ) : null}
      </div>
    </ModalBase>
  );
});

Drawer.displayName = "Drawer";

Drawer.Header = DrawerHeader;
Drawer.Body = DrawerBody;
Drawer.Footer = DrawerFooter;

Drawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  description: PropTypes.node,
  footer: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  size: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "full"]),
  placement: PropTypes.oneOf(["left", "right", "top", "bottom"]),
  hideCloseButton: PropTypes.bool,
  isDismissable: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  ariaLabel: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
  className: PropTypes.string,
};

export default Drawer;
