"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

/* ─── Typewriter words ─── */
const TW_WORDS = ["Learn Smarter", "Think Deeper", "Grow Faster", "Explore More"];

/* ─── Password strength ─── */
const PW_LABELS = ["", "Weak", "Fair", "Good", "Strong", "🔒 Fort Knox"];
const PW_COLORS = ["", "#ef4444", "#f59e0b", "#eab308", "#22c55e", "#a78bfa"];
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

/* ─── Time greeting ─── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return { text: "Burning the midnight oil? 🌙", sub: "Late-night learning hits different." };
  if (h < 12) return { text: "Good Morning! ☀️", sub: "A fresh day to learn something new." };
  if (h < 17) return { text: "Good Afternoon! 🌤️", sub: "Keep the momentum going." };
  if (h < 21) return { text: "Good Evening! 🌅", sub: "Wind down with some study." };
  return { text: "Night Owl Mode! 🦉", sub: "The quiet hours are best for focus." };
}

/* ─── Ink splash colors ─── */
const SPLASH_COLORS = [
  "rgba(167,139,250,0.6)", "rgba(56,178,172,0.5)", "rgba(129,140,248,0.5)",
  "rgba(246,173,85,0.5)", "rgba(107,70,193,0.5)", "rgba(72,187,120,0.45)",
];

/* ─── Study Owl ─── */
function StudyOwl({ isPasswordFocused }: { isPasswordFocused: boolean }) {
  const owlRef = useRef<SVGSVGElement>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      if (isPasswordFocused || !owlRef.current) return;
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        if (!owlRef.current) return;
        const rect = owlRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const max = 4;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        setEyeOffset({ x: (dx / dist) * Math.min(max, dist / 40), y: (dy / dist) * Math.min(max, dist / 40) });
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPasswordFocused]);

  return (
    <svg ref={owlRef} viewBox="0 0 120 120" width="100" height="100" style={{ filter: "drop-shadow(0 8px 24px rgba(107,70,193,0.3))" }}>
      <ellipse cx="60" cy="72" rx="38" ry="34" fill="#6b46c1" /><ellipse cx="60" cy="74" rx="30" ry="26" fill="#805ad5" />
      <ellipse cx="60" cy="82" rx="18" ry="14" fill="#e9d5ff" />
      <polygon points="30,44 22,20 42,38" fill="#6b46c1" /><polygon points="90,44 98,20 78,38" fill="#6b46c1" />
      <polygon points="32,42 26,24 42,38" fill="#805ad5" /><polygon points="88,42 94,24 78,38" fill="#805ad5" />
      <circle cx="60" cy="46" r="26" fill="#805ad5" /><circle cx="60" cy="46" r="23" fill="#9f7aea" />
      <ellipse cx="47" cy="44" rx="10" ry="11" fill="white" /><ellipse cx="73" cy="44" rx="10" ry="11" fill="white" />
      {isPasswordFocused ? (<>
        <ellipse cx="47" cy="44" rx="13" ry="13" fill="#6b46c1" opacity="0.95"><animate attributeName="rx" from="5" to="13" dur="0.3s" fill="freeze" /></ellipse>
        <ellipse cx="73" cy="44" rx="13" ry="13" fill="#6b46c1" opacity="0.95"><animate attributeName="rx" from="5" to="13" dur="0.3s" fill="freeze" /></ellipse>
        <ellipse cx="47" cy="44" rx="10" ry="10" fill="#805ad5" opacity="0.6" /><ellipse cx="73" cy="44" rx="10" ry="10" fill="#805ad5" opacity="0.6" />
      </>) : (<>
        <circle cx={47 + eyeOffset.x} cy={44 + eyeOffset.y} r="5" fill="#1a103c" />
        <circle cx={73 + eyeOffset.x} cy={44 + eyeOffset.y} r="5" fill="#1a103c" />
        <circle cx={49 + eyeOffset.x * 0.5} cy={42 + eyeOffset.y * 0.5} r="2" fill="white" opacity="0.9" />
        <circle cx={75 + eyeOffset.x * 0.5} cy={42 + eyeOffset.y * 0.5} r="2" fill="white" opacity="0.9" />
      </>)}
      <polygon points="56,52 64,52 60,58" fill="#f6ad55" /><polygon points="57,52 63,52 60,55" fill="#ed8936" />
      <ellipse cx="50" cy="104" rx="8" ry="3" fill="#f6ad55" /><ellipse cx="70" cy="104" rx="8" ry="3" fill="#f6ad55" />
      <rect x="40" y="22" width="40" height="4" rx="1" fill="#1a103c" /><polygon points="60,14 40,24 80,24" fill="#2d3748" />
      <line x1="76" y1="24" x2="82" y2="34" stroke="#f6ad55" strokeWidth="1.5" /><circle cx="82" cy="35" r="2.5" fill="#f6ad55" />
    </svg>
  );
}

/* ─── Animated counter ─── */
function AnimCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const dur = 1600;
    const s = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - s) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <>{count.toLocaleString()}{suffix}</>;
}

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  /* Typewriter */
  const [twWordIdx, setTwWordIdx] = useState(0);
  const [twCharIdx, setTwCharIdx] = useState(0);
  const [twDeleting, setTwDeleting] = useState(false);

  /* Greeting */
  const [greeting] = useState(getGreeting);

  const pwStrength = calcPwStrength(password);

  /* Ink splash */
  const bgRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const supabase = createClient();

  /* Typewriter effect */
  useEffect(() => {
    const word = TW_WORDS[twWordIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!twDeleting && twCharIdx < word.length) {
      timeout = setTimeout(() => setTwCharIdx(c => c + 1), 80);
    } else if (!twDeleting && twCharIdx === word.length) {
      timeout = setTimeout(() => setTwDeleting(true), 2200);
    } else if (twDeleting && twCharIdx > 0) {
      timeout = setTimeout(() => setTwCharIdx(c => c - 1), 40);
    } else if (twDeleting && twCharIdx === 0) {
      setTwDeleting(false);
      setTwWordIdx(i => (i + 1) % TW_WORDS.length);
    }
    return () => clearTimeout(timeout);
  }, [twCharIdx, twDeleting, twWordIdx]);

  /* Ink splash on background click */
  const handleBgClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest("form") || t.closest("button") || t.closest("input") || t.closest(".auth-panel")) return;
    if (!bgRef.current) return;
    const rect = bgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement("span");
      dot.className = "auth-ink";
      const color = SPLASH_COLORS[Math.floor(Math.random() * SPLASH_COLORS.length)];
      const size = 6 + Math.random() * 10;
      const dx = (Math.random() - 0.5) * 100;
      const dy = -(20 + Math.random() * 60);
      dot.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${color};--dx:${dx}px;--dy:${dy}px;`;
      bgRef.current.appendChild(dot);
      setTimeout(() => dot.remove(), 800);
    }
  }, []);

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
          email, password,
          options: { data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`.trim() } },
        });
        if (error) {
          if (error.message.toLowerCase().includes("user already registered"))
            throw new Error("This email is already registered. Please click 'Sign in here' below to log in.");
          throw error;
        }
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to authenticate with Google.");
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden" ref={bgRef} onClick={handleBgClick}>
      <style jsx>{`
        @keyframes float { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-15px) scale(1.02); } }
        @keyframes pulse { 0%, 100% { opacity: var(--lo, 0.15); } 50% { opacity: var(--hi, 0.8); } }
        @keyframes shootStar {
          0% { transform: translate(0, 0) rotate(-45deg); opacity: 0; }
          5% { opacity: 1; } 60% { opacity: 0.7; }
          100% { transform: translate(300px, 300px) rotate(-45deg); opacity: 0; }
        }
        @keyframes moonBreath { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes owlBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes auroraWave {
          0% { transform: translateX(-30%) skewX(-5deg); }
          50% { transform: translateX(10%) skewX(5deg); }
          100% { transform: translateX(-30%) skewX(-5deg); }
        }
        @keyframes orbitRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pw-pop { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
        @keyframes counter-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer-btn {
          0% { left: -100%; }
          50% { left: 150%; }
          100% { left: 150%; }
        }
        @keyframes ink-float {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.15); }
        }

        .auth-ink {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 50;
          animation: ink-float 0.75s ease-out forwards;
        }

        .interactive-float {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: crosshair;
        }
        .interactive-float:hover {
          transform: scale(1.4) translateY(-10px) rotate(5deg) !important;
          animation-play-state: paused;
          z-index: 50;
        }

        .typewriter-cursor {
          font-weight: 300;
          animation: blink 0.7s step-end infinite;
        }

        .pw-bar {
          height: 3px;
          flex: 1;
          border-radius: 999px;
          background: rgba(255,255,255,0.1);
          transition: background 0.35s ease;
        }
        .pw-bar-on {
          animation: pw-pop 0.3s ease;
        }

        .auth-shimmer-btn {
          position: relative;
          overflow: hidden;
        }
        .auth-shimmer-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          animation: shimmer-btn 3s ease-in-out infinite;
          pointer-events: none;
        }

        .a1 { animation: slideUp 0.5s ease-out forwards; }
        .a2 { animation: slideUp 0.5s ease-out 0.12s forwards; opacity: 0; }
        .a3 { animation: slideUp 0.5s ease-out 0.24s forwards; opacity: 0; }
        .a4 { animation: counter-in 0.6s ease-out 0.5s forwards; opacity: 0; }
        .owl-bob { animation: owlBob 3s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>

      {/* ══════ BACKGROUND ══════ */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, #0f0c29 0%, #1a103c 35%, #1e3a5f 70%, #0f2027 100%)" }}>

        {/* ── Aurora Borealis ── */}
        <div className="absolute top-0 left-0 right-0 h-[40%] pointer-events-none overflow-hidden opacity-30">
          <div className="absolute inset-0" style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(56,178,172,0.3) 20%, rgba(107,70,193,0.4) 40%, rgba(129,140,248,0.3) 60%, rgba(56,178,172,0.2) 80%, transparent 100%)",
            filter: "blur(60px)", animation: "auroraWave 15s ease-in-out infinite", width: "160%", height: "100%",
          }} />
        </div>

        {/* ── Stars ── */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { l: "48%", t: "10%", s: 2.5, d: 4 }, { l: "56%", t: "22%", s: 2, d: 5 },
            { l: "65%", t: "14%", s: 3, d: 3.5 }, { l: "73%", t: "30%", s: 2, d: 6 },
            { l: "82%", t: "16%", s: 2.5, d: 4.5 }, { l: "90%", t: "36%", s: 2, d: 5.5 },
            { l: "58%", t: "50%", s: 2.5, d: 4.2 }, { l: "50%", t: "64%", s: 2, d: 5.8 },
            { l: "76%", t: "56%", s: 3, d: 3.8 }, { l: "88%", t: "60%", s: 2, d: 5.2 },
            { l: "46%", t: "80%", s: 2.5, d: 4.8 }, { l: "70%", t: "74%", s: 2, d: 6.2 },
            { l: "84%", t: "82%", s: 3, d: 3.2 }, { l: "60%", t: "90%", s: 2, d: 5.5 },
            { l: "94%", t: "24%", s: 2.5, d: 4.6 },
          ].map((s, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{
              width: s.s, height: s.s, left: s.l, top: s.t,
              ["--lo" as any]: 0.15, ["--hi" as any]: 0.85,
              animation: `pulse ${s.d}s ease-in-out ${i * 0.4}s infinite`,
            }} />
          ))}
        </div>

        {/* ── Shooting star ── */}
        <div className="absolute pointer-events-none" style={{
          top: "14%", left: "55%", width: 100, height: 2,
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.7), white)",
          borderRadius: 2, animation: "shootStar 3s linear 7s infinite",
        }} />

        {/* ── Moon with orbit ring ── */}
        <div className="absolute pointer-events-none" style={{ top: "7%", right: "12%" }}>
          <div className="absolute" style={{
            width: 100, height: 100, top: -20, left: -20,
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "50%",
            animation: "orbitRing 25s linear infinite",
          }}>
            <div className="absolute rounded-full bg-purple-300" style={{ width: 4, height: 4, top: 0, left: 48 }} />
          </div>
          <div className="rounded-full" style={{
            width: 60, height: 60,
            background: "radial-gradient(circle at 38% 38%, #fffde7, #fff9c4 45%, rgba(255,249,196,0.25) 75%, transparent 100%)",
            boxShadow: "0 0 50px rgba(255,255,200,0.25), 0 0 100px rgba(255,255,200,0.1)",
            animation: "moonBreath 8s ease-in-out infinite",
          }}>
            <div className="absolute rounded-full" style={{ width: 7, height: 7, top: 16, left: 18, background: "rgba(200,180,100,0.15)" }} />
            <div className="absolute rounded-full" style={{ width: 10, height: 10, top: 32, left: 36, background: "rgba(200,180,100,0.1)" }} />
          </div>
        </div>

        {/* ── Floating Study Icons (Interactive on hover) ── */}
        {[
          { icon: "📚", x: "55%", y: "30%", dur: 7 },
          { icon: "🔬", x: "78%", y: "65%", dur: 8.5 },
          { icon: "🎓", x: "88%", y: "18%", dur: 6.5 },
          { icon: "✏️", x: "65%", y: "80%", dur: 9 },
          { icon: "🧪", x: "48%", y: "55%", dur: 7.5 },
          { icon: "🌍", x: "92%", y: "48%", dur: 8 },
        ].map((item, i) => (
          <div key={`icon-${i}`} className="absolute interactive-float select-none text-5xl" style={{
            left: item.x, top: item.y,
            animation: `float ${item.dur}s ease-in-out ${i * 0.8}s infinite`,
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
          }}>
            {item.icon}
          </div>
        ))}

        {/* ── Floating Books ── */}
        {[
          { x: "52%", y: "15%", sz: 50, rot: -10, c: "#6b46c1", fd: 0 },
          { x: "74%", y: "42%", sz: 44, rot: 14, c: "#38b2ac", fd: 1.5 },
          { x: "60%", y: "68%", sz: 40, rot: -16, c: "#4299e1", fd: 0.8 },
          { x: "85%", y: "75%", sz: 36, rot: 10, c: "#ed8936", fd: 2.2 },
        ].map((b, i) => (
          <div key={`b${i}`} className="absolute interactive-float" style={{
            left: b.x, top: b.y,
            animation: `float ${7 + b.fd}s ease-in-out ${b.fd}s infinite`,
            filter: `drop-shadow(0 0 12px ${b.c}40)`,
          }}>
            <svg viewBox="0 0 50 62" width={b.sz} height={b.sz * 1.24} opacity="0.85" style={{ transform: `rotate(${b.rot}deg)` }}>
              <rect x="2" y="4" width="8" height="54" rx="2" fill={b.c} opacity="0.8" />
              <rect x="10" y="0" width="36" height="58" rx="3" fill={b.c} />
              <rect x="13" y="3" width="30" height="52" rx="2" fill="rgba(255,255,255,0.85)" />
              <line x1="18" y1="14" x2="38" y2="14" stroke={b.c} opacity="0.2" strokeWidth="1.5" />
              <line x1="18" y1="22" x2="34" y2="22" stroke={b.c} opacity="0.15" strokeWidth="1.5" />
              <line x1="18" y1="30" x2="36" y2="30" stroke={b.c} opacity="0.12" strokeWidth="1.5" />
              <rect x="32" y="0" width="4" height="16" rx="1" fill="#f6ad55" opacity="0.7" />
            </svg>
          </div>
        ))}
      </div>

      {/* ══════ LEFT PANEL ══════ */}
      <div className="absolute inset-y-0 left-0 w-full lg:w-[44%] z-[2] pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.9) 60%, rgba(255,255,255,0.5) 100%)" }} />

      {/* ══════ AUTH CONTENT ══════ */}
      <div className="relative z-10 min-h-screen flex items-center px-8 sm:px-12 lg:px-20 xl:px-28">
        <div className="max-w-[420px] w-full">
          {/* ── Greeting pill ── */}
          <div className="a1 mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
              style={{ background: "rgba(107,70,193,0.08)", border: "1px solid rgba(107,70,193,0.15)", color: "#6b46c1" }}>
              {greeting.text}
            </div>
          </div>

          <h1 className="text-[3rem] sm:text-[3.5rem] lg:text-[4rem] font-black leading-[1.1] mb-1 tracking-tight a1" style={{ fontFamily: "var(--font-outfit)" }}>
            <span className="text-gray-800 block">Exploration</span>
            <span className="text-gray-800 block">Research</span>
            <span className="block" style={{ background: "linear-gradient(135deg, #6b46c1, #38b2ac)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Scaffold</span>
          </h1>

          {/* ── Typewriter subtitle ── */}
          <p className="text-gray-500 text-sm leading-relaxed mb-2 a2" style={{ minHeight: '1.4em' }}>
            <span style={{ background: "linear-gradient(135deg, #6b46c1, #38b2ac)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 700 }}>
              {TW_WORDS[twWordIdx].slice(0, twCharIdx)}
            </span>
            <span className="typewriter-cursor" style={{ color: "#6b46c1" }}>|</span>
          </p>

          <p className="text-gray-400 text-xs leading-relaxed mb-6 max-w-[340px] a2">
            {greeting.sub} — Intelligent flashcards, adaptive study rooms, and dynamic progress tracking await.
          </p>

          <div className="a3">
            <div className="flex justify-center -mb-8 relative z-20 owl-bob">
              <StudyOwl isPasswordFocused={isPasswordFocused} />
            </div>
            <div className="auth-panel rounded-2xl p-7 pt-12" style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 20px 50px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)" }}>
              <h2 className="text-lg font-extrabold text-gray-800 mb-1 text-center">{isLogin ? "Welcome Back" : "Create Account"}</h2>
              <p className="text-gray-400 text-xs font-medium mb-5 text-center">{isLogin ? "The owl is watching you type... 👀" : "Register to start your journey!"}</p>

              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-2.5 rounded-lg mb-4 font-medium">{error}</div>}

              <button onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-200 text-gray-600 font-semibold py-2.5 px-4 rounded-xl text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors mb-4 group"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform">
                  <path fill="#EA4335" d="M12.001 5.36c1.685 0 2.923.722 3.593 1.365l2.67-2.607C16.634 2.518 14.542 1.5 12.001 1.5c-4.606 0-8.528 2.628-10.457 6.467l3.14 2.436C6.182 7.151 8.847 5.36 12.001 5.36z" />
                  <path fill="#4285F4" d="M23.498 12.275c0-.85-.075-1.666-.217-2.45H12.001v4.63h6.444c-.279 1.503-1.125 2.775-2.392 3.626l3.056 2.373c1.787-1.646 2.815-4.068 2.815-6.842z" />
                  <path fill="#FBBC05" d="M5.539 12c0-.742.128-1.46.36-2.126l-3.14-2.436A10.468 10.468 0 0 0 1.54 12c0 1.7.4 3.312 1.11 4.767l3.167-2.457A6.477 6.477 0 0 1 5.539 12z" />
                  <path fill="#34A853" d="M12.001 22.5c3.228 0 5.938-1.071 7.915-2.902l-3.056-2.373c-1.071.718-2.439 1.144-4.859 1.144-3.155 0-5.819-1.79-6.559-4.282l-3.167 2.457c1.93 3.837 5.852 6.463 10.457 6.463z" />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-px bg-gray-200 flex-1" /><span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">or</span><div className="h-px bg-gray-200 flex-1" />
              </div>

              {!isLogin && (
                <div className="flex gap-2 mb-3" style={{ animation: "slideUp 0.3s ease-out" }}>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">First Name</label>
                    <input type="text" required={!isLogin} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors placeholder:text-gray-300" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Last Name</label>
                    <input type="text" required={!isLogin} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors placeholder:text-gray-300" />
                  </div>
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" onFocus={() => setIsPasswordFocused(false)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors placeholder:text-gray-300" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors placeholder:text-gray-300" />
                </div>

                {/* Password strength meter */}
                {password.length > 0 && (
                  <div className="flex items-center gap-2 -mt-1" style={{ animation: "slideUp 0.25s ease-out" }}>
                    <div className="flex gap-1 flex-1">
                      {[1,2,3,4,5].map(lvl => (
                        <div key={lvl} className={`pw-bar ${pwStrength >= lvl ? 'pw-bar-on' : ''}`}
                          style={{ background: pwStrength >= lvl ? PW_COLORS[pwStrength] : undefined }} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: PW_COLORS[pwStrength], minWidth: 65, textAlign: "right" }}>
                      {PW_LABELS[pwStrength]}
                    </span>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="auth-shimmer-btn w-full mt-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-transform"
                  style={{ background: "linear-gradient(135deg, #6b46c1, #805ad5)", boxShadow: "0 6px 20px rgba(107,70,193,0.3)" }}>
                  {loading ? "Processing..." : isLogin ? "Sign In" : "Register Now"}
                </button>
              </form>

              <p className="text-xs font-medium text-gray-400 mt-5 text-center">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button onClick={() => setIsLogin(!isLogin)} className="text-purple-600 font-extrabold hover:underline">{isLogin ? "Register here" : "Sign in here"}</button>
              </p>
            </div>



          </div>
        </div>
      </div>
    </div>
  );
}
