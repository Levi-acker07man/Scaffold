"use client";

import { useBackground } from "@/shared/context/BackgroundContext";
import { useEffect, useState } from "react";

const STARS = [
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
];

export function AmbientBackground() {
  const { background } = useBackground();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthBg =
    !mounted ||
    (background.type === "live" && background.value === "live-auth");

  if (isAuthBg) {
    return (
      <div className="ambient live-auth" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(145deg, #060913 0%, #0a0f1e 35%, #0e1528 70%, #060c16 100%)",
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
            {STARS.map((s, i) => (
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
              background:
                "linear-gradient(to right, transparent, rgba(226,232,240,0.7), white)",
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
              background:
                "linear-gradient(to right, transparent, rgba(226,232,240,0.7), white)",
              borderRadius: 2,
              animation: "shootStar 4.5s linear 11s infinite",
            }}
          />

          {/* ── Moon with orbit ring ── */}
          <div
            className="absolute pointer-events-none"
            style={{ top: "7%", right: "12%" }}
          >
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
              <div
                className="absolute rounded-full bg-slate-300"
                style={{ width: 4, height: 4, top: 0, left: 48 }}
              />
            </div>
            <div
              className="rounded-full"
              style={{
                width: 60,
                height: 60,
                background:
                  "radial-gradient(circle at 38% 38%, #fffde7, #fff9c4 45%, rgba(255,249,196,0.25) 75%, transparent 100%)",
                boxShadow:
                  "0 0 50px rgba(255,255,200,0.25), 0 0 100px rgba(255,255,200,0.1)",
                animation: "moonBreath 8s ease-in-out infinite",
              }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  width: 7,
                  height: 7,
                  top: 16,
                  left: 18,
                  background: "rgba(200,180,100,0.15)",
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  top: 32,
                  left: 36,
                  background: "rgba(200,180,100,0.1)",
                }}
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
              className="absolute interactive-float select-none text-5xl opacity-80"
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
        </div>
      </div>
    );
  }

  return (
    <div
      className={`ambient ${
        background.type === "live" ? background.value : ""
      }`}
      aria-hidden="true"
    >
      {background.type === "static" ? (
        background.value.startsWith("/") ? (
          <div
            className="ambient-image transition-all duration-700"
            style={{
              backgroundImage: `url('${background.value}')`,
            }}
          />
        ) : (
          <div className={`ambient-image transition-all duration-700 ${background.value}`} />
        )
      ) : (
        <div className="ambient-live-overlay" />
      )}
    </div>
  );
}

