import { useCallback, useRef, useState } from "react";

/**
 * useFormErrors — single source of truth for form validation UX.
 *
 * Provides:
 *   - errors map keyed by field name
 *   - setErrors(map) / setFieldError(name, msg) / clearFieldError(name) / clearAll()
 *   - registerField(name) → ref callback to attach to the input/wrapper
 *   - focusFirstError() → scrolls + focuses the first registered field with an error
 *   - mapServerErrors(err) → maps API error payloads (Zod-style or { fieldErrors })
 *   - async race guard via runSubmit(fn) — only the latest submission's errors win
 *
 * Acceptance (REVAMP-108):
 *   - inline errors via FormField + FieldError (aria-invalid / aria-describedby)
 *   - scroll-to-first-error + focus on submit fail
 *   - optional summary banner via FormErrorSummary
 *   - clear on field change (call clearFieldError on every onChange)
 *   - server errors mapped to fields (handles { fieldErrors }, Zod issues, { errors: [{ path, message }] })
 */
export default function useFormErrors(initial = {}) {
  const [errors, setErrorsState] = useState(initial);
  const fieldRefs = useRef(new Map());
  const fieldOrder = useRef([]);
  const submitToken = useRef(0);

  const registerField = useCallback((name) => {
    if (!fieldOrder.current.includes(name)) {
      fieldOrder.current.push(name);
    }
    return (el) => {
      if (el) fieldRefs.current.set(name, el);
      else fieldRefs.current.delete(name);
    };
  }, []);

  const setErrors = useCallback((next) => {
    setErrorsState((prev) =>
      typeof next === "function" ? next(prev) : { ...next }
    );
  }, []);

  const setFieldError = useCallback((name, message) => {
    setErrorsState((prev) => {
      if (prev[name] === message) return prev;
      return { ...prev, [name]: message };
    });
  }, []);

  const clearFieldError = useCallback((name) => {
    setErrorsState((prev) => {
      if (!(name in prev) || prev[name] == null) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setErrorsState({}), []);

  const focusFirstError = useCallback(
    (errorMap) => {
      const source = errorMap || errors;
      const entries = Object.entries(source).filter(([, v]) => Boolean(v));
      if (entries.length === 0) return null;
      const ordered = fieldOrder.current.filter((n) => source[n]);
      const firstName = ordered[0] || entries[0][0];
      const node = fieldRefs.current.get(firstName);
      if (node && typeof node.scrollIntoView === "function") {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
        const focusable =
          node.matches?.("input,select,textarea,button,[tabindex]")
            ? node
            : node.querySelector?.(
                "input,select,textarea,button,[tabindex]:not([tabindex='-1'])"
              );
        if (focusable && typeof focusable.focus === "function") {
          setTimeout(() => focusable.focus({ preventScroll: true }), 250);
        }
      }
      return firstName;
    },
    [errors]
  );

  /**
   * Map a thrown error or response payload into a field-keyed map.
   * Supports:
   *   - { fieldErrors: { name: 'msg' } }
   *   - { errors: [{ path: ['x','y'], message: 'msg' }] }  (Zod-style)
   *   - { issues: [{ path, message }] }                    (raw Zod)
   *   - { details: [{ field, message }] }
   *   - axios-like err.response.data of the above shapes
   * Returns a `{ fields, message }` tuple where `message` is a top-level message.
   */
  const mapServerErrors = useCallback((errOrPayload) => {
    const payload =
      errOrPayload?.response?.data ||
      errOrPayload?.data ||
      errOrPayload ||
      {};
    const fields = {};
    const join = (path) =>
      Array.isArray(path) ? path.filter(Boolean).join(".") : String(path || "");

    if (payload.fieldErrors && typeof payload.fieldErrors === "object") {
      Object.entries(payload.fieldErrors).forEach(([k, v]) => {
        fields[k] = Array.isArray(v) ? v[0] : v;
      });
    }
    const issueList =
      payload.issues || payload.errors || payload.details || [];
    if (Array.isArray(issueList)) {
      issueList.forEach((iss) => {
        const key = join(iss.path) || iss.field || iss.param;
        if (key && !fields[key]) fields[key] = iss.message;
      });
    }

    const message =
      payload.message ||
      errOrPayload?.message ||
      (Object.keys(fields).length
        ? "Please correct the highlighted fields."
        : "Something went wrong.");

    setErrorsState(fields);
    return { fields, message };
  }, []);

  /**
   * Race-guarded submission wrapper. Only the latest call's results are applied
   * to error state — prevents stale async validators / server responses from
   * overwriting newer ones.
   */
  const runSubmit = useCallback(async (fn) => {
    const token = ++submitToken.current;
    try {
      const result = await fn();
      if (token !== submitToken.current) return undefined;
      return result;
    } catch (err) {
      if (token !== submitToken.current) throw err;
      throw err;
    }
  }, []);

  return {
    errors,
    setErrors,
    setFieldError,
    clearFieldError,
    clearAll,
    registerField,
    focusFirstError,
    mapServerErrors,
    runSubmit,
    hasErrors: Object.values(errors).some(Boolean),
  };
}
