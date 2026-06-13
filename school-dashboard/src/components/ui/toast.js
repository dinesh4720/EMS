import { createElement } from "react";
import hotToast from "react-hot-toast";
import { X } from "lucide-react";

/**
 * Internal toast content renderer. Adds a keyboard-accessible dismiss button
 * with a stable accessible name to every toast.
 */
function ToastContent({ t, message }) {
  return createElement(
    "span",
    { className: "flex items-center gap-2" },
    createElement("span", { className: "flex-1" }, message),
    createElement(
      "button",
      {
        type: "button",
        "aria-label": "Dismiss notification",
        onClick: () => hotToast.dismiss(t.id),
        className: "toast-close-btn inline-flex items-center justify-center rounded p-0.5 hover:bg-[var(--color-bg-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring,var(--color-primary))]",
      },
      createElement(X, { size: 14, "aria-hidden": "true" })
    )
  );
}

/**
 * toast — design-system wrapper around react-hot-toast.
 *
 * REVAMP-05: emits frosted-glass toasts. Border colour per variant comes
 * from `.ds-toast--{success|error|info|warning}` (feedback-primitives.css).
 * The global <Toaster /> is mounted once in src/Providers.jsx with the
 * matching ariaProps (success/info = role="status", error = role="alert").
 *
 * Usage:
 *   toast.success("Saved");
 *   toast.error("Something went wrong");
 *   toast.info("We sent you an email");
 *   toast.warning("Heads up");
 *   toast("Plain message");
 *   toast.promise(savePromise, { loading: "Saving…", success: "Saved", error: "Failed" });
 *   toast.dismiss(id);
 */
const mergeClass = (base, extra) =>
  extra ? `${base} ${extra}` : base;

const wrap = (message) => (t) =>
  createElement(ToastContent, { t, message });

const toast = (message, options = {}) =>
  hotToast(wrap(message), {
    ...options,
    className: mergeClass("ds-toast", options.className),
  });

toast.success = (message, options = {}) =>
  hotToast.success(wrap(message), {
    ...options,
    className: mergeClass("ds-toast ds-toast--success", options.className),
  });

toast.error = (message, options = {}) =>
  hotToast.error(wrap(message), {
    ...options,
    className: mergeClass("ds-toast ds-toast--error", options.className),
  });

toast.loading = (message, options = {}) =>
  hotToast.loading(wrap(message), {
    ...options,
    className: mergeClass("ds-toast ds-toast--info", options.className),
  });

toast.info = (message, options = {}) =>
  hotToast(wrap(message), {
    icon: "ℹ️",
    ...options,
    className: mergeClass("ds-toast ds-toast--info", options.className),
  });

toast.warning = (message, options = {}) =>
  hotToast(wrap(message), {
    icon: "⚠️",
    ...options,
    className: mergeClass("ds-toast ds-toast--warning", options.className),
  });

toast.promise = (promise, messages, options = {}) =>
  hotToast.promise(
    promise,
    {
      loading: typeof messages.loading === "string" ? wrap(messages.loading) : messages.loading,
      success: typeof messages.success === "string" ? wrap(messages.success) : messages.success,
      error: typeof messages.error === "string" ? wrap(messages.error) : messages.error,
    },
    {
      ...options,
      success: {
        ...(options.success || {}),
        className: mergeClass("ds-toast ds-toast--success", options.success?.className),
      },
      error: {
        ...(options.error || {}),
        className: mergeClass("ds-toast ds-toast--error", options.error?.className),
      },
      loading: {
        ...(options.loading || {}),
        className: mergeClass("ds-toast ds-toast--info", options.loading?.className),
      },
    }
  );

toast.dismiss = (id) => hotToast.dismiss(id);
toast.remove = (id) => hotToast.remove(id);

export default toast;
