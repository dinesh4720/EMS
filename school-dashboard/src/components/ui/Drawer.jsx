import { memo } from "react";
import PropTypes from "prop-types";
import {
  Drawer as HeroDrawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/react";

/**
 * Drawer — design-system wrapper around HeroUI Drawer.
 *
 * Standardises placement, size, and dark-mode classNames for side-panel
 * experiences (filters, detail views, quick edits).
 */
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
  classNames: classNamesProp,
  ...props
}) {
  const mergedClassNames = {
    backdrop: "bg-black/40",
    base: "bg-white dark:bg-zinc-900",
    ...classNamesProp,
  };

  return (
    <HeroDrawer
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      placement={placement}
      hideCloseButton={hideCloseButton}
      isDismissable={isDismissable}
      classNames={mergedClassNames}
      {...props}
    >
      <DrawerContent>
        {(close) => (
          <>
            {title ? (
              <DrawerHeader className="flex flex-col gap-1 border-b border-default-200">
                <span className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                  {title}
                </span>
                {description ? (
                  <span className="text-sm font-normal text-gray-500 dark:text-zinc-400">
                    {description}
                  </span>
                ) : null}
              </DrawerHeader>
            ) : null}
            <DrawerBody className="py-5">
              {typeof children === "function" ? children(close) : children}
            </DrawerBody>
            {footer ? (
              <DrawerFooter className="border-t border-default-200">
                {typeof footer === "function" ? footer(close) : footer}
              </DrawerFooter>
            ) : null}
          </>
        )}
      </DrawerContent>
    </HeroDrawer>
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
  classNames: PropTypes.object,
};

export default Drawer;
