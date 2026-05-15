import { memo } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import ModalBase from "./ModalBase";

/**
 * Modal — frosted-glass centered dialog (REVAMP-05).
 *
 * Native portal + focus trap + body scroll lock + ESC close from ModalBase.
 * Outside-click closes when `isDismissable` (default true). Glass surface
 * uses --glass-bg / --glass-blur / --glass-border / --shadow-glass.
 *
 * Use Modal.Header / .Body / .Footer for custom composition, or pass
 * `title` / `description` / `footer` for the common case.
 *
 * Pre-revamp callers passed HeroUI sizes ("xs"…"5xl"); we map down to a
 * small canonical set (unknown → md).
 */
const SIZE_CLASS = {
  xs: "ds-modal--xs",
  sm: "ds-modal--sm",
  md: "ds-modal--md",
  lg: "ds-modal--lg",
  xl: "ds-modal--xl",
  "2xl": "ds-modal--xl",
  "3xl": "ds-modal--xl",
  "4xl": "ds-modal--xl",
  "5xl": "ds-modal--xl",
  full: "ds-modal--xl",
};

const ModalHeader = ({ children, className = "" }) => (
  <div className={`ds-modal__head ${className}`.trim()}>{children}</div>
);
const ModalBody = ({ children, className = "" }) => (
  <div className={`ds-modal__body ${className}`.trim()}>{children}</div>
);
const ModalFooter = ({ children, className = "" }) => (
  <div className={`ds-modal__foot ${className}`.trim()}>{children}</div>
);

const Modal = memo(function Modal({
  isOpen,
  onClose,
  title,
  description,
  footer,
  size = "md",
  isDismissable = true,
  hideCloseButton = false,
  children,
  ariaLabel,
  ariaDescribedBy,
  className = "",
}) {
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      portalId="ds-modal-root"
      labelledBy={title ? "ds-modal-title" : undefined}
      describedBy={ariaDescribedBy}
      className="ds-backdrop"
      closeOnBackdrop={isDismissable}
    >
      <div
        className={`ds-modal ${sizeClass} ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
        role="document"
        aria-label={!title && ariaLabel ? ariaLabel : undefined}
      >
        {(title || !hideCloseButton) && (
          <div className="ds-modal__head">
            <div className="ds-modal__titles">
              {title ? (
                <span id="ds-modal-title" className="ds-modal__title">
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
        <ModalBody>
          {typeof children === "function" ? children(onClose) : children}
        </ModalBody>
        {footer ? (
          <ModalFooter>
            {typeof footer === "function" ? footer(onClose) : footer}
          </ModalFooter>
        ) : null}
      </div>
    </ModalBase>
  );
});

Modal.displayName = "Modal";

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  description: PropTypes.node,
  footer: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  size: PropTypes.oneOf([
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "4xl",
    "5xl",
    "full",
  ]),
  isDismissable: PropTypes.bool,
  hideCloseButton: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  ariaLabel: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
  className: PropTypes.string,
};

export default Modal;
