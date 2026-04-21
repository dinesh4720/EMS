import { memo } from 'react';

/**
 * Accessible inline form validation error.
 * Pair with an input that has aria-describedby={id}.
 *
 * @param {string} id - Must match the input's aria-describedby value.
 * @param {string} children - Error text to display.
 */
const ErrorMessage = memo(function ErrorMessage({ id, children }) {
    if (!children) return null;
    return (
        <p id={id} role="alert" aria-live="polite" className="text-xs text-danger">
            {children}
        </p>
    );
});

ErrorMessage.displayName = 'ErrorMessage';

export default ErrorMessage;
