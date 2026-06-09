import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { Building2, Eye, EyeOff, Lock, Mail, ShieldCheck, User } from "lucide-react";

import { API_URL } from "../config/api.js";
import { signupSchema, parseFormSchema } from "../validators/formSchemas";
import { useAuth } from "../context/AuthContext";

import AuthVisual from "../components/auth/AuthVisual";
import AuthBrand from "../components/auth/AuthBrand";
import PasswordStrengthMeter from "../components/auth/PasswordStrengthMeter";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  schoolName: "",
  password: "",
  confirmPassword: "",
  agreeToTerms: false,
};

function InviteValidatingState({ label }) {
  return (
    <div
      className="auth-form__alert"
      role="status"
      aria-busy="true"
      aria-live="polite"
      style={{ background: "var(--surface-2)", color: "var(--fg-subtle)", border: "1px solid var(--border)" }}
    >
      <span className="dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("inviteToken") || "";

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(Boolean(inviteToken));
  const [inviteError, setInviteError] = useState(
    inviteToken ? "" : t("signup.errors.inviteRequired")
  );
  const [inviteDetails, setInviteDetails] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!inviteToken) {
      setInviteLoading(false);
      setInviteDetails(null);
      return undefined;
    }

    async function loadInvite() {
      setInviteLoading(true);
      setInviteError("");
      try {
        const response = await fetch(
          `${API_URL}/auth/signup/invite-details?token=${encodeURIComponent(inviteToken)}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Invite link is invalid or expired");
        }
        const data = await response.json();
        if (cancelled) return;
        setInviteDetails(data?.invite || null);
        setFormData((prev) => ({
          ...prev,
          email: data?.invite?.email || "",
          schoolName: data?.invite?.schoolName || "",
        }));
      } catch (error) {
        if (!cancelled) {
          setInviteDetails(null);
          setInviteError(error.message || "Invite link is invalid or expired");
        }
      } finally {
        if (!cancelled) setInviteLoading(false);
      }
    }

    loadInvite();
    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "", submit: "" }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!inviteToken || !inviteDetails) {
        setErrors({ submit: t("signup.errors.inviteRequired") });
        return;
      }

      const parsed = parseFormSchema(signupSchema, formData);
      if (!parsed.success) {
        setErrors(parsed.errors);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/auth/signup`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.fullName,
            email: formData.email,
            schoolName: formData.schoolName,
            password: formData.password,
            inviteToken,
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Signup failed");
        }
        const data = await response.json();
        // Log the new admin in immediately using the returned auth payload
        setAuthenticatedUser({
          ...data.user,
          school: data.school,
          token: data.token,
          refreshToken: data.refreshToken,
          tokenExpiresAt: data.tokenExpiresAt,
        });
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          submit: error.message || "Failed to create account. Please try again.",
        }));
      } finally {
        setLoading(false);
      }
    },
    [formData, inviteToken, inviteDetails, navigate, t]
  );

  const accessBlocked = !inviteToken || Boolean(inviteError);

  return (
    <div className="auth-shell">
      <section className="auth-form">
        <div className="auth-form__inner">
          <div className="auth-form__brand">
            <AuthBrand />
          </div>

          <header className="auth-form__head">
            <h1 className="auth-form__title">{t("signup.title")}</h1>
            <p className="auth-form__sub">{t("signup.subtitle")}</p>
          </header>

          {inviteLoading ? (
            <InviteValidatingState label={t("signup.validatingInvite")} />
          ) : accessBlocked ? (
            <>
              <div className="auth-form__alert auth-form__alert--danger" role="alert">
                <ShieldCheck size={14} aria-hidden="true" />
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                  <strong>{t("signup.inviteRequired")}</strong>
                  <span>{inviteError}</span>
                  <span style={{ opacity: 0.8 }}>{t("signup.inviteHelp")}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn--accent btn--block"
                onClick={() => navigate("/login")}
              >
                {t("signup.backToLogin")}
              </button>
            </>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="auth-form__form"
              autoComplete="off"
              noValidate
            >
              <div className="auth-form__alert auth-form__alert--success" role="status">
                <span className="dot" aria-hidden="true" />
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <strong>{t("signup.inviteVerified")}</strong>
                  <span style={{ opacity: 0.9 }}>
                    {inviteDetails?.schoolName} • {inviteDetails?.email}
                  </span>
                </div>
              </div>

              <div className="field">
                <label htmlFor="signup-fullname" className="field__label">
                  {t("signup.fullNameLabel")}
                  <span className="req" aria-hidden="true">*</span>
                </label>
                <div className="field__icon-wrap">
                  <User size={14} className="field__icon" aria-hidden="true" />
                  <input
                    id="signup-fullname"
                    className={`input input--with-icon ${errors.fullName ? "input--err" : ""}`}
                    type="text"
                    placeholder={t("signup.fullNamePlaceholder")}
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    autoComplete="name"
                    required
                    aria-invalid={Boolean(errors.fullName) || undefined}
                    aria-describedby={errors.fullName ? "signup-fullname-err" : undefined}
                  />
                </div>
                {errors.fullName && (
                  <span id="signup-fullname-err" className="field__hint field__hint--danger">
                    {errors.fullName}
                  </span>
                )}
              </div>

              <div className="fgrid">
                <div className="field">
                  <label htmlFor="signup-email" className="field__label">
                    {t("signup.emailLabel")}
                    <span className="req" aria-hidden="true">*</span>
                  </label>
                  <div className="field__icon-wrap">
                    <Mail size={14} className="field__icon" aria-hidden="true" />
                    <input
                      id="signup-email"
                      className="input input--with-icon"
                      type="email"
                      value={formData.email}
                      disabled
                      readOnly
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="signup-school" className="field__label">
                    {t("signup.schoolNameLabel")}
                    <span className="req" aria-hidden="true">*</span>
                  </label>
                  <div className="field__icon-wrap">
                    <Building2 size={14} className="field__icon" aria-hidden="true" />
                    <input
                      id="signup-school"
                      className="input input--with-icon"
                      type="text"
                      value={formData.schoolName}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="field">
                <label htmlFor="signup-password" className="field__label">
                  {t("signup.passwordLabel")}
                  <span className="req" aria-hidden="true">*</span>
                </label>
                <div className="field__icon-wrap">
                  <Lock size={14} className="field__icon" aria-hidden="true" />
                  <input
                    id="signup-password"
                    className={`input input--with-icon input--with-action ${
                      errors.password ? "input--err" : ""
                    }`}
                    type={showPassword ? "text" : "password"}
                    placeholder={t("signup.passwordPlaceholder")}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    autoComplete="new-password"
                    required
                    aria-invalid={Boolean(errors.password) || undefined}
                    aria-describedby={errors.password ? "signup-password-err" : undefined}
                  />
                  <button
                    type="button"
                    className="field__action"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? t("login.hidePassword") : t("login.showPassword")
                    }
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && (
                  <span id="signup-password-err" className="field__hint field__hint--danger">
                    {errors.password}
                  </span>
                )}
                <PasswordStrengthMeter password={formData.password} />
              </div>

              <div className="field">
                <label htmlFor="signup-confirm" className="field__label">
                  {t("signup.confirmPasswordLabel")}
                  <span className="req" aria-hidden="true">*</span>
                </label>
                <div className="field__icon-wrap">
                  <Lock size={14} className="field__icon" aria-hidden="true" />
                  <input
                    id="signup-confirm"
                    className={`input input--with-icon input--with-action ${
                      errors.confirmPassword ? "input--err" : ""
                    }`}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("signup.confirmPasswordPlaceholder")}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    autoComplete="new-password"
                    required
                    aria-invalid={Boolean(errors.confirmPassword) || undefined}
                    aria-describedby={errors.confirmPassword ? "signup-confirm-err" : undefined}
                  />
                  <button
                    type="button"
                    className="field__action"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword ? t("login.hidePassword") : t("login.showPassword")
                    }
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span id="signup-confirm-err" className="field__hint field__hint--danger">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>

              <label htmlFor="signup-terms" className="signup-terms">
                <input
                  id="signup-terms"
                  type="checkbox"
                  className="signup-terms__input"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleChange("agreeToTerms", e.target.checked)}
                  aria-invalid={Boolean(errors.agreeToTerms) || undefined}
                  aria-describedby={errors.agreeToTerms ? "signup-terms-err" : undefined}
                />
                <span className="signup-terms__text">
                  <Trans
                    i18nKey="signup.agreeToTerms"
                    components={{
                      privacyLink: <Link to="/privacy" className="auth-form__link" />,
                    }}
                  />
                </span>
              </label>
              {errors.agreeToTerms && (
                <span id="signup-terms-err" className="field__hint field__hint--danger">
                  {errors.agreeToTerms}
                </span>
              )}

              {errors.submit && (
                <div className="auth-form__alert auth-form__alert--danger" role="alert">
                  <span>{errors.submit}</span>
                </div>
              )}

              <div className="auth-form__actions">
                <span className="auth-form__kbd-hint" aria-hidden="true">
                  <span className="kbd">↵</span>
                  {t("login.enterToSignIn", "to submit")}
                </span>
              </div>

              <button
                type="submit"
                className="btn btn--accent btn--block"
                disabled={loading}
                aria-busy={loading || undefined}
              >
                {loading ? t("signup.creating") : t("signup.createAccount")}
              </button>

              <p className="auth-form__notice">
                {t("signup.alreadyHaveAccount")}{" "}
                <Link to="/login" className="auth-form__link">
                  {t("signup.signIn")}
                </Link>
              </p>
            </form>
          )}

          <footer className="auth-form__foot">
            <span>{t("signup.copyright", { year: new Date().getFullYear() })}</span>
            <Link to="/privacy">{t("signup.privacyPolicy")}</Link>
          </footer>
        </div>
      </section>

      <AuthVisual />
    </div>
  );
}
