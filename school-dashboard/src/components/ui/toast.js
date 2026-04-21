import hotToast from "react-hot-toast";

/**
 * toast — design-system wrapper around react-hot-toast.
 *
 * Use this helper instead of importing `react-hot-toast` directly so every
 * notification across the dashboard shares the same placement, duration,
 * and intent styling. The global <Toaster /> is mounted once in
 * src/Providers.jsx.
 *
 * Usage:
 *   toast.success("Saved");
 *   toast.error("Something went wrong");
 *   toast.info("We sent you an email");
 *   toast("Plain message");
 *   toast.promise(savePromise, { loading: "Saving…", success: "Saved", error: "Failed" });
 *   toast.dismiss(id);
 */
const toast = (message, options) => hotToast(message, options);

toast.success = (message, options) => hotToast.success(message, options);
toast.error = (message, options) => hotToast.error(message, options);
toast.loading = (message, options) => hotToast.loading(message, options);

toast.info = (message, options) =>
  hotToast(message, {
    icon: "ℹ️",
    ...options,
  });

toast.warning = (message, options) =>
  hotToast(message, {
    icon: "⚠️",
    style: {
      background: "#b45309",
      color: "#fff",
    },
    ...options,
  });

toast.promise = (promise, messages, options) =>
  hotToast.promise(promise, messages, options);

toast.dismiss = (id) => hotToast.dismiss(id);
toast.remove = (id) => hotToast.remove(id);

export default toast;
