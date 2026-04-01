import React, { useState, useCallback, Suspense } from "react";
import lazyWithRetry from "../utils/lazyWithRetry";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ErrorBoundary from "../components/ErrorBoundary";
import { Eye, EyeOff, Lock, Mail, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
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

            <div className="mb-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-3 py-2 text-xs text-amber-900 dark:text-amber-300">
              {t('login.inviteOnlyNote')}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
              <span className="text-xs text-gray-400 dark:text-zinc-500">{t('login.orContinueWith')}</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
            </div>

            {/* Social Login */}
            <div className="flex justify-center gap-3 mb-5">
              <button type="button" className="w-9 h-9 rounded-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>
              <button type="button" className="w-9 h-9 rounded-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </button>
              <button type="button" className="w-9 h-9 rounded-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button type="button" className="w-9 h-9 rounded-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
            </div>

            {/* Demo credentials */}
            <div className="pt-3 border-t border-gray-100 dark:border-zinc-800">
              <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1.5 text-center">{t('login.demoCredentials')}</p>
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="text-gray-600 dark:text-zinc-400">vikram@school.com</span>
                <span className="text-gray-300 dark:text-zinc-600">•</span>
                <span className="text-gray-600 dark:text-zinc-400">password123</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("vikram@school.com");
                    setPassword("password123");
                  }}
                  className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium ml-1"
                >
                  {t('login.autoFill')}
                </button>
              </div>
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
