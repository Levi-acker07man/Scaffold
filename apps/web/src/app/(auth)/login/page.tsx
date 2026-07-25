"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const validE = email.includes("@");
  const validP = password.length >= 6;
  const validName = firstName.trim().length > 0 && lastName.trim().length > 0;

  const ready = isRegister
    ? validE && validP && validName && !loading
    : validE && validP && !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ready) {
      setLoading(true);
      // TODO: Wire up Supabase Auth
      setTimeout(() => setLoading(false), 1500);
    }
  };

  return (
    <div className="screen">
      <form
        onSubmit={handleSubmit}
        className="clay w-full max-w-[420px] pt-10 px-[34px] pb-[34px] flex flex-col gap-4"
      >
        {/* Branding */}
        <div className="flex flex-col items-center justify-center">
          {/* Scaffold Logo */}
          <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-2"
            style={{
              background: 'var(--accent-bg)',
              border: '2px solid var(--accent-border)',
              boxShadow: '4px 4px 10px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5), inset 4px 4px 8px rgba(107,70,193,0.08)'
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent-base)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <h1 className="brand-title mt-2">Scaffold</h1>
          <p className="brand-sub">Learning AI</p>
        </div>

        {/* Registration name fields */}
        {isRegister && (
          <div className="flex gap-2 w-full">
            <div className="field flex-1">
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={firstName ? "has-val" : ""}
              />
              <label htmlFor="firstName">First Name</label>
            </div>
            <div className="field flex-1">
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={lastName ? "has-val" : ""}
              />
              <label htmlFor="lastName">Last Name</label>
            </div>
          </div>
        )}

        {/* Email */}
        <div className="field">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={
              (validE ? "valid " : "") + (email ? "has-val" : "")
            }
          />
          <label htmlFor="email">Email Address</label>
          <span className="check">&#10003;</span>
        </div>

        {/* Password */}
        <div className="field">
          <input
            id="pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={
              (validP ? "valid " : "") + (password ? "has-val" : "")
            }
          />
          <label htmlFor="pw">Password</label>
          <span className="check">&#10003;</span>
        </div>

        {/* Submit */}
        <button type="submit" className="cta-button w-full" disabled={!ready}>
          {loading
            ? "Authenticating..."
            : isRegister
            ? "Register Account"
            : "Sign In"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-2">
          <div className="h-px bg-black/10 flex-1"></div>
          <span className="text-xs text-text-dim uppercase tracking-wider">
            or
          </span>
          <div className="h-px bg-black/10 flex-1"></div>
        </div>

        {/* Google Auth */}
        <button
          type="button"
          className="w-full py-3 px-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-3 text-text"
          style={{
            background: 'var(--clay-bg)',
            border: '1px solid var(--clay-border)',
            boxShadow: '3px 3px 6px rgba(0,0,0,0.05), inset -3px -3px 6px rgba(255,255,255,0.5), inset 3px 3px 6px rgba(0,0,0,0.03)'
          }}
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Toggle */}
        <p className="text-center text-xs text-text-dim mt-2">
          {isRegister
            ? "Already have an account? "
            : "Don't have an account? "}
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-accent-base font-bold hover:underline transition-colors"
          >
            {isRegister ? "Log in" : "Register"}
          </button>
        </p>
      </form>
    </div>
  );
}
