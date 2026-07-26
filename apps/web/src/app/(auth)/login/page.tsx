"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ─── Typewriter words ─── */
const TYPEWRITER = ["Learning AI", "Socratic Method", "Micro-Lessons", "Deep Knowledge", "Smart Practice"];

/* ─── Password strength labels ─── */
const PW_LABELS = ["", "Weak", "Fair", "Good", "Strong", "Excellent!"];
const PW_COLORS = ["", "#ef4444", "#f59e0b", "#eab308", "#22c55e", "#4f46e5"];

/* ─── Time-based greeting ─── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return { text: "Burning the midnight oil?", emoji: "🌙" };
  if (h < 12) return { text: "Good Morning!", emoji: "☀️" };
  if (h < 17) return { text: "Good Afternoon!", emoji: "🌤️" };
  if (h < 21) return { text: "Good Evening!", emoji: "🌅" };
  return { text: "Night Owl Mode!", emoji: "🦉" };
}

/* ─── Password strength calculator ─── */
function calcPwStrength(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

/* ─── Ink-splash colors ─── */
const SPLASH_COLORS = [
  "rgba(79,70,229,0.5)", "rgba(99,102,241,0.45)", "rgba(139,92,246,0.4)",
  "rgba(59,130,246,0.4)", "rgba(16,185,129,0.35)", "rgba(245,158,11,0.35)",
];

/* ─── Floating education SVGs ─── */
const FloatingIcons = () => (
  <div className="lp-floats" aria-hidden="true">
    <div className="lp-fi lp-fi1"><span>π</span></div>
    <div className="lp-fi lp-fi2"><span>∑</span></div>
    <div className="lp-fi lp-fi3"><span>∞</span></div>
    <div className="lp-fi lp-fi4"><span>Δ</span></div>
    <div className="lp-fi lp-fi5"><span>λ</span></div>
    <div className="lp-fi lp-fi6"><span>Ω</span></div>
    <div className="lp-fi lp-fi7">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    </div>
    <div className="lp-fi lp-fi8">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
    </div>
  </div>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  /* Typewriter */
  const [twWordIdx, setTwWordIdx] = useState(0);
  const [twCharIdx, setTwCharIdx] = useState(0);
  const [twDeleting, setTwDeleting] = useState(false);

  /* Greeting */
  const [greeting] = useState(getGreeting);

  /* Steps progress */
  const filledSteps = [email.includes("@"), password.length >= 6, ...(isRegister ? [firstName.trim().length > 0 && lastName.trim().length > 0] : [])];
  const completedCount = filledSteps.filter(Boolean).length;
  const totalSteps = filledSteps.length;
  const progressPct = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  /* Ink splash */
  const wrapperRef = useRef<HTMLDivElement>(null);

  const validE = email.includes("@");
  const validP = password.length >= 6;
  const validName = firstName.trim().length > 0 && lastName.trim().length > 0;
  const pwStrength = calcPwStrength(password);

  const ready = isRegister
    ? validE && validP && validName && !loading
    : validE && validP && !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ready) {
      setLoading(true);
      setTimeout(() => setLoading(false), 1500);
    }
  };

  /* Typewriter effect */
  useEffect(() => {
    const word = TYPEWRITER[twWordIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!twDeleting && twCharIdx < word.length) {
      timeout = setTimeout(() => setTwCharIdx((c) => c + 1), 80);
    } else if (!twDeleting && twCharIdx === word.length) {
      timeout = setTimeout(() => setTwDeleting(true), 2200);
    } else if (twDeleting && twCharIdx > 0) {
      timeout = setTimeout(() => setTwCharIdx((c) => c - 1), 40);
    } else if (twDeleting && twCharIdx === 0) {
      setTwDeleting(false);
      setTwWordIdx((i) => (i + 1) % TYPEWRITER.length);
    }
    return () => clearTimeout(timeout);
  }, [twCharIdx, twDeleting, twWordIdx]);

  /* Ink splash on click */
  const handleBgClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest("form") || t.closest("button") || t.closest("input")) return;
    const rect = wrapperRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement("span");
      dot.className = "lp-ink";
      const color = SPLASH_COLORS[Math.floor(Math.random() * SPLASH_COLORS.length)];
      const size = 5 + Math.random() * 8;
      const dx = (Math.random() - 0.5) * 80;
      const dy = -(15 + Math.random() * 50);
      dot.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${color};--dx:${dx}px;--dy:${dy}px;`;
      wrapperRef.current!.appendChild(dot);
      setTimeout(() => dot.remove(), 750);
    }
  }, []);

  return (
    <div className="lp-wrapper" ref={wrapperRef} onClick={handleBgClick}>
      <FloatingIcons />

      <div className="lp-content">
        {/* Greeting badge */}
        <div className="lp-greeting">
          <span className="lp-greeting-emoji">{greeting.emoji}</span>
          <span className="lp-greeting-text">{greeting.text}</span>
        </div>

        {/* Glow border form wrapper */}
        <div className="lp-glow">
          <form onSubmit={handleSubmit} className="clay lp-form">
            {/* Logo */}
            <div className="flex flex-col items-center justify-center">
              <div className="lp-logo">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent-base)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <h1 className="brand-title mt-1">Scaffold</h1>
              <p className="brand-sub lp-typewriter">
                {TYPEWRITER[twWordIdx].slice(0, twCharIdx)}
                <span className="lp-cursor">|</span>
              </p>
            </div>

            {/* Progress bar */}
            <div className="lp-progress-wrap">
              <div className="lp-progress-bar">
                <div
                  className="lp-progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="lp-progress-label">
                {completedCount === totalSteps && totalSteps > 0
                  ? "✅ Ready to go!"
                  : `${totalSteps - completedCount} step${totalSteps - completedCount !== 1 ? 's' : ''} to go`}
              </span>
            </div>

            {/* Registration name fields */}
            {isRegister && (
              <div className="flex gap-2 w-full lp-field-enter">
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
                className={(validE ? "valid " : "") + (email ? "has-val" : "")}
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
                className={(validP ? "valid " : "") + (password ? "has-val" : "")}
              />
              <label htmlFor="pw">Password</label>
              <span className="check">&#10003;</span>
            </div>

            {/* Password strength meter */}
            {password.length > 0 && (
              <div className="lp-pw-strength lp-field-enter">
                <div className="lp-pw-bars">
                  {[1,2,3,4,5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`lp-pw-bar ${pwStrength >= lvl ? 'lp-pw-bar-on' : ''}`}
                      style={{ background: pwStrength >= lvl ? PW_COLORS[pwStrength] : undefined }}
                    />
                  ))}
                </div>
                <span className="lp-pw-label" style={{ color: PW_COLORS[pwStrength] }}>
                  {PW_LABELS[pwStrength]}
                </span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="cta-button w-full lp-submit-btn" disabled={!ready}>
              {loading ? (
                <span className="lp-loading">
                  <span className="lp-spinner" />
                  Authenticating...
                </span>
              ) : isRegister ? "Register Account" : "Sign In"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="h-px bg-black/10 flex-1"></div>
              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-dimmer)' }}>or</span>
              <div className="h-px bg-black/10 flex-1"></div>
            </div>

            {/* Google Auth */}
            <button
              type="button"
              className="lp-google-btn"
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Toggle */}
            <p className="text-center text-xs mt-2" style={{ color: 'var(--color-text-dim)' }}>
              {isRegister ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="lp-toggle-link"
              >
                {isRegister ? "Log in" : "Register"}
              </button>
            </p>
          </form>
        </div>

        {/* Learner count */}
        <LearnerCounter />

        {/* Subject pills */}
        <div className="lp-subjects">
          {["📐 Math", "🔬 Science", "💻 Code", "📖 History", "🧬 Biology", "🎨 Art"].map((s) => (
            <span key={s} className="lp-subject">{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Animated counter component ─── */
function LearnerCounter() {
  const [count, setCount] = useState(0);
  const target = 10847;
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const duration = 1800;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  return (
    <div className="lp-counter">
      <span className="lp-counter-num">{count.toLocaleString()}+</span>
      <span className="lp-counter-label">learners already onboard</span>
    </div>
  );
}
