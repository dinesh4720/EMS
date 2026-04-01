import { API_URL } from '../config/api.js';
import { useCallback, useEffect, useState, Suspense } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User, Building2, Check, ShieldCheck } from "lucide-react";
import ErrorBoundary from "../components/ErrorBoundary";
import lazyWithRetry from "../utils/lazyWithRetry";
import { useTranslation, Trans } from "react-i18next";

// Mirror the WebGL safety checks from Login.jsx — direct import of SchoolBuilding3D
// can crash in headless/automated browsers due to shader compilation failures.
const hasWebGL = (() => {
  try {
    if (
      navigator.webdriver ||
      /HeadlessChrome|Headless|Puppeteer|Playwright|PhantomJS|Chrome-Lighthouse/i.test(navigator.userAgent) ||
      (!navigator.gpu && !window.chrome?.runtime)
    ) return false;
    if (window.self !== window.top) return false;
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return false;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) return false;
    gl.shaderSource(vs, "void main(){ gl_Position = vec4(0.0); }");
    gl.compileShader(vs);
    const ok = gl.getShaderParameter(vs, gl.COMPILE_STATUS);
    gl.deleteShader(vs);
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      if (/SwiftShader|llvmpipe|Software|ANGLE.*Direct3D9/i.test(renderer)) return false;
    }
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fs) return false;
    gl.shaderSource(fs, "precision mediump float; void main(){ gl_FragColor = vec4(1.0); }");
    gl.compileShader(fs);
    const fsOk = gl.getShaderParameter(fs, gl.COMPILE_STATUS);
    gl.deleteShader(fs);
    return ok && fsOk;
  } catch { return false; }
})();

const SchoolBuilding3D = hasWebGL
  ? lazyWithRetry(() => import("../components/SchoolBuilding3D"))
  : null;

function SignupVisualFallback() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-teal-50 via-white to-slate-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900" />
  );
}


export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("inviteToken") || "";

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    schoolName: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(Boolean(inviteToken));
  const [inviteError, setInviteError] = useState(
    inviteToken ? "" : t('signup.errors.inviteRequired')
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
          { credentials: 'include' }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Invite link is invalid or expired");
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        setInviteDetails(data?.invite || null);
        setFormData((prev) => ({
          ...prev,
          email: data?.invite?.email || '',
          schoolName: data?.invite?.schoolName || '',
        }));
      } catch (error) {
        if (!cancelled) {
          setInviteDetails(null);
          setInviteError(error.message || "Invite link is invalid or expired");
        }
      } finally {
        if (!cancelled) {
          setInviteLoading(false);
        }
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

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!inviteToken || !inviteDetails) {
      newErrors.submit = t('signup.errors.inviteRequired');
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('signup.errors.required');
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = t('signup.errors.minChars', { count: 2 });
    }

    if (!formData.email.trim()) {
      newErrors.email = t('signup.errors.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('signup.errors.invalidEmail');
    }

    if (!formData.schoolName.trim()) {
      newErrors.schoolName = t('signup.errors.required');
    }

    if (!formData.password) {
      newErrors.password = t('signup.errors.required');
    } else if (formData.password.length < 8) {
      newErrors.password = t('signup.errors.minChars', { count: 8 });
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = t('signup.errors.passwordUppercase');
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = t('signup.errors.passwordLowercase');
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = t('signup.errors.passwordNumber');
    } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      newErrors.password = t('signup.errors.passwordSpecial');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('signup.errors.required');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('signup.errors.passwordsMismatch');
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = t('signup.errors.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, inviteDetails, inviteToken]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
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

      navigate("/login", {
        state: { message: "Invite accepted. Please sign in with your new admin account." },
      });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message || "Failed to create account. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  }, [formData, inviteToken, navigate, validateForm]);

  const accessBlocked = !inviteToken || Boolean(inviteError);

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row overflow-hidden">
      <div className="hidden lg:flex flex-1 relative overflow-hidden h-full">
        {SchoolBuilding3D ? (
          <ErrorBoundary fallback={<SignupVisualFallback />}>
            <Suspense fallback={<SignupVisualFallback />}>
              <SchoolBuilding3D />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <SignupVisualFallback />
        )}
      </div>

      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center bg-white dark:bg-zinc-900 px-4 py-6 lg:py-0 h-full">
        <div className="w-full max-w-sm">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="text-lg font-semibold text-gray-800 dark:text-zinc-100">{t('pages.schoolSync1')}</span>
            </div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-zinc-100">{t('signup.title')}</h1>
            <p className="text-gray-500 dark:text-zinc-400 text-xs">
              {t('signup.subtitle')}
            </p>
          </div>

          {inviteLoading ? (
            <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-5 text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t('signup.validatingInvite')}</p>
            </div>
          ) : accessBlocked ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-5">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 mb-2">
                <ShieldCheck size={18} />
                <h2 className="text-sm font-semibold">{t('signup.inviteRequired')}</h2>
              </div>
              <p className="text-sm text-amber-900 dark:text-amber-200">{inviteError}</p>
              <p className="text-xs text-amber-800 dark:text-amber-400 mt-2">
                {t('signup.inviteHelp')}
              </p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-4 w-full py-2 rounded-md text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors"
              >
                {t('signup.backToLogin')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col" autoComplete="off">
              <div className="mb-3 rounded-xl border border-teal-100 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/30 px-3 py-2">
                <p className="text-xs font-medium text-teal-800 dark:text-teal-300">{t('signup.inviteVerified')}</p>
                <p className="text-[11px] text-teal-700 dark:text-teal-400">
                  {inviteDetails?.schoolName} • {inviteDetails?.email}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    {t('signup.fullNameLabel')} <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-1.5 px-2 py-1.5 bg-white dark:bg-zinc-800 border rounded-md transition-colors ${
                    errors.fullName ? "border-red-300" : "border-gray-200 dark:border-zinc-700 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500"
                  }`}>
                    <User size={14} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder={t('signup.fullNamePlaceholder')}
                      className="flex-1 bg-transparent outline-none text-gray-800 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-500 text-sm"
                      autoComplete="off"
                      value={formData.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                    />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-[10px] mt-0.5">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    {t('signup.emailLabel')} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-md">
                    <Mail size={14} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                    <input
                      type="email"
                      className="flex-1 bg-transparent outline-none text-gray-500 dark:text-zinc-400 text-sm"
                      value={formData.email}
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t('signup.schoolNameLabel')} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-md">
                  <Building2 size={14} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                  <input
                    type="text"
                    className="flex-1 bg-transparent outline-none text-gray-500 dark:text-zinc-400 text-sm"
                    value={formData.schoolName}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    {t('signup.passwordLabel')} <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-1.5 px-2 py-1.5 bg-white dark:bg-zinc-800 border rounded-md transition-colors ${
                    errors.password ? "border-red-300" : "border-gray-200 dark:border-zinc-700 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500"
                  }`}>
                    <Lock size={14} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={t('signup.passwordPlaceholder')}
                      className="flex-1 bg-transparent outline-none text-gray-800 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-500 text-sm"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                    />
                    <button
                      type="button"
                      className="p-0.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? (
                        <EyeOff size={14} className="text-gray-400 dark:text-zinc-500" />
                      ) : (
                        <Eye size={14} className="text-gray-400 dark:text-zinc-500" />
                      )}
                    </button>
                  </div>
                  {formData.password && (() => {
                    const p = formData.password;
                    const score = [p.length >= 8, /[A-Z]/.test(p), /[a-z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
                    const labels = ['', t('signup.passwordStrength.weak'), t('signup.passwordStrength.fair'), t('signup.passwordStrength.good'), t('signup.passwordStrength.strong'), t('signup.passwordStrength.veryStrong')];
                    const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-teal-500', 'bg-teal-600'];
                    return (
                      <div className="mt-1 space-y-0.5">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`h-0.5 flex-1 rounded ${i <= score ? colors[score] : 'bg-gray-200 dark:bg-zinc-700'}`} />
                          ))}
                        </div>
                        <p className={`text-[10px] ${score <= 2 ? 'text-red-500' : score === 3 ? 'text-yellow-500' : 'text-teal-600'}`}>{labels[score]}</p>
                      </div>
                    );
                  })()}
                  {errors.password && <p className="text-red-500 text-[10px] mt-0.5">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    {t('signup.confirmPasswordLabel')} <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-1.5 px-2 py-1.5 bg-white dark:bg-zinc-800 border rounded-md transition-colors ${
                    errors.confirmPassword ? "border-red-300" : "border-gray-200 dark:border-zinc-700 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500"
                  }`}>
                    <Lock size={14} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t('signup.confirmPasswordPlaceholder')}
                      className="flex-1 bg-transparent outline-none text-gray-800 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-500 text-sm"
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    />
                    <button
                      type="button"
                      className="p-0.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={14} className="text-gray-400 dark:text-zinc-500" />
                      ) : (
                        <Eye size={14} className="text-gray-400 dark:text-zinc-500" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-[10px] mt-0.5">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="mb-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={(e) => handleChange("agreeToTerms", e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      formData.agreeToTerms
                        ? "bg-teal-600 border-teal-600"
                        : errors.agreeToTerms
                          ? "border-red-300"
                          : "border-gray-300 dark:border-zinc-600"
                    }`}>
                      {formData.agreeToTerms && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-600 dark:text-zinc-400">
                    <Trans i18nKey="signup.agreeToTerms" components={{
                      privacyLink: <Link to="/privacy" className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium" />
                    }} />
                  </span>
                </label>
              </div>

              {errors.submit && (
                <div className="mb-2 p-2 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs text-center">
                  {errors.submit}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 rounded-md text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? t('signup.creating') : t('signup.createAccount')}
              </button>

              <p className="text-center text-xs text-gray-600 dark:text-zinc-400 mt-2">
                {t('signup.alreadyHaveAccount')}{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
                >
                  {t('signup.signIn')}
                </button>
              </p>

              <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400 dark:text-zinc-500 mt-3">
                <p>{t('signup.copyright', { year: new Date().getFullYear() })}</p>
                <Link to="/privacy" className="hover:text-gray-600 dark:hover:text-zinc-300">{t('signup.privacyPolicy')}</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
