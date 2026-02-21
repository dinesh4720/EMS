import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User, Building2, Check } from "lucide-react";
import SchoolBuilding3D from "../components/SchoolBuilding3D";

export default function Signup() {
  const navigate = useNavigate();

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors = {};

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
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          schoolName: formData.schoolName,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      navigate('/login', {
        state: { message: 'Account created successfully! Please sign in.' }
      });
    } catch (err) {
      setErrors({ submit: err.message || "Failed to create account. Please try again." });
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, navigate]);

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - 3D School Building - Hidden on mobile */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden h-full">
        <SchoolBuilding3D />
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center bg-white px-4 py-3 lg:py-0 h-full">
        <div className="w-full max-w-sm">
          {/* Logo & Header */}
          <div className="text-center mb-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="text-lg font-semibold text-gray-800">SchoolSync</span>
            </div>
            <h1 className="text-lg font-bold text-gray-800">Create your account</h1>
            <p className="text-gray-500 text-xs">Get started with SchoolSync today</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col" autoComplete="off">
            {/* Name & Email Row */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-1.5 px-2 py-1.5 bg-white border rounded-md transition-colors ${
                  errors.fullName ? 'border-red-300' : 'border-gray-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500'
                }`}>
                  <User size={14} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                    autoComplete="off"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-500 text-[10px] mt-0.5">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-1.5 px-2 py-1.5 bg-white border rounded-md transition-colors ${
                  errors.email ? 'border-red-300' : 'border-gray-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500'
                }`}>
                  <Mail size={14} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                    autoComplete="off"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-[10px] mt-0.5">{errors.email}</p>
                )}
              </div>
            </div>

            {/* School Name */}
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                School Name <span className="text-red-500">*</span>
              </label>
              <div className={`flex items-center gap-1.5 px-2 py-1.5 bg-white border rounded-md transition-colors ${
                errors.schoolName ? 'border-red-300' : 'border-gray-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500'
              }`}>
                <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Enter your school name"
                  className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                  autoComplete="off"
                  value={formData.schoolName}
                  onChange={(e) => handleChange("schoolName", e.target.value)}
                />
              </div>
              {errors.schoolName && (
                <p className="text-red-500 text-[10px] mt-0.5">{errors.schoolName}</p>
              )}
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-1.5 px-2 py-1.5 bg-white border rounded-md transition-colors ${
                  errors.password ? 'border-red-300' : 'border-gray-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500'
                }`}>
                  <Lock size={14} className="text-gray-400 flex-shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 chars"
                    className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                  />
                  <button
                    type="button"
                    className="p-0.5 hover:bg-gray-100 rounded"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOff size={14} className="text-gray-400" />
                    ) : (
                      <Eye size={14} className="text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-[10px] mt-0.5">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Confirm <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-1.5 px-2 py-1.5 bg-white border rounded-md transition-colors ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500'
                }`}>
                  <Lock size={14} className="text-gray-400 flex-shrink-0" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm"
                    className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  />
                  <button
                    type="button"
                    className="p-0.5 hover:bg-gray-100 rounded"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={14} className="text-gray-400" />
                    ) : (
                      <Eye size={14} className="text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-[10px] mt-0.5">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Terms Checkbox */}
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
                        : "border-gray-300"
                  }`}>
                    {formData.agreeToTerms && (
                      <Check size={10} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-gray-600">
                  I agree to the{" "}
                  <a href="#" className="text-teal-600 hover:text-teal-700 font-medium">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-teal-600 hover:text-teal-700 font-medium">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="mb-2 p-2 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs text-center">
                {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-md text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Creating..." : "Create Account"}
            </button>

            {/* Sign In Link */}
            <p className="text-center text-xs text-gray-600 mt-2">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Sign in
              </button>
            </p>

            {/* Divider */}
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] text-gray-400">Or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Social Signup */}
            <div className="flex justify-center gap-2">
              <button type="button" className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>
              <button type="button" className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </button>
              <button type="button" className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button type="button" className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400 mt-2">
              <p>© {new Date().getFullYear()} SchoolSync</p>
              <a href="#" className="hover:text-gray-600">Terms</a>
              <a href="#" className="hover:text-gray-600">Privacy</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
