import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  fieldLabelClass,
  inputShellClass,
  primaryButtonClass,
  textInputClass,
} from "../components/login/loginUi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const { login } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const toggleVisibility = () => setIsVisible((v) => !v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const motionSafe = (anim) => (prefersReducedMotion ? {} : anim);

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
      },
    }),
    []
  );

  const itemVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 10, filter: "blur(6px)" },
      show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { type: "spring", stiffness: 220, damping: 22 },
      },
    }),
    []
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.25] dark:opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.25) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Aurora gradient blobs */}
        <motion.div
          className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-[90px]"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(147,51,234,0.30), transparent 65%), radial-gradient(circle at 60% 60%, rgba(59,130,246,0.26), transparent 60%)",
          }}
          {...motionSafe({
            animate: { x: [0, 30, -10, 0], y: [0, -10, 20, 0] },
            transition: { duration: 10, ease: "easeInOut", repeat: Infinity },
          })}
        />

        <motion.div
          className="absolute -bottom-44 -right-44 h-[560px] w-[560px] rounded-full blur-[110px]"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(34,211,238,0.22), transparent 60%), radial-gradient(circle at 70% 70%, rgba(99,102,241,0.22), transparent 62%)",
          }}
          {...motionSafe({
            animate: { x: [0, -25, 15, 0], y: [0, 20, -12, 0] },
            transition: { duration: 12, ease: "easeInOut", repeat: Infinity },
          })}
        />

        {/* Existing utility animation for organic motion */}
        <div className="absolute top-[-18%] right-[-12%] h-[520px] w-[520px] rounded-full bg-purple-500/10 blur-[120px] animate-blob-bounce" />
      </div>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* Left / Brand */}
        <div className="hidden lg:flex flex-col justify-between p-12">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-xl"
          >
            <div className="flex items-center gap-3 mb-10">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-xl shadow-blue-500/20">
                  S
                </div>
                <div className="absolute inset-0 rounded-2xl blur-md bg-gradient-to-tr from-purple-600/25 to-blue-600/25 -z-10" />
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight">SchoolSync</div>
                <div className="text-sm text-default-500">Secure access portal</div>
              </div>
            </div>

            <h1 className="text-4xl font-bold leading-tight">
              Your school,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400">
                beautifully organized.
              </span>
            </h1>
            <p className="mt-5 text-default-500 text-lg leading-relaxed">
              Fast workflows, clearer insights, and a calmer day-to-day  all in one dashboard.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4 max-w-md">
              {["Attendance", "Fees", "Messaging", "Payroll"].map((t) => (
                <div
                  key={t}
                  className="rounded-2xl border border-default-200/70 bg-background/40 backdrop-blur-md px-4 py-3 shadow-sm"
                >
                  <div className="text-sm font-semibold">{t}</div>
                  <div className="text-xs text-default-500 mt-0.5">Realtime & reliable</div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="text-xs text-default-500">
            © {new Date().getFullYear()} SchoolSync. All rights reserved.
          </div>
        </div>

        {/* Right / Form */}
        <div className="flex items-center justify-center p-6 lg:p-10">
          <motion.div
            className="w-full max-w-md"
            variants={containerVariants}
            initial={prefersReducedMotion ? false : "hidden"}
            animate={prefersReducedMotion ? false : "show"}
          >
            <motion.div variants={itemVariants} className="mb-7">
              {/* Mobile brand header */}
              <div className="lg:hidden flex items-center gap-3 mb-8">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-xl shadow-blue-500/20">
                  S
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight">SchoolSync</div>
                  <div className="text-sm text-default-500">Secure access portal</div>
                </div>
              </div>

              <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
              <p className="mt-2 text-default-500">Sign in to continue to your dashboard.</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="rounded-3xl border border-default-200 bg-background/70 backdrop-blur-xl shadow-xl shadow-default-200/20"
            >
              <div className="p-6 sm:p-7">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-4">
                    <div>
                      <label className={fieldLabelClass} htmlFor="login-email">
                        Email
                      </label>
                      <div className={inputShellClass}>
                        <Mail size={16} className="text-default-400" />
                        <input
                          id="login-email"
                          type="email"
                          placeholder="name@school.com"
                          className={textInputClass}
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className={fieldLabelClass} htmlFor="login-password">
                        Password
                      </label>
                      <div className={inputShellClass}>
                        <Lock size={16} className="text-default-400" />
                        <input
                          id="login-password"
                          type={isVisible ? "text" : "password"}
                          placeholder="Enter your password"
                          className={textInputClass}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="p-0.5 hover:bg-default-200 rounded cursor-pointer"
                          onClick={toggleVisibility}
                          aria-label={isVisible ? "Hide password" : "Show password"}
                        >
                          {isVisible ? (
                            <EyeOff size={14} className="text-default-400" />
                          ) : (
                            <Eye size={14} className="text-default-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      {...motionSafe({
                        initial: { opacity: 0, y: -6 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.25 },
                      })}
                      className="p-3 rounded-lg bg-danger-50 text-danger-600 text-sm font-medium border border-danger-200"
                    >
                      {error}
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className={`${primaryButtonClass} ${loading ? "opacity-80 cursor-not-allowed" : ""}`}
                    {...motionSafe({ whileHover: { y: -1 }, whileTap: { scale: 0.99 } })}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </motion.button>

                  <div className="text-center text-sm text-default-500">
                    Forgot your password?{" "}
                    <a href="#" className="text-primary hover:underline">
                      Contact Admin
                    </a>
                  </div>
                </form>
              </div>

              <div className="px-6 sm:px-7 pb-6 sm:pb-7">
                <div className="rounded-lg border border-default-200 bg-default-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono text-default-500">DEMO</p>
                      <p className="text-sm font-semibold mt-1">superid@test.com</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-default-500">PASSWORD</p>
                      <p className="text-sm font-semibold mt-1">12345</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-6 text-center text-xs text-default-500">
              Tip: For best performance, use Chrome or Edge.
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
