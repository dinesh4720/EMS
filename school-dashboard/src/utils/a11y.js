import { useEffect } from "react";

/**
 * Warns in development when an icon-only button is rendered without an
 * accessible name. Call this from components that can be icon-only.
 *
 * @param {string} componentName - public component name for the error message
 * @param {object} options
 * @param {boolean} options.isIconOnly - true when the button has no visible text
 * @param {string|undefined} options.ariaLabel
 * @param {string|undefined} options.ariaLabelledBy
 */
export function useIconButtonA11yWarning(componentName, { isIconOnly, ariaLabel, ariaLabelledBy }) {
  useEffect(() => {
    if (
      import.meta.env?.DEV &&
      isIconOnly &&
      !ariaLabel &&
      !ariaLabelledBy
    ) {
       
      console.error(
        `[${componentName}] Icon-only buttons must have an accessible name via aria-label or aria-labelledby.`
      );
    }
  }, [componentName, isIconOnly, ariaLabel, ariaLabelledBy]);
}
