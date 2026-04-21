import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { API_URL } from "../config/api.js";

/**
 * ResetPassword page — reached via the link in the password-reset email.
 *
 * Security: the token is in the URL hash fragment (#token=...), NOT a query
 * param. Hash fragments are never sent to the server, never appear in server
 * access logs, and are not included in the Referer header when the user
 * navigates away.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [tokenMissing, setTokenMissing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Read token from hash fragment — never from query params
  useEffect(() => {
    const hash = window.location.hash.slice(1); // strip leading '#'
    const params = new URLSearchParams(hash);
    const t = params.get("token");
    if (t) {
      setToken(t);
      // Clear token from hash so it doesn't stay in browser history after mount
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      setTokenMissing(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Token sent in POST body — never in the URL
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password. Please try again.");
        return;
      }

      toast.success("Password reset successfully. Please log in.");
      navigate("/login", { replace: true });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (tokenMissing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-zinc-100 mb-2">Invalid Reset Link</h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6">
            This password reset link is missing or invalid. Please request a new one.
          </p>
          <Link
            to="/login"
            className="inline-block px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-semibold text-gray-800 dark:text-zinc-100">SchoolSync</span>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-800 dark:text-zinc-100 mb-2">Set New Password</h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">Enter a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-colors">
              <Lock size={16} className="text-gray-400 dark:text-zinc-500 shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, upper, lower, number"
                className="flex-1 bg-transparent outline-none text-gray-800 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-sm"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={16} className="text-gray-400 dark:text-zinc-500" />
                ) : (
                  <Eye size={16} className="text-gray-400 dark:text-zinc-500" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-colors">
              <Lock size={16} className="text-gray-400 dark:text-zinc-500 shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="flex-1 bg-transparent outline-none text-gray-800 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-sm"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors mt-1 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <Link
            to="/login"
            className="text-center text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
          >
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
}
