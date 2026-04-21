import { useCallback, useMemo, useRef, useState } from "react";

/**
 * useZodForm - lightweight form state + Zod validation.
 *
 * Returns a small toolkit for building forms without pulling in react-hook-form.
 * Forms still use the design-system primitives (Input, Select, ...) and pass
 * `values[name]` / `errors[name]` / `setField(name)` into them.
 *
 *   const form = useZodForm({ schema, initialValues });
 *   <Input label="Email" value={form.values.email}
 *     onChange={(e) => form.setField("email", e.target.value)}
 *     error={form.touched.email && form.errors.email} />
 *   <form onSubmit={form.handleSubmit(async (data) => { ... })}>
 *
 * The schema MUST mirror the backend Mongoose/Zod schema for that entity
 * (see CLAUDE.md — "Mandatory Zod Validation Rule").
 */
export function useZodForm({ schema, initialValues = {}, onSubmit } = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialRef = useRef(initialValues);

  const runValidate = useCallback(
    (next) => {
      if (!schema) return { success: true, data: next, errors: {} };
      const result = schema.safeParse(next);
      if (result.success) return { success: true, data: result.data, errors: {} };
      const fieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return { success: false, data: null, errors: fieldErrors };
    },
    [schema]
  );

  const setField = useCallback((name, value) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      return next;
    });
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }, []);

  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched((prev) => ({ ...prev, [name]: isTouched }));
  }, []);

  const setAllValues = useCallback((updater) => {
    setValues((prev) => (typeof updater === "function" ? updater(prev) : updater));
  }, []);

  const validate = useCallback(() => {
    const result = runValidate(values);
    setErrors(result.errors);
    return result;
  }, [runValidate, values]);

  const reset = useCallback((next) => {
    const target = next ?? initialRef.current;
    initialRef.current = target;
    setValues(target);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, []);

  const handleSubmit = useCallback(
    (handler) => async (event) => {
      if (event && typeof event.preventDefault === "function") event.preventDefault();
      const result = runValidate(values);
      if (!result.success) {
        setErrors(result.errors);
        // Mark all errored fields as touched so errors are visible
        setTouched((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(result.errors)) next[key] = true;
          return next;
        });
        return { success: false, errors: result.errors };
      }
      setErrors({});
      setIsSubmitting(true);
      try {
        const fn = handler || onSubmit;
        if (fn) await fn(result.data);
        return { success: true, data: result.data };
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, runValidate, values]
  );

  const isDirty = useMemo(() => {
    const initial = initialRef.current;
    const keys = new Set([...Object.keys(initial || {}), ...Object.keys(values || {})]);
    for (const key of keys) {
      if ((initial?.[key] ?? null) !== (values?.[key] ?? null)) return true;
    }
    return false;
  }, [values]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    setField,
    setFieldTouched,
    setValues: setAllValues,
    setErrors,
    validate,
    reset,
    handleSubmit,
  };
}

export default useZodForm;
