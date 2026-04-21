import { memo } from "react";
import PropTypes from "prop-types";
import {
  Modal as HeroModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";

/**
 * Modal — design-system wrapper around HeroUI Modal.
 *
 * Provides standardised sizing, backdrop, and dark-mode classNames so every
 * modal across the app looks the same. Compose header/body/footer via the
 * attached subcomponents (Modal.Header, Modal.Body, Modal.Footer) or pass
 * `title` / `footer` props for the common case.
 *
 * For confirmation flows use `ConfirmDialog`. For lightweight alerts use
 * `Dialog`. For side-panel flows use `Drawer`.
 */
const Modal = memo(function Modal({
  isOpen,
  onClose,
  title,
  description,
  footer,
  size = "md",
  scrollBehavior = "inside",
  isDismissable = true,
  hideCloseButton = false,
  children,
  classNames: classNamesProp,
  ...props
}) {
  const mergedClassNames = {
    backdrop: "bg-black/50",
    base: "bg-white dark:bg-zinc-900",
    ...classNamesProp,
  };

  return (
    <HeroModal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      scrollBehavior={scrollBehavior}
      isDismissable={isDismissable}
      hideCloseButton={hideCloseButton}
      classNames={mergedClassNames}
      {...props}
    >
      <ModalContent>
        {(close) => (
          <>
            {title ? (
              <ModalHeader className="flex flex-col gap-1 border-b border-default-200">
                <span className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                  {title}
                </span>
                {description ? (
                  <span className="text-sm font-normal text-gray-500 dark:text-zinc-400">
                    {description}
                  </span>
                ) : null}
              </ModalHeader>
            ) : null}
            <ModalBody className="py-6">
              {typeof children === "function" ? children(close) : children}
            </ModalBody>
            {footer ? (
              <ModalFooter className="border-t border-default-200">
                {typeof footer === "function" ? footer(close) : footer}
              </ModalFooter>
            ) : null}
          </>
        )}
      </ModalContent>
    </HeroModal>
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
  scrollBehavior: PropTypes.oneOf(["inside", "outside", "normal"]),
  isDismissable: PropTypes.bool,
  hideCloseButton: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  classNames: PropTypes.object,
};

export default Modal;
