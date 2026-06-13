import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { APP_CONFIG } from "../utils/constants";
import { loginSchema, parseFormSchema } from "../validators/formSchemas";

import AuthVisual from "../components/auth/AuthVisual";
import AuthBrand from "../components/auth/AuthBrand";

const MAX_ATTEMPTS = APP_CONFIG.MAX_LOGIN_ATTEMPTS;
const LOCKOUT_MS = APP_CONFIG.LOCKOUT_DURATION_MS;
const LOCKOUT_KEY = "login_lockout";

const VISUAL_OPTIONS = [
  { key: "enhanced3d", label: "Enhanced" },
  { key: "pixel", label: "Pixel" },
  { key: "cards", label: "Cards" },
];

function getLockoutState() {
  try {
    const raw = sessionStorage.getItem(LOCKOUT_KEY);
    if (!raw) return { attempts: 0, lockedUntil: null };
    return JSON.parse(raw);
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
}

function saveLockoutState(state) {
  try {
    sessionStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function clearLockoutState() {
  try {
    sessionStorage.removeItem(LOCKOUT_KEY);
  } catch {
    /* ignore */
  }
}

function formatCountdown(seconds) {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function useVisualVariant() {
  const location = useLocation();
  const [variant, setVariant] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("visual");
    return VISUAL_OPTIONS.some((o) => o.key === v) ? v : "enhanced3d";
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const v = params.get("visual");
    if (VISUAL_OPTIONS.some((o) => o.key === v) && v !== variant) {
      setVariant(v);
    }
  }, [location.search]);

  const setVisual = useCallback((key) => {
    setVariant(key);
    const url = new URL(window.location.href);
    url.searchParams.set("visual", key);
    window.history.replaceState({}, "", url);
  }, []);

  return [variant, setVisual];
}

export default function Login() {
  const { t } = useTranslation();
  const location = useLocation();
  const { login } = useAuth();
  const [visualVariant, setVisualVariant] = useVisualVariant();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const successMessage = location.state?.message;

  // Countdown timer for lockout — re-syncs from sessionStorage so a reload
  // doesn't reset the timer (lockout persistence bug license from the task).
  useEffect(() => {
    const state = getLockoutState();
    if (!state.lockedUntil || Date.now() >= state.lockedUntil) {
      if (state.lockedUntil) clearLockoutState();
      return undefined;
    }

    let active = true;
    setLockoutRemaining(Math.ceil((state.lockedUntil - Date.now()) / 1000));

    const interval = setInterval(() => {
      const remaining = Math.ceil((state.lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        clearLockoutState();
        if (active) setLockoutRemaining(0);
        clearInterval(interval);
      } else if (active) {
        setLockoutRemaining(remaining);
      }
    }, 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSubmitError("");
      setFieldErrors({});

      // Lockout gate
      const lockout = getLockoutState();
      if (lockout.lockedUntil && Date.now() < lockout.lockedUntil) {
        const remaining = Math.ceil((lockout.lockedUntil - Date.now()) / 1000);
        setLockoutRemaining(remaining);
        setSubmitError(
          t("login.lockoutError", {
            mins: Math.ceil(remaining / 60),
            secs: remaining % 60,
          })
        );
        return;
      }

      // Client-side validation (mirrors backend Zod loginSchema)
      const parsed = parseFormSchema(loginSchema, { emailOrPhone, password });
      if (!parsed.success) {
        setFieldErrors(parsed.errors);
        return;
      }

      setLoading(true);
      try {
        await login(emailOrPhone, password);
        clearLockoutState();
      } catch (err) {
        const state = getLockoutState();
        const attempts = (state.attempts || 0) + 1;

        if (attempts >= MAX_ATTEMPTS) {
          const lockedUntil = Date.now() + LOCKOUT_MS;
          saveLockoutState({ attempts, lockedUntil });
          const mins = Math.ceil(LOCKOUT_MS / 60000);
          setSubmitError(t("login.lockedFor", { mins }));
          setLockoutRemaining(Math.ceil(LOCKOUT_MS / 1000));
        } else {
          saveLockoutState({ attempts, lockedUntil: null });
          const remaining = MAX_ATTEMPTS - attempts;
          setSubmitError(
            t("login.loginFailedAttempts", {
              message: err?.message || "Login failed",
              remaining,
              plural: remaining !== 1 ? "s" : "",
            })
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [emailOrPhone, password, login, t]
  );

  const isLocked = lockoutRemaining > 0;
  const submitDisabled = loading || isLocked;
  const countdownLabel = useMemo(() => formatCountdown(lockoutRemaining), [lockoutRemaining]);

  return (
    <div className="auth-shell">
      <section className="auth-form">
        <div className="auth-form__inner">
          <div className="auth-form__brand">
            <AuthBrand />
          </div>

          <header className="auth-form__head">
            <h1 className="auth-form__title">{t("login.welcome")}</h1>
            <p className="auth-form__sub">{t("login.subtitle")}</p>
          </header>

          {successMessage && (
            <div className="auth-form__alert auth-form__alert--success" role="status">
              {successMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="auth-form__form"
            autoComplete="on"
            noValidate
          >
            <div className="field">
              <label htmlFor="login-email" className="field__label">
                {t("login.emailLabel")}
                <span className="req" aria-hidden="true">*</span>
              </label>
              <div className="field__icon-wrap">
                <Mail size={14} className="field__icon" aria-hidden="true" />
                <input
                  id="login-email"
                  className={`input input--with-icon ${
                    fieldErrors.emailOrPhone ? "input--err" : ""
                  }`}
                  type="text"
                  inputMode="email"
                  placeholder={t("login.emailPlaceholder")}
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  aria-invalid={Boolean(fieldErrors.emailOrPhone) || undefined}
                  aria-describedby={fieldErrors.emailOrPhone ? "login-email-err" : undefined}
                />
              </div>
              {fieldErrors.emailOrPhone && (
                <span id="login-email-err" className="field__hint field__hint--danger">
                  {fieldErrors.emailOrPhone}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="login-password" className="field__label">
                {t("login.passwordLabel")}
                <span className="req" aria-hidden="true">*</span>
              </label>
              <div className="field__icon-wrap">
                <Lock size={14} className="field__icon" aria-hidden="true" />
                <input
                  id="login-password"
                  className={`input input--with-icon input--with-action ${
                    fieldErrors.password ? "input--err" : ""
                  }`}
                  type={showPassword ? "text" : "password"}
                  placeholder={t("login.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  aria-invalid={Boolean(fieldErrors.password) || undefined}
                  aria-describedby={fieldErrors.password ? "login-password-err" : undefined}
                />
                <button
                  type="button"
                  className="field__action"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? t("login.hidePassword") : t("login.showPassword")
                  }
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {fieldErrors.password && (
                <span id="login-password-err" className="field__hint field__hint--danger">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            <div className="auth-form__actions">
              <span className="auth-form__kbd-hint" aria-hidden="true">
                <span className="kbd">↵</span>
                {t("login.enterToSignIn", "to sign in")}
              </span>
              <button
                type="button"
                onClick={() =>
                  toast(
                    t(
                      "login.forgotPasswordToast",
                      "Contact your administrator to reset your password."
                    ),
                    { icon: "ℹ️" }
                  )
                }
                className="auth-form__link"
              >
                {t("login.forgotPassword", "Forgot Password?")}
              </button>
            </div>

            {submitError && (
              <div className="auth-form__alert auth-form__alert--danger" role="alert">
                <span>{submitError}</span>
              </div>
            )}

            {isLocked && (
              <div
                className="chip chip--warn auth-form__lockout mono tnum"
                role="status"
                aria-live="polite"
              >
                <span className="dot" aria-hidden="true" />
                {t("login.lockoutRemaining", "Try again in")} {countdownLabel}
              </div>
            )}

            <button
              type="submit"
              className="btn btn--accent btn--block"
              disabled={submitDisabled}
              aria-busy={loading || undefined}
            >
              {isLocked
                ? t("login.locked", { seconds: lockoutRemaining })
                : loading
                ? t("login.signingIn")
                : t("login.signIn")}
            </button>

            <p className="auth-form__notice">{t("login.inviteOnlyNote")}</p>
          </form>

          {/* Visual variant preview toggle */}
          <div className="auth-form__variant-toggle">
            <span className="auth-form__variant-label">
              {t("login.visualPreviewLabel", "Preview")}
            </span>
            <div className="auth-form__variant-segment" role="group" aria-label={t("login.visualPreviewLabel", "Preview")}>
              {VISUAL_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`auth-form__variant-btn ${visualVariant === opt.key ? "auth-form__variant-btn--active" : ""}`}
                  onClick={() => setVisualVariant(opt.key)}
                  aria-pressed={visualVariant === opt.key}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <footer className="auth-form__foot">
            <span>{t("login.copyright", { year: new Date().getFullYear() })}</span>
            <Link to="/privacy">{t("login.privacyPolicy")}</Link>
          </footer>
        </div>
      </section>

      <AuthVisual variant={visualVariant} />
    </div>
  );
}
