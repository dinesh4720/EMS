import hotToast from "react-hot-toast";

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

const toast = (message, options = {}) =>
  hotToast(message, {
    ...options,
    className: mergeClass("ds-toast", options.className),
  });

toast.success = (message, options = {}) =>
  hotToast.success(message, {
    ...options,
    className: mergeClass("ds-toast ds-toast--success", options.className),
  });

toast.error = (message, options = {}) =>
  hotToast.error(message, {
    ...options,
    className: mergeClass("ds-toast ds-toast--error", options.className),
  });

toast.loading = (message, options = {}) =>
  hotToast.loading(message, {
    ...options,
    className: mergeClass("ds-toast ds-toast--info", options.className),
  });

toast.info = (message, options = {}) =>
  hotToast(message, {
    icon: "ℹ️",
    ...options,
    className: mergeClass("ds-toast ds-toast--info", options.className),
  });

toast.warning = (message, options = {}) =>
  hotToast(message, {
    icon: "⚠️",
    ...options,
    className: mergeClass("ds-toast ds-toast--warning", options.className),
  });

toast.promise = (promise, messages, options = {}) =>
  hotToast.promise(promise, messages, {
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
  });

toast.dismiss = (id) => hotToast.dismiss(id);
toast.remove = (id) => hotToast.remove(id);

export default toast;
