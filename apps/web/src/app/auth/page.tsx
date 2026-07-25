"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`.trim(),
            },
          },
        });
        if (error) {
          if (error.message.toLowerCase().includes("user already registered")) {
            throw new Error("This email is already registered. Please click 'Sign in here' below to log in.");
          }
          throw error;
        }
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to authenticate with Google.");
    }
  };

  return (
    <div
      className="min-h-screen w-full relative"
      style={{
        backgroundImage: "url('/auth-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* White overlay on the left side for readability */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.95) 25%, rgba(255,255,255,0.75) 40%, rgba(255,255,255,0.15) 55%, transparent 65%)",
        }}
      ></div>

      {/* Decorative circles (matching the Dribbble reference) */}
      <div
        className="absolute top-12 left-10 w-20 h-20 rounded-full border-2 opacity-20 pointer-events-none z-[1]"
        style={{ borderColor: "#a0aec0" }}
      ></div>
      <div
        className="absolute top-32 left-4 w-4 h-4 rounded-full opacity-15 pointer-events-none z-[1]"
        style={{ background: "#a0aec0" }}
      ></div>
      <div
        className="absolute bottom-20 left-8 w-6 h-6 rounded-full border-2 opacity-15 pointer-events-none z-[1]"
        style={{ borderColor: "#a0aec0" }}
      ></div>
      <div
        className="absolute bottom-40 left-24 w-3 h-3 rounded-full opacity-10 pointer-events-none z-[1]"
        style={{ background: "#a0aec0" }}
      ></div>

      {/* ── Content: Auth form on the left ── */}
      <div className="relative z-10 min-h-screen flex items-center px-8 sm:px-12 lg:px-20 xl:px-28">
        <div className="max-w-[400px] w-full">
          {/* Big Title */}
          <h1
            className="text-[3rem] sm:text-[3.5rem] lg:text-[4rem] font-black leading-[1.1] mb-6 tracking-tight"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            <span className="text-gray-800 block">Exploration</span>
            <span className="text-gray-800 block">Research</span>
            <span
              className="block"
              style={{
                background: "linear-gradient(135deg, #6b46c1, #38b2ac)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Scaffold
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-[340px]">
            Your personalized learning platform — intelligent flashcards,
            adaptive study rooms, and dynamic progress tracking to accelerate
            your growth.
          </p>

          {/* Auth Card */}
          <div
            className="rounded-2xl p-7 mb-6"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(16px)",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
            }}
          >
            <h2 className="text-lg font-extrabold text-gray-800 mb-1">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-400 text-xs font-medium mb-5">
              {isLogin
                ? "Sign in to continue your journey."
                : "Register to get started."}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-2.5 rounded-lg mb-4 font-medium">
                {error}
              </div>
            )}

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-200 text-gray-600 font-semibold py-2.5 px-4 rounded-xl text-sm hover:bg-gray-50 hover:border-gray-300 transition-all mb-4 group"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                className="group-hover:scale-110 transition-transform"
              >
                <path
                  fill="#EA4335"
                  d="M12.001 5.36c1.685 0 2.923.722 3.593 1.365l2.67-2.607C16.634 2.518 14.542 1.5 12.001 1.5c-4.606 0-8.528 2.628-10.457 6.467l3.14 2.436C6.182 7.151 8.847 5.36 12.001 5.36z"
                />
                <path
                  fill="#4285F4"
                  d="M23.498 12.275c0-.85-.075-1.666-.217-2.45H12.001v4.63h6.444c-.279 1.503-1.125 2.775-2.392 3.626l3.056 2.373c1.787-1.646 2.815-4.068 2.815-6.842z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.539 12c0-.742.128-1.46.36-2.126l-3.14-2.436A10.468 10.468 0 0 0 1.54 12c0 1.7.4 3.312 1.11 4.767l3.167-2.457A6.477 6.477 0 0 1 5.539 12z"
                />
                <path
                  fill="#34A853"
                  d="M12.001 22.5c3.228 0 5.938-1.071 7.915-2.902l-3.056-2.373c-1.071.718-2.439 1.144-4.859 1.144-3.155 0-5.819-1.79-6.559-4.282l-3.167 2.457c1.93 3.837 5.852 6.463 10.457 6.463z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                or
              </span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            {/* Name fields - only show on Register */}
            {!isLogin && (
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                    First Name
                  </label>
                  <input
                    type="text"
                    required={!isLogin}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all placeholder:text-gray-300"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required={!isLogin}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all placeholder:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all placeholder:text-gray-300"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-2.5 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "linear-gradient(135deg, #6b46c1, #805ad5)",
                  boxShadow: "0 6px 20px rgba(107, 70, 193, 0.3)",
                }}
              >
                {loading
                  ? "Processing..."
                  : isLogin
                  ? "Sign In"
                  : "Register Now"}
              </button>
            </form>

            <p className="text-xs font-medium text-gray-400 mt-5 text-center">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-purple-600 font-extrabold hover:underline transition-all"
              >
                {isLogin ? "Register here" : "Sign in here"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
