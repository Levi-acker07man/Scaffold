"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

/* ─── Password strength ─── */
const PW_LABELS = ["", "Weak", "Fair", "Good", "Strong", "🔒 Fort Knox"];
const PW_COLORS = ["", "#ef4444", "#f59e0b", "#eab308", "#a3a3a3", "#e2e8f0"];
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

/* ─── Ink splash colors (White, Silver, Platinum, Frosty) ─── */
const SPLASH_COLORS = [
  "rgba(255,255,255,0.6)", "rgba(226,232,240,0.55)", "rgba(203,213,225,0.5)",
  "rgba(248,250,252,0.55)", "rgba(241,245,249,0.55)", "rgba(226,232,240,0.45)",
];

/* ─── Peeking Panda (White & Black, peeking from behind a wall) ─── */
function PeekingPanda({ isPasswordFocused }: { isPasswordFocused: boolean }) {
  const pandaRef = useRef<SVGSVGElement>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      if (isPasswordFocused || !pandaRef.current) return;
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        if (!pandaRef.current) return;
        const rect = pandaRef.current.getBoundingClientRect();
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
    <svg
      ref={pandaRef}
      viewBox="0 0 140 75"
      width="120"
      height="65"
      style={{
        filter: "drop-shadow(0 4px 16px rgba(255,255,255,0.12))",
        overflow: "visible",
        display: "block",
      }}
    >
      {/* === PANDA HEAD peeks over the card top edge === */}

      {/* Ears */}
      <ellipse cx="38" cy="14" rx="13" ry="13" fill="#1a1a2e" />
      <ellipse cx="102" cy="14" rx="13" ry="13" fill="#1a1a2e" />
      <ellipse cx="38" cy="14" rx="8" ry="8" fill="#2d2d44" />
      <ellipse cx="102" cy="14" rx="8" ry="8" fill="#2d2d44" />

      {/* Head */}
      <ellipse cx="70" cy="35" rx="34" ry="30" fill="#f8fafc" />
      <ellipse cx="70" cy="37" rx="31" ry="26" fill="#ffffff" />

      {/* Eye patches (dark panda patches) */}
      <ellipse cx="53" cy="33" rx="13" ry="11" fill="#1a1a2e" transform="rotate(-8 53 33)" />
      <ellipse cx="87" cy="33" rx="13" ry="11" fill="#1a1a2e" transform="rotate(8 87 33)" />

      {/* White of eyes */}
      <ellipse cx="53" cy="33" rx="8.5" ry="8.5" fill="white" />
      <ellipse cx="87" cy="33" rx="8.5" ry="8.5" fill="white" />

      {/* Pupils - follow cursor or cover when password focused */}
      {isPasswordFocused ? (<>
        {/* Panda covers eyes with paws */}
        <ellipse cx="53" cy="33" rx="11" ry="10" fill="#f8fafc" opacity="0.97">
          <animate attributeName="rx" from="4" to="11" dur="0.3s" fill="freeze" />
        </ellipse>
        <ellipse cx="87" cy="33" rx="11" ry="10" fill="#f8fafc" opacity="0.97">
          <animate attributeName="rx" from="4" to="11" dur="0.3s" fill="freeze" />
        </ellipse>
        {/* Paw pad details on covering paws */}
        <ellipse cx="47" cy="31" rx="3.5" ry="3" fill="#1a1a2e" opacity="0.25" />
        <ellipse cx="53" cy="28" rx="3.5" ry="3" fill="#1a1a2e" opacity="0.25" />
        <ellipse cx="59" cy="31" rx="3.5" ry="3" fill="#1a1a2e" opacity="0.25" />
        <ellipse cx="81" cy="31" rx="3.5" ry="3" fill="#1a1a2e" opacity="0.25" />
        <ellipse cx="87" cy="28" rx="3.5" ry="3" fill="#1a1a2e" opacity="0.25" />
        <ellipse cx="93" cy="31" rx="3.5" ry="3" fill="#1a1a2e" opacity="0.25" />
      </>) : (<>
        <circle cx={53 + eyeOffset.x} cy={33 + eyeOffset.y} r="4" fill="#1a1a2e" />
        <circle cx={87 + eyeOffset.x} cy={33 + eyeOffset.y} r="4" fill="#1a1a2e" />
        {/* Eye highlights */}
        <circle cx={55 + eyeOffset.x * 0.5} cy={31 + eyeOffset.y * 0.5} r="1.8" fill="white" opacity="0.9" />
        <circle cx={89 + eyeOffset.x * 0.5} cy={31 + eyeOffset.y * 0.5} r="1.8" fill="white" opacity="0.9" />
      </>)}

      {/* Nose */}
      <ellipse cx="70" cy="43" rx="4.5" ry="3" fill="#1a1a2e" />
      <ellipse cx="69" cy="42" rx="1.8" ry="1.2" fill="#3a3a5e" opacity="0.5" />

      {/* Mouth */}
      <path d="M 66.5 46 Q 70 49.5 73.5 46" stroke="#1a1a2e" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <line x1="70" y1="45.5" x2="70" y2="47" stroke="#1a1a2e" strokeWidth="1" strokeLinecap="round" />

      {/* Blush spots */}
      <ellipse cx="41" cy="41" rx="4.5" ry="2.5" fill="#fca5a5" opacity="0.22" />
      <ellipse cx="99" cy="41" rx="4.5" ry="2.5" fill="#fca5a5" opacity="0.22" />

      {/* Paws gripping the card top edge (at bottom of SVG) */}
      <ellipse cx="48" cy="62" rx="11" ry="7" fill="#f8fafc" />
      <ellipse cx="92" cy="62" rx="11" ry="7" fill="#f8fafc" />
      {/* Paw pad details */}
      <ellipse cx="42" cy="61" rx="3" ry="2.2" fill="#e2e8f0" opacity="0.5" />
      <ellipse cx="48" cy="58.5" rx="3" ry="2.2" fill="#e2e8f0" opacity="0.5" />
      <ellipse cx="54" cy="61" rx="3" ry="2.2" fill="#e2e8f0" opacity="0.5" />
      <ellipse cx="86" cy="61" rx="3" ry="2.2" fill="#e2e8f0" opacity="0.5" />
      <ellipse cx="92" cy="58.5" rx="3" ry="2.2" fill="#e2e8f0" opacity="0.5" />
      <ellipse cx="98" cy="61" rx="3" ry="2.2" fill="#e2e8f0" opacity="0.5" />
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

  /* ─── Magnetic 3D Cursor Follow for Centered Login Box & Top Title ─── */
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxOffset, setBoxOffset] = useState({ x: 0, y: 0, rx: 0, ry: 0 });

  const titleRef = useRef<HTMLDivElement>(null);
  const [titleOffset, setTitleOffset] = useState({ x: 0, y: 0, rx: 0, ry: 0 });
  const [titleHovered, setTitleHovered] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        if (boxRef.current) {
          const rect = boxRef.current.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;

          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const maxMoveX = 14;
          const maxMoveY = 12;

          const moveX = (dx / dist) * Math.min(maxMoveX, Math.abs(dx) / 25);
          const moveY = (dy / dist) * Math.min(maxMoveY, Math.abs(dy) / 25);

          const rx = -(moveY / maxMoveY) * 6;
          const ry = (moveX / maxMoveX) * 6;

          setBoxOffset({ x: moveX, y: moveY, rx, ry });
        }

        if (titleRef.current) {
          const rect = titleRef.current.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;

          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const maxMoveX = 24;
          const maxMoveY = 18;

          const moveX = (dx / dist) * Math.min(maxMoveX, Math.abs(dx) / 18);
          const moveY = (dy / dist) * Math.min(maxMoveY, Math.abs(dy) / 18);

          const rx = -(moveY / maxMoveY) * 14;
          const ry = (moveX / maxMoveX) * 14;

          setTitleOffset({ x: moveX, y: moveY, rx, ry });
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const pwStrength = calcPwStrength(password);

  /* Ink splash */
  const bgRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const supabase = createClient();

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

        @keyframes auroraWave {
          0% { transform: translateX(-30%) skewX(-5deg); }
          50% { transform: translateX(10%) skewX(5deg); }
          100% { transform: translateX(-30%) skewX(-5deg); }
        }
        @keyframes pandaFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
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


        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>

      {/* ══════ BACKGROUND (Deep Obsidian & Frost/Moonlight) ══════ */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(145deg, #060913 0%, #0a0f1e 35%, #0e1528 70%, #060c16 100%)",
        }}
      >
        {/* ── Aurora Borealis (White & Platinum Frosty Wave) ── */}
        <div className="absolute top-0 left-0 right-0 h-[55%] pointer-events-none overflow-hidden opacity-30">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(226, 232, 240, 0.18) 25%, rgba(248, 250, 252, 0.22) 50%, rgba(203, 213, 225, 0.18) 75%, transparent 100%)",
              filter: "blur(65px)",
              animation: "auroraWave 16s ease-in-out infinite",
              width: "180%",
              height: "100%",
            }}
          />
        </div>

        {/* ── Stars ── */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { l: "6%", t: "12%", s: 2, d: 4 },
            { l: "14%", t: "25%", s: 2.5, d: 5 },
            { l: "22%", t: "15%", s: 2, d: 3.5 },
            { l: "31%", t: "38%", s: 3, d: 6 },
            { l: "39%", t: "18%", s: 2, d: 4.5 },
            { l: "12%", t: "62%", s: 2.5, d: 5.5 },
            { l: "28%", t: "75%", s: 2, d: 4.2 },
            { l: "38%", t: "85%", s: 2.5, d: 5.8 },
            { l: "48%", t: "10%", s: 2.5, d: 4 },
            { l: "56%", t: "22%", s: 2, d: 5 },
            { l: "65%", t: "14%", s: 3, d: 3.5 },
            { l: "73%", t: "30%", s: 2, d: 6 },
            { l: "82%", t: "16%", s: 2.5, d: 4.5 },
            { l: "90%", t: "36%", s: 2, d: 5.5 },
            { l: "58%", t: "50%", s: 2.5, d: 4.2 },
            { l: "50%", t: "64%", s: 2, d: 5.8 },
            { l: "76%", t: "56%", s: 3, d: 3.8 },
            { l: "88%", t: "60%", s: 2, d: 5.2 },
            { l: "46%", t: "80%", s: 2.5, d: 4.8 },
            { l: "70%", t: "74%", s: 2, d: 6.2 },
            { l: "84%", t: "82%", s: 3, d: 3.2 },
            { l: "60%", t: "90%", s: 2, d: 5.5 },
            { l: "94%", t: "24%", s: 2.5, d: 4.6 },
          ].map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: s.s,
                height: s.s,
                left: s.l,
                top: s.t,
                ["--lo" as any]: 0.15,
                ["--hi" as any]: 0.85,
                animation: `pulse ${s.d}s ease-in-out ${i * 0.4}s infinite`,
              }}
            />
          ))}
        </div>

        {/* ── Shooting Stars ── */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "14%",
            left: "55%",
            width: 110,
            height: 2,
            background: "linear-gradient(to right, transparent, rgba(226,232,240,0.7), white)",
            borderRadius: 2,
            animation: "shootStar 4s linear 6s infinite",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: "22%",
            left: "15%",
            width: 90,
            height: 2,
            background: "linear-gradient(to right, transparent, rgba(226,232,240,0.7), white)",
            borderRadius: 2,
            animation: "shootStar 4.5s linear 11s infinite",
          }}
        />

        {/* ── Moon with orbit ring ── */}
        <div className="absolute pointer-events-none" style={{ top: "7%", right: "12%" }}>
          <div
            className="absolute"
            style={{
              width: 100,
              height: 100,
              top: -20,
              left: -20,
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "50%",
              animation: "orbitRing 25s linear infinite",
            }}
          >
            <div className="absolute rounded-full bg-slate-300" style={{ width: 4, height: 4, top: 0, left: 48 }} />
          </div>
          <div
            className="rounded-full"
            style={{
              width: 60,
              height: 60,
              background:
                "radial-gradient(circle at 38% 38%, #fffde7, #fff9c4 45%, rgba(255,249,196,0.25) 75%, transparent 100%)",
              boxShadow: "0 0 50px rgba(255,255,200,0.25), 0 0 100px rgba(255,255,200,0.1)",
              animation: "moonBreath 8s ease-in-out infinite",
            }}
          >
            <div
              className="absolute rounded-full"
              style={{ width: 7, height: 7, top: 16, left: 18, background: "rgba(200,180,100,0.15)" }}
            />
            <div
              className="absolute rounded-full"
              style={{ width: 10, height: 10, top: 32, left: 36, background: "rgba(200,180,100,0.1)" }}
            />
          </div>
        </div>

        {/* ── Floating Study Icons ── */}
        {[
          { icon: "📚", x: "12%", y: "22%", dur: 7 },
          { icon: "🔬", x: "34%", y: "75%", dur: 8.5 },
          { icon: "🎓", x: "88%", y: "18%", dur: 6.5 },
          { icon: "✏️", x: "65%", y: "80%", dur: 9 },
          { icon: "🧪", x: "48%", y: "55%", dur: 7.5 },
          { icon: "🌍", x: "92%", y: "48%", dur: 8 },
          { icon: "💡", x: "24%", y: "45%", dur: 7.2 },
          { icon: "🚀", x: "82%", y: "85%", dur: 8.8 },
        ].map((item, i) => (
          <div
            key={`icon-${i}`}
            className="absolute interactive-float select-none text-5xl"
            style={{
              left: item.x,
              top: item.y,
              animation: `float ${item.dur}s ease-in-out ${i * 0.8}s infinite`,
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
            }}
          >
            {item.icon}
          </div>
        ))}

        {/* ── Floating Books (White/Silver/Platinum Palette) ── */}
        {[
          { x: "15%", y: "65%", sz: 46, rot: -12, c: "#cbd5e1", fd: 0.5 },
          { x: "38%", y: "28%", sz: 42, rot: 15, c: "#e2e8f0", fd: 1.2 },
          { x: "52%", y: "15%", sz: 50, rot: -10, c: "#94a3b8", fd: 0 },
          { x: "74%", y: "42%", sz: 44, rot: 14, c: "#f1f5f9", fd: 1.5 },
          { x: "60%", y: "68%", sz: 40, rot: -16, c: "#cbd5e1", fd: 0.8 },
          { x: "85%", y: "75%", sz: 36, rot: 10, c: "#e2e8f0", fd: 2.2 },
        ].map((b, i) => (
          <div
            key={`b${i}`}
            className="absolute interactive-float"
            style={{
              left: b.x,
              top: b.y,
              animation: `float ${7 + b.fd}s ease-in-out ${b.fd}s infinite`,
              filter: `drop-shadow(0 0 12px ${b.c}40)`,
            }}
          >
            <svg
              viewBox="0 0 50 62"
              width={b.sz}
              height={b.sz * 1.24}
              opacity="0.85"
              style={{ transform: `rotate(${b.rot}deg)` }}
            >
              <rect x="2" y="4" width="8" height="54" rx="2" fill={b.c} opacity="0.8" />
              <rect x="10" y="0" width="36" height="58" rx="3" fill={b.c} />
              <rect x="13" y="3" width="30" height="52" rx="2" fill="rgba(255,255,255,0.85)" />
              <line x1="18" y1="14" x2="38" y2="14" stroke={b.c} opacity="0.2" strokeWidth="1.5" />
              <line x1="18" y1="22" x2="34" y2="22" stroke={b.c} opacity="0.15" strokeWidth="1.5" />
              <line x1="18" y1="30" x2="36" y2="30" stroke={b.c} opacity="0.12" strokeWidth="1.5" />
              <rect x="32" y="0" width="4" height="16" rx="1" fill="#94a3b8" opacity="0.7" />
            </svg>
          </div>
        ))}
      </div>

      {/* ══════ COSMIC VIGNETTE ══════ */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(226, 232, 240, 0.08) 0%, transparent 60%), radial-gradient(circle at 80% 30%, rgba(248, 250, 252, 0.04) 0%, transparent 50%)",
        }}
      />

      {/* ══════ CENTERED AUTH CONTENT ══════ */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        {/* ── Interactive 3D Movable Title: SCAFFOLD (Full width so letters never wrap) ── */}
        <div
          ref={titleRef}
          onMouseEnter={() => setTitleHovered(true)}
          onMouseLeave={() => {
            setTitleHovered(false);
            setTitleOffset({ x: 0, y: 0, rx: 0, ry: 0 });
          }}
          className="a1 cursor-pointer select-none py-3 px-4 sm:px-8 mb-6 transition-all duration-300 ease-out max-w-full"
          style={{
            transform: titleHovered
              ? `perspective(800px) translate3d(${titleOffset.x}px, ${titleOffset.y}px, 0) rotateX(${titleOffset.rx}deg) rotateY(${titleOffset.ry}deg) scale(1.08)`
              : "perspective(800px) translate3d(0px, 0px, 0) rotateX(0deg) rotateY(0deg) scale(1)",
            transformStyle: "preserve-3d",
          }}
        >
          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-widest text-center leading-none transition-all duration-300 whitespace-nowrap flex justify-center items-center"
            style={{
              fontFamily: "var(--font-outfit)",
              background: "linear-gradient(135deg, #e2e8f0 0%, #f8fafc 40%, #cbd5e1 70%, #f1f5f9 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              textShadow: titleHovered
                ? "0 0 40px rgba(248, 250, 252, 0.4), 0 0 80px rgba(226, 232, 240, 0.2)"
                : "0 0 30px rgba(226, 232, 240, 0.15)",
            }}
          >
            {"SCAFFOLD".split("").map((char, i) => {
              const waveY = titleHovered
                ? Math.sin((titleOffset.x * 0.7 + titleOffset.y * 0.5) - i * 0.75) * 6
                : 0;
              const waveRotate = titleHovered
                ? Math.cos((titleOffset.x * 0.5 + titleOffset.y * 0.3) - i * 0.65) * 3
                : 0;

              return (
                <span
                  key={i}
                  className="inline-block transition-transform duration-300 ease-out"
                  style={{
                    transform: `translateY(${waveY.toFixed(2)}px) rotate(${waveRotate.toFixed(2)}deg)`,
                  }}
                >
                  {char}
                </span>
              );
            })}
          </h1>
        </div>

        <div className="max-w-[440px] w-full flex flex-col items-center">
          {/* ── Centered Login Card ── */}
          <div
            ref={boxRef}
            className="a3 relative transition-all duration-200 ease-out w-full"
            style={{
              transform: `perspective(1000px) translate3d(${boxOffset.x}px, ${boxOffset.y}px, 0) rotateX(${boxOffset.rx}deg) rotateY(${boxOffset.ry}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            <div className="flex justify-center -mb-4 relative z-20" style={{ animation: "pandaFloat 3s ease-in-out infinite" }}>
              <PeekingPanda isPasswordFocused={isPasswordFocused} />
            </div>
            <div
              className="auth-panel rounded-3xl p-8 pt-10 relative"
              style={{
                background: "linear-gradient(145deg, rgba(16, 25, 38, 0.88) 0%, rgba(10, 15, 26, 0.94) 100%)",
                boxShadow:
                  "0 30px 70px -15px rgba(0, 0, 0, 0.85), 0 0 50px rgba(226, 232, 240, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(28px)",
              }}
            >
              {/* Subtle top border white/silver highlight line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300/50 to-transparent" />

              <h2 className="text-xl font-extrabold text-white mb-1 text-center tracking-tight">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-slate-400 text-xs font-medium mb-6 text-center">
                {isLogin ? "The panda is watching you type... 🐼" : "Register to start your journey!"}
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-2.5 rounded-lg mb-4 font-medium">
                  {error}
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2.5 bg-white/[0.06] border border-white/10 text-slate-200 font-semibold py-2.5 px-4 rounded-xl text-sm hover:bg-white/[0.12] hover:border-white/20 transition-all mb-5 group shadow-sm cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform">
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

              <div className="flex items-center gap-3 mb-5">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">or</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              {!isLogin && (
                <div className="flex gap-2 mb-3" style={{ animation: "slideUp 0.3s ease-out" }}>
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                      First Name
                    </label>
                    <input
                      type="text"
                      required={!isLogin}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full px-4 py-3 bg-[#060a12]/90 border border-white/10 rounded-xl text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:border-slate-400 transition-all placeholder:text-slate-500 hover:border-white/20 shadow-inner"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required={!isLogin}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full px-4 py-3 bg-[#060a12]/90 border border-white/10 rounded-xl text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:border-slate-400 transition-all placeholder:text-slate-500 hover:border-white/20 shadow-inner"
                    />
                  </div>
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    onFocus={() => setIsPasswordFocused(false)}
                    className="w-full px-4 py-3 bg-[#060a12]/90 border border-white/10 rounded-xl text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:border-slate-400 transition-all placeholder:text-slate-500 hover:border-white/20 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className="w-full px-4 py-3 bg-[#060a12]/90 border border-white/10 rounded-xl text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:border-slate-400 transition-all placeholder:text-slate-500 hover:border-white/20 shadow-inner"
                  />
                </div>

                {/* Password strength meter */}
                {password.length > 0 && (
                  <div className="flex items-center gap-2 mt-0.5" style={{ animation: "slideUp 0.25s ease-out" }}>
                    <div className="flex gap-1.5 flex-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`pw-bar ${pwStrength >= lvl ? "pw-bar-on" : ""}`}
                          style={{ background: pwStrength >= lvl ? PW_COLORS[pwStrength] : undefined }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: PW_COLORS[pwStrength], minWidth: 70, textAlign: "right" }}
                    >
                      {PW_LABELS[pwStrength]}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: "linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)",
                    boxShadow:
                      "0 10px 30px -5px rgba(148, 163, 184, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
                  }}
                  className="auth-shimmer-btn w-full mt-2 py-3 rounded-xl text-white font-extrabold text-sm tracking-wide disabled:opacity-50 hover:shadow-slate-400/40 hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer"
                >
                  {loading ? "Processing..." : isLogin ? "Sign In" : "Register Now"}
                </button>
              </form>

              <p className="text-xs font-medium text-slate-400 mt-6 text-center">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-slate-300 font-extrabold hover:text-white hover:underline cursor-pointer"
                >
                  {isLogin ? "Register here" : "Sign in here"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
