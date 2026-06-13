import { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import useFormErrors from "./useFormErrors";

/**
 * useZodForm — project-standard wrapper around react-hook-form + Zod.
 *
 * Why this exists:
 *   - ENGINEERING_GAPS #2 mandates a single form-management library.
 *   - react-hook-form handles uncontrolled field state and validation timing.
 *   - Zod (already installed) remains the single source of truth for schemas.
 *   - This hook wires the two together and preserves our server-error UX.
 *
 * @param {import('zod').ZodSchema} schema
 * @param {object} options
 * @param {object} [options.defaultValues]
 * @param {'onSubmit'|'onBlur'|'onChange'|'all'} [options.mode='onSubmit']
 * @param {'onSubmit'|'onBlur'|'onChange'} [options.reValidateMode='onChange']
 * @param {object} [options.formOptions] additional react-hook-form options
 *
 * @returns {{
 *   register: import('react-hook-form').UseFormRegister<T>,
 *   handleSubmit: import('react-hook-form').UseFormHandleSubmit<T>,
 *   errors: import('react-hook-form').FieldErrors<T>,
 *   isSubmitting: boolean,
 *   isValid: boolean,
 *   isDirty: boolean,
 *   reset: (values?: T) => void,
 *   setValue: import('react-hook-form').UseFormSetValue<T>,
 *   getValues: import('react-hook-form').UseFormGetValues<T>,
 *   watch: import('react-hook-form').UseFormWatch<T>,
 *   setError: import('react-hook-form').UseFormSetError<T>,
 *   clearErrors: import('react-hook-form').UseFormClearErrors<T>,
 *   control: import('react-hook-form').Control<T>,
 *   trigger: import('react-hook-form').UseFormTrigger<T>,
 *   onInvalid: (errors: import('react-hook-form').FieldErrors<T>) => void,
 *   setServerErrors: (errOrPayload: unknown) => string | undefined,
 * }}
 */
export default function useZodForm(schema, options = {}) {
  const {
    defaultValues,
    mode = "onSubmit",
    reValidateMode = "onChange",
    ...formOptions
  } = options;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
    reValidateMode,
    ...formOptions,
  });

  const {
    register,
    handleSubmit,
    formState,
    reset,
    setValue,
    getValues,
    watch,
    setError,
    clearErrors,
    control,
    trigger,
  } = form;

  const { errors, isSubmitting, isValid, isDirty } = formState;

  const { focusFirstError, mapServerErrors } = useFormErrors();

  /**
   * Called by react-hook-form when validation fails on submit.
   * Scrolls to and focuses the first invalid field.
   */
  const onInvalid = useCallback(
    (formErrors) => {
      const firstName = Object.keys(formErrors)[0];
      if (!firstName) return;

      const node = document.querySelector(`[name="${firstName}"]`);
      if (!node) {
        // Fallback to the useFormErrors registration map if available.
        focusFirstError(formErrors);
        return;
      }

      const focusable =
        node.matches?.("input,select,textarea,button,[tabindex]")
          ? node
          : node.querySelector?.(
              "input,select,textarea,button,[tabindex]:not([tabindex='-1'])"
            );

      if (focusable && typeof focusable.scrollIntoView === "function") {
        focusable.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (focusable && typeof focusable.focus === "function") {
        setTimeout(() => focusable.focus({ preventScroll: true }), 50);
      }
    },
    [focusFirstError]
  );

  /**
   * Maps a backend / API error into react-hook-form field errors.
   * Supports the same payload shapes as useFormErrors.mapServerErrors.
   * Returns the top-level message (if any) for non-field display.
   */
  const setServerErrors = useCallback(
    (errOrPayload) => {
      const { fields, message } = mapServerErrors(errOrPayload);
      Object.entries(fields).forEach(([name, msg]) => {
        setError(name, { type: "server", message: msg });
      });
      return message;
    },
    [mapServerErrors, setError]
  );

  const resetForm = useCallback(
    (values) => {
      clearErrors();
      reset(values);
    },
    [clearErrors, reset]
  );

  return useMemo(
    () => ({
      register,
      handleSubmit,
      errors,
      isSubmitting,
      isValid,
      isDirty,
      reset: resetForm,
      setValue,
      getValues,
      watch,
      setError,
      clearErrors,
      control,
      trigger,
      onInvalid,
      setServerErrors,
    }),
    [
      register,
      handleSubmit,
      errors,
      isSubmitting,
      isValid,
      isDirty,
      resetForm,
      setValue,
      getValues,
      watch,
      setError,
      clearErrors,
      control,
      trigger,
      onInvalid,
      setServerErrors,
    ]
  );
}
