import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

import { API_URL } from "../config/api.js";
import { resetPasswordSchema } from "../validators/formSchemas";
import useZodForm from "../hooks/useZodForm";

import AuthVisual from "../components/auth/AuthVisual";
import AuthBrand from "../components/auth/AuthBrand";
import PasswordStrengthMeter from "../components/auth/PasswordStrengthMeter";

/**
 * ResetPassword — reached from the password-reset email.
 *
 * Security: the reset token arrives in the URL hash fragment (#token=...) and
 * never as a query param. Hash fragments are not sent to the server, never hit
 * access logs, and are stripped from the Referer header. We move the token
 * into component state and rewrite the URL on mount so it does not linger in
 * browser history.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [tokenMissing, setTokenMissing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [tokenExpired, setTokenExpired] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    errors,
    isSubmitting,
    onInvalid,
  } = useZodForm(resetPasswordSchema, {
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const newPasswordValue = watch("newPassword");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const t = params.get("token");
    if (t) {
      setToken(t);
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      setTokenMissing(true);
    }
  }, []);

  const onSubmit = async (data) => {
    setSubmitError("");

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, newPassword: data.newPassword }),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = resData.error || "Failed to reset password. Please try again.";
        if (res.status === 400 || res.status === 401 || res.status === 410) {
          setTokenExpired(true);
        }
        setSubmitError(message);
        return;
      }
      toast.success("Password reset successfully. Please log in.");
      navigate("/login", {
        replace: true,
        state: { message: "Password updated. Please sign in with your new password." },
      });
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    }
  };

  if (tokenMissing || tokenExpired) {
    return (
      <div className="auth-shell">
        <section className="auth-form">
          <div className="auth-form__inner">
            <div className="auth-form__brand">
              <AuthBrand />
            </div>

            <header className="auth-form__head">
              <h1 className="auth-form__title">Reset link unavailable</h1>
              <p className="auth-form__sub">
                {tokenExpired
                  ? "This reset link has expired or has already been used."
                  : "This password reset link is missing or invalid."}
              </p>
            </header>

            <div
              className="chip chip--danger auth-form__lockout"
              role="alert"
              aria-live="polite"
            >
              <ShieldAlert size={12} aria-hidden="true" />
              {tokenExpired ? "Token expired" : "Invalid reset link"}
            </div>

            <p className="auth-form__notice">
              Please request a new password reset email from your administrator,
              or return to the login page to try again.
            </p>

            <button
              type="button"
              className="btn btn--accent btn--block"
              onClick={() => navigate("/login", { replace: true })}
            >
              Back to login
            </button>

            <footer className="auth-form__foot">
              <span>© {new Date().getFullYear()} School Sync</span>
              <Link to="/privacy">Privacy policy</Link>
            </footer>
          </div>
        </section>

        <AuthVisual />
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <section className="auth-form">
        <div className="auth-form__inner">
          <div className="auth-form__brand">
            <AuthBrand />
          </div>

          <header className="auth-form__head">
            <h1 className="auth-form__title">Set a new password</h1>
            <p className="auth-form__sub">
              Enter a strong password for your account. You will be signed in
              once the reset succeeds.
            </p>
          </header>

          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="auth-form__form"
            autoComplete="on"
            noValidate
          >
            <div className="field">
              <label htmlFor="reset-new" className="field__label">
                New password
                <span className="req" aria-hidden="true">*</span>
              </label>
              <div className="field__icon-wrap">
                <Lock size={14} className="field__icon" aria-hidden="true" />
                <input
                  id="reset-new"
                  className={`input input--with-icon input--with-action ${
                    errors.newPassword ? "input--err" : ""
                  }`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 chars, upper, lower, number"
                  autoComplete="new-password"
                  required
                  aria-invalid={Boolean(errors.newPassword) || undefined}
                  aria-describedby={errors.newPassword ? "reset-new-err" : undefined}
                  {...register("newPassword")}
                />
                <button
                  type="button"
                  className="field__action"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.newPassword && (
                <span id="reset-new-err" className="field__hint field__hint--danger">
                  {errors.newPassword.message}
                </span>
              )}
              <PasswordStrengthMeter password={newPasswordValue} />
            </div>

            <div className="field">
              <label htmlFor="reset-confirm" className="field__label">
                Confirm password
                <span className="req" aria-hidden="true">*</span>
              </label>
              <div className="field__icon-wrap">
                <Lock size={14} className="field__icon" aria-hidden="true" />
                <input
                  id="reset-confirm"
                  className={`input input--with-icon ${
                    errors.confirmPassword ? "input--err" : ""
                  }`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                  aria-invalid={Boolean(errors.confirmPassword) || undefined}
                  aria-describedby={
                    errors.confirmPassword ? "reset-confirm-err" : undefined
                  }
                  {...register("confirmPassword")}
                />
              </div>
              {errors.confirmPassword && (
                <span id="reset-confirm-err" className="field__hint field__hint--danger">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            {submitError && (
              <div className="auth-form__alert auth-form__alert--danger" role="alert">
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn--accent btn--block"
              disabled={isSubmitting}
              aria-busy={isSubmitting || undefined}
            >
              {isSubmitting ? "Resetting…" : "Reset password"}
            </button>

            <Link to="/login" className="auth-form__link" style={{ textAlign: "center" }}>
              Back to login
            </Link>
          </form>

          <footer className="auth-form__foot">
            <span>© {new Date().getFullYear()} School Sync</span>
            <Link to="/privacy">Privacy policy</Link>
          </footer>
        </div>
      </section>

      <AuthVisual />
    </div>
  );
}
