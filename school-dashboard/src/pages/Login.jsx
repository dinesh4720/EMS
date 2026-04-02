import React, { useState, useCallback, Suspense } from "react";
import lazyWithRetry from "../utils/lazyWithRetry";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ErrorBoundary from "../components/ErrorBoundary";
import { Eye, EyeOff, Lock, Mail, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { APP_CONFIG } from "../utils/constants";

// Only import the 3D component if WebGL is actually available AND we're not in a headless/automated browser
// Three.js shader compilation can crash in headless/automated environments even if WebGL context exists
const hasWebGL = (() => {
  try {
    // Headless/automated browsers lack full GPU — skip 3D to avoid noisy console errors
    if (
      navigator.webdriver ||
      /HeadlessChrome|Headless|Puppeteer|Playwright|PhantomJS|Chrome-Lighthouse/i.test(navigator.userAgent) ||
      (!navigator.gpu && !window.chrome?.runtime) // Likely not a real desktop Chrome
    ) return false;
    // Skip if running inside an iframe or MCP preview tool
    if (window.self !== window.top) return false;
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return false;
    // Test actual shader compilation (not just context creation)
    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) return false;
    gl.shaderSource(vs, "void main(){ gl_Position = vec4(0.0); }");
    gl.compileShader(vs);
    const ok = gl.getShaderParameter(vs, gl.COMPILE_STATUS);
    gl.deleteShader(vs);
    // Also check renderer — SwiftShader / software renderers often crash Three.js
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      if (/SwiftShader|llvmpipe|Software|ANGLE.*Direct3D9/i.test(renderer)) return false;
    }
    // Test a fragment shader too — some environments pass vertex but fail fragment
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

function LoginVisualFallback() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-teal-50 via-white to-slate-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900" />
  );
}

const MAX_ATTEMPTS = APP_CONFIG.MAX_LOGIN_ATTEMPTS;
const LOCKOUT_MS = APP_CONFIG.LOCKOUT_DURATION_MS;
const LOCKOUT_KEY = 'login_lockout';

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
  } catch { /* ignore */ }
}

function clearLockoutState() {
  try {
    sessionStorage.removeItem(LOCKOUT_KEY);
  } catch { /* ignore */ }
}

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const successMessage = location.state?.message;

  const toggleVisibility = useCallback(() => setIsVisible((v) => !v), []);

  // Countdown timer for lockout
  React.useEffect(() => {
    const state = getLockoutState();
    if (!state.lockedUntil || Date.now() >= state.lockedUntil) return;

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

    return () => { active = false; clearInterval(interval); };
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError("");

    // Check lockout
    const lockout = getLockoutState();
    if (lockout.lockedUntil && Date.now() < lockout.lockedUntil) {
      const remaining = Math.ceil((lockout.lockedUntil - Date.now()) / 1000);
      setLockoutRemaining(remaining);
      setError(t('login.lockoutError', { mins: Math.ceil(remaining / 60), secs: remaining % 60 }));
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      clearLockoutState();
    } catch (err) {
      const state = getLockoutState();
      const attempts = (state.attempts || 0) + 1;

      if (attempts >= MAX_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCKOUT_MS;
        saveLockoutState({ attempts, lockedUntil });
        const mins = Math.ceil(LOCKOUT_MS / 60000);
        setError(t('login.lockedFor', { mins }));
        setLockoutRemaining(Math.ceil(LOCKOUT_MS / 1000));
      } else {
        saveLockoutState({ attempts, lockedUntil: null });
        const remaining = MAX_ATTEMPTS - attempts;
        setError(t('login.loginFailedAttempts', { message: err?.message || "Login failed", remaining, plural: remaining !== 1 ? "s" : "" }));
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, login]);

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - 3D School Building - Hidden on mobile */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden h-full">
        {SchoolBuilding3D ? (
          <ErrorBoundary fallback={<LoginVisualFallback />}>
            <Suspense fallback={<LoginVisualFallback />}>
              <SchoolBuilding3D />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <LoginVisualFallback />
        )}
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center bg-white dark:bg-zinc-900 p-6 lg:p-0 h-full overflow-y-auto">
        <div className="w-full max-w-xs flex-shrink-0">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-semibold text-gray-800 dark:text-zinc-100">{t('pages.schoolSync1')}</span>
          </div>

          {/* Welcome Text */}
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-gray-800 dark:text-zinc-100 mb-2">{t('login.welcome')}</h1>
            <p className="text-gray-500 dark:text-zinc-400 text-sm">{t('login.subtitle')}</p>
          </div>

          {/* Success Message from Signup */}
          {successMessage && (
            <div className="mb-4 p-2.5 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm text-center flex items-center justify-center gap-2">
              <CheckCircle size={16} />
              {successMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col" autoComplete="off">
            {/* Email */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                {t('login.emailLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-colors autofill-fix">
                <Mail size={16} className="text-gray-400 dark:text-zinc-500" />
                <input
                  id="login-email"
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  className="flex-1 bg-transparent outline-none text-gray-800 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-500 text-sm autofill:bg-white autofill:text-gray-800"
                  autoComplete="off"
                  data-form-type="other"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                {t('login.passwordLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-colors autofill-fix">
                <Lock size={16} className="text-gray-400 dark:text-zinc-500" />
                <input
                  id="login-password"
                  type={isVisible ? "text" : "password"}
                  placeholder={t('login.passwordPlaceholder')}
                  className="flex-1 bg-transparent outline-none text-gray-800 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-500 text-sm autofill:bg-white autofill:text-gray-800"
                  autoComplete="new-password"
                  data-form-type="other"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition-colors"
                  onClick={toggleVisibility}
                  aria-label={isVisible ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {isVisible ? (
                    <EyeOff size={16} className="text-gray-400 dark:text-zinc-500" />
                  ) : (
                    <Eye size={16} className="text-gray-400 dark:text-zinc-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Buttons */}
            <button
              type="submit"
              disabled={loading || lockoutRemaining > 0}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors mb-2 ${
                loading || lockoutRemaining > 0 ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? t('login.signingIn') : lockoutRemaining > 0 ? t('login.locked', { seconds: lockoutRemaining }) : t('login.signIn')}
            </button>

            {/* Forgot Password + Invite Note */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => toast(t('login.forgotPasswordToast', 'Contact your administrator to reset your password.'), { icon: 'ℹ️' })}
                className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
              >
                {t('login.forgotPassword', 'Forgot Password?')}
              </button>
            </div>

            <div className="mb-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-3 py-2 text-xs text-amber-900 dark:text-amber-300">
              {t('login.inviteOnlyNote')}
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-zinc-500 mt-5 pt-3 border-t border-gray-100 dark:border-zinc-800">
            <p>{t('login.copyright', { year: new Date().getFullYear() })}</p>
            <Link to="/privacy" className="hover:text-gray-600 dark:hover:text-zinc-300">{t('login.privacyPolicy')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
