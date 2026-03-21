import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User, Building2, Check, ShieldCheck } from "lucide-react";
import ErrorBoundary from "../components/ErrorBoundary";
import SchoolBuilding3D from "../components/SchoolBuilding3D";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function Signup() {
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
    inviteToken ? "" : "School onboarding is invite-only. Use the signup link sent to your school."
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
          `${API_URL}/auth/signup/invite-details?token=${encodeURIComponent(inviteToken)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Invite link is invalid or expired");
        }

        if (cancelled) {
          return;
        }

        setInviteDetails(data.invite);
        setFormData((prev) => ({
          ...prev,
          email: data.invite.email,
          schoolName: data.invite.schoolName,
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
      newErrors.submit = "A valid invite link is required to create an account.";
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Min 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email";
    }

    if (!formData.schoolName.trim()) {
      newErrors.schoolName = "Required";
    }

    if (!formData.password) {
      newErrors.password = "Required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Min 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Required";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "Required";
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

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
        <ErrorBoundary fallback={<div className="w-full h-full bg-gradient-to-br from-teal-50 via-white to-slate-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900" />}>
          <SchoolBuilding3D />
        </ErrorBoundary>
      </div>

      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center bg-white dark:bg-zinc-900 px-4 py-6 lg:py-0 h-full">
        <div className="w-full max-w-sm">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="text-lg font-semibold text-gray-800 dark:text-zinc-100">SchoolSync</span>
            </div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-zinc-100">Accept your school invite</h1>
            <p className="text-gray-500 dark:text-zinc-400 text-xs">
              New admin accounts are provisioned only from verified invite links.
            </p>
          </div>

          {inviteLoading ? (
            <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-5 text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Validating invite link...</p>
            </div>
          ) : accessBlocked ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-5">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 mb-2">
                <ShieldCheck size={18} />
                <h2 className="text-sm font-semibold">Invite required</h2>
              </div>
              <p className="text-sm text-amber-900 dark:text-amber-200">{inviteError}</p>
              <p className="text-xs text-amber-800 dark:text-amber-400 mt-2">
                Ask your SchoolSync onboarding contact for a fresh invite URL.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-4 w-full py-2 rounded-md text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors"
              >
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col" autoComplete="off">
              <div className="mb-3 rounded-xl border border-teal-100 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/30 px-3 py-2">
                <p className="text-xs font-medium text-teal-800 dark:text-teal-300">Invite verified</p>
                <p className="text-[11px] text-teal-700 dark:text-teal-400">
                  {inviteDetails?.schoolName} • {inviteDetails?.email}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-1.5 px-2 py-1.5 bg-white dark:bg-zinc-800 border rounded-md transition-colors ${
                    errors.fullName ? "border-red-300" : "border-gray-200 dark:border-zinc-700 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500"
                  }`}>
                    <User size={14} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="flex-1 bg-transparent outline-none text-gray-800 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-sm"
                      autoComplete="off"
                      value={formData.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                    />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-[10px] mt-0.5">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    Email <span className="text-red-500">*</span>
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
                  School Name <span className="text-red-500">*</span>
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
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-1.5 px-2 py-1.5 bg-white dark:bg-zinc-800 border rounded-md transition-colors ${
                    errors.password ? "border-red-300" : "border-gray-200 dark:border-zinc-700 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500"
                  }`}>
                    <Lock size={14} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 8 chars"
                      className="flex-1 bg-transparent outline-none text-gray-800 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-sm"
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
                  {errors.password && <p className="text-red-500 text-[10px] mt-0.5">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    Confirm <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-1.5 px-2 py-1.5 bg-white dark:bg-zinc-800 border rounded-md transition-colors ${
                    errors.confirmPassword ? "border-red-300" : "border-gray-200 dark:border-zinc-700 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500"
                  }`}>
                    <Lock size={14} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm"
                      className="flex-1 bg-transparent outline-none text-gray-800 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-sm"
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
                    I confirm I have reviewed the{" "}
                    <Link to="/privacy" className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium">
                      Privacy Policy
                    </Link>{" "}
                    and agree to create a school account under the platform terms.
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
                {loading ? "Creating..." : "Create Admin Account"}
              </button>

              <p className="text-center text-xs text-gray-600 dark:text-zinc-400 mt-2">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
                >
                  Sign in
                </button>
              </p>

              <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400 dark:text-zinc-500 mt-3">
                <p>© {new Date().getFullYear()} SchoolSync</p>
                <Link to="/privacy" className="hover:text-gray-600 dark:hover:text-zinc-300">Privacy Policy</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
