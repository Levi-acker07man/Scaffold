"use client";

import { useState } from "react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="w-full h-screen flex relative z-10 p-4 md:p-6 gap-6 box-border">
      {/* ── Sidebar ── */}
      <aside className="clay hidden md:flex flex-col w-64 rounded-3xl p-6 h-[calc(100vh-48px)] border border-clay-border">
        {/* Branding */}
        <div className="flex items-center gap-3 mb-10">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: "var(--accent-bg)",
              border: "1.5px solid var(--accent-border)",
              boxShadow:
                "3px 3px 6px rgba(0,0,0,0.06), inset -3px -3px 6px rgba(255,255,255,0.5), inset 3px 3px 6px rgba(107,70,193,0.06)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent-base)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <span className="font-extrabold text-lg text-text tracking-wide">
            Scaffold
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-3">
          <SidebarButton
            active={activeTab === "home"}
            onClick={() => setActiveTab("home")}
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            }
            label="Home"
          />
          <SidebarButton
            active={activeTab === "socratic"}
            onClick={() => setActiveTab("socratic")}
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
            label="Study Room"
          />
          <SidebarButton
            active={activeTab === "heatmap"}
            onClick={() => setActiveTab("heatmap")}
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            }
            label="Heatmap"
          />

          <div className="h-px bg-black/5 my-2"></div>

          <SidebarButton
            active={activeTab === "shop"}
            onClick={() => setActiveTab("shop")}
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            }
            label="Shop"
          />
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col h-[calc(100vh-48px)] overflow-hidden rounded-3xl">
        {/* Header */}
        <header className="relative z-50 flex justify-between items-center mb-6 clay border border-clay-border rounded-3xl p-4 px-7 shadow-clay">
          <div className="flex items-center gap-5">
            {/* XP Circular Progress */}
            <div className="relative flex items-center justify-center w-[52px] h-[52px]">
              <svg
                className="absolute w-[52px] h-[52px] -rotate-90 pointer-events-none"
                viewBox="0 0 52 52"
              >
                <circle
                  cx="26"
                  cy="26"
                  r="22"
                  fill="transparent"
                  stroke="var(--clay-border)"
                  strokeWidth="4"
                />
                <circle
                  cx="26"
                  cy="26"
                  r="22"
                  fill="transparent"
                  stroke="var(--accent-base)"
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 22}
                  strokeDashoffset={
                    2 * Math.PI * 22 - (7 / 10) * (2 * Math.PI * 22)
                  }
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{
                    filter:
                      "drop-shadow(0 0 6px rgba(107, 70, 193, 0.4))",
                  }}
                />
              </svg>
              <span className="relative z-10 text-lg font-black text-text">
                12
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-text leading-none mb-1.5">
                Student
              </h2>
              <p className="text-[10px] text-text-dim font-mono uppercase tracking-[0.2em]">
                Scholar • XP: 117/120
              </p>
            </div>
          </div>

          {/* Right side stats */}
          <div className="flex items-center gap-4">
            <div
              className="nav-pill flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[13px]"
              style={{ color: "var(--accent-base)" }}
            >
              <span className="text-yellow-500 font-bold">🪙</span>
              450
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: "var(--accent-bg)",
                border: "1.5px solid var(--accent-border)",
                boxShadow:
                  "3px 3px 6px rgba(0,0,0,0.05), inset -3px -3px 6px rgba(255,255,255,0.5), inset 3px 3px 6px rgba(0,0,0,0.03)",
              }}
            >
              <span className="font-bold text-accent-base text-sm">
                SR
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-hide">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${
        active
          ? "text-accent-base border border-accent-border"
          : "text-text-dim hover:text-accent-base border border-transparent"
      }`}
      style={
        active
          ? {
              background: "var(--accent-bg)",
              boxShadow:
                "4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5), inset 4px 4px 8px rgba(107,70,193,0.06)",
            }
          : {
              background: "transparent",
            }
      }
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--clay-bg)";
          e.currentTarget.style.boxShadow =
            "3px 3px 6px rgba(0,0,0,0.04), inset -3px -3px 6px rgba(255,255,255,0.4), inset 3px 3px 6px rgba(0,0,0,0.02)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {icon}
      {label}
    </button>
  );
}
