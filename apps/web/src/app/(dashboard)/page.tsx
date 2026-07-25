"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface Task {
  id: string;
  label: string;
  xp: number;
  coins: number;
  done: boolean;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [user, setUser] = useState<any>(null);
  
  const supabase = createClient();

  // Fetch tasks on mount
  useEffect(() => {
    const fetchTasks = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      setUser(session.user);

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true });

      if (data) setTasks(data);
      setLoading(false);
    };

    fetchTasks();
  }, []);

  const handleToggleTask = async (id: string, currentDone: boolean) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !currentDone } : t))
    );

    await supabase
      .from("tasks")
      .update({ done: !currentDone })
      .eq("id", id);
  };

  const handleDeleteTask = async (id: string) => {
    // Optimistic UI update
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskLabel.trim() || !user) return;

    const label = newTaskLabel.trim();
    setNewTaskLabel(""); // clear input

    // Randomize XP and Coins for fun (just as an example, you can change this)
    const xp = Math.floor(Math.random() * 50) + 10;
    const coins = Math.floor(Math.random() * 10) + 5;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        label,
        xp,
        coins,
        done: false,
      })
      .select()
      .single();

    if (data) {
      setTasks((prev) => [...prev, data]);
    }
  };

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* ── Left Column: Tasks ── */}
      <section className="clay rounded-3xl p-6 border border-clay-border flex-1 flex flex-col min-h-[500px]">
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
            {tasks.length > 0 ? `${doneCount}/${tasks.length} Done` : "0 Targets"}
          </span>
        </div>

        {/* Task List */}
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 scrollbar-hide mb-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-text-dim text-sm font-medium">
              Loading targets...
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex items-center justify-center h-full text-text-dim text-sm font-medium">
              You don't have any targets yet. Add one below!
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all border group ${
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
                {/* Custom Checkbox */}
                <button
                  onClick={() => handleToggleTask(task.id, task.done)}
                  className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center border-2 transition-all ${
                    task.done
                      ? "bg-accent-base border-accent-base"
                      : "border-text-dim hover:border-accent-base/50"
                  }`}
                  style={
                    task.done
                      ? { boxShadow: "0 0 12px var(--accent-shadow)" }
                      : {}
                  }
                >
                  {task.done && (
                    <span className="text-white text-sm font-bold leading-none select-none">
                      &#10003;
                    </span>
                  )}
                </button>

                {/* Task Info */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-base font-bold truncate transition-all ${
                        task.done
                          ? "text-text-dim line-through decoration-text-dimmer/50"
                          : "text-text"
                      }`}
                    >
                      {task.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
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

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400 hover:text-red-500 shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="flex items-center gap-2 mt-auto pt-4 border-t border-black/5">
          <input
            type="text"
            placeholder="Add a new target..."
            value={newTaskLabel}
            onChange={(e) => setNewTaskLabel(e.target.value)}
            className="flex-1 bg-white border border-clay-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-accent-base focus:ring-2 focus:ring-accent-bg transition-all placeholder:text-text-dimmer"
          />
          <button
            type="submit"
            disabled={!newTaskLabel.trim()}
            className="bg-accent-base text-white px-5 py-3 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
          >
            <span>Add</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </form>
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
            className="flex-1 min-h-[150px] flex items-center justify-center rounded-xl border-2 border-dashed p-6"
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
