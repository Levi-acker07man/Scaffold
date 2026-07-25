"use client";

export default function DashboardPage() {
  const TASKS = [
    { id: 1, label: "Read Biology Micro-lesson", xp: 50, coins: 10, done: true },
    { id: 2, label: "Answer 5 Socratic Questions", xp: 100, coins: 20, done: false },
    { id: 3, label: "Review Chemistry Flashcards", xp: 50, coins: 5, done: false },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* ── Left Column: Tasks ── */}
      <section className="clay rounded-3xl p-6 border border-clay-border flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-5 border-b border-black/5 pb-4">
          <h2 className="text-xl font-extrabold text-text flex items-center gap-2">
            Today&apos;s Targets
          </h2>
          <span
            className="text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-lg"
            style={{
              color: "var(--accent-base)",
              background: "var(--accent-bg)",
              border: "1px solid var(--accent-border)",
              boxShadow:
                "2px 2px 4px rgba(0,0,0,0.04), inset -2px -2px 4px rgba(255,255,255,0.4), inset 2px 2px 4px rgba(107,70,193,0.04)",
            }}
          >
            1/3 Done
          </span>
        </div>

        <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-2 scrollbar-hide">
          {TASKS.map((task) => (
            <label
              key={task.id}
              className={`flex flex-1 items-center gap-6 p-6 rounded-2xl cursor-pointer transition-all border ${
                task.done
                  ? "border-accent-border/30"
                  : "border-transparent hover:border-clay-border"
              }`}
              style={
                task.done
                  ? {
                      background: "var(--accent-bg)",
                      boxShadow:
                        "inset 3px 3px 6px rgba(107,70,193,0.04), inset -3px -3px 6px rgba(255,255,255,0.4)",
                    }
                  : {}
              }
              onMouseEnter={(e) => {
                if (!task.done) {
                  e.currentTarget.style.background = "var(--clay-bg)";
                  e.currentTarget.style.boxShadow =
                    "3px 3px 6px rgba(0,0,0,0.04), inset -3px -3px 6px rgba(255,255,255,0.4), inset 3px 3px 6px rgba(0,0,0,0.02)";
                }
              }}
              onMouseLeave={(e) => {
                if (!task.done) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              <input type="checkbox" className="hidden" defaultChecked={task.done} />
              <div
                className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center border-2 transition-all ${
                  task.done
                    ? "bg-accent-base border-accent-base"
                    : "border-text-dim hover:border-accent-base/50"
                }`}
                style={
                  task.done
                    ? {
                        boxShadow:
                          "0 0 12px var(--accent-shadow)",
                      }
                    : {}
                }
              >
                {task.done && (
                  <span className="text-white text-sm font-bold leading-none select-none">
                    &#10003;
                  </span>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-lg font-bold mb-1 transition-all ${
                      task.done
                        ? "text-text-dim line-through decoration-text-dimmer/50"
                        : "text-text"
                    }`}
                  >
                    {task.label}
                  </span>
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded border"
                    style={{
                      color: "var(--accent-base)",
                      background: "var(--accent-bg)",
                      borderColor: "rgba(107,70,193,0.15)",
                      boxShadow: "0 0 10px var(--accent-shadow)",
                    }}
                  >
                    +{task.xp} XP
                  </span>
                  <span className="text-[10px] font-black text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                    +{task.coins} 🪙
                  </span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* ── Right Column: Streak + Heatmap ── */}
      <div className="w-full xl:w-80 flex flex-col gap-6">
        {/* Streak Card */}
        <div className="clay rounded-3xl p-6 border border-clay-border flex flex-col items-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{
              background: "rgba(251, 146, 60, 0.08)",
              border: "1.5px solid rgba(251, 146, 60, 0.25)",
              boxShadow:
                "4px 4px 8px rgba(0,0,0,0.05), inset -4px -4px 8px rgba(255,255,255,0.5), inset 4px 4px 8px rgba(251,146,60,0.04)",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fb923c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-text">5 Days</h2>
          <p className="text-text-dim font-semibold text-sm mt-1">
            Current Streak
          </p>
        </div>

        {/* Heatmap Placeholder */}
        <div className="clay rounded-3xl p-6 border border-clay-border flex flex-col flex-1">
          <h2 className="text-lg font-extrabold text-text mb-4">
            Activity Heatmap
          </h2>
          <div
            className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed p-6"
            style={{
              borderColor: "var(--card-border)",
              background: "rgba(0,0,0,0.015)",
            }}
          >
            <p className="text-center text-text-dimmer font-medium text-sm">
              365-day grid coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
