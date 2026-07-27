"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface Task {
  id: string;
  label: string;
  xp: number;
  coins: number;
  done: boolean;
  user_id?: string;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();
  const todayStr = new Date().toISOString().split("T")[0];

  // Fetch tasks on mount (from localStorage first, then Supabase)
  useEffect(() => {
    const fetchTasks = async () => {
      let loadedTasks: Task[] = [];

      try {
        const localData = localStorage.getItem("scaffold_user_tasks");
        if (localData) {
          loadedTasks = JSON.parse(localData);
          setTasks(loadedTasks);
        }
      } catch (e) {
        console.error("Error reading localStorage tasks:", e);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: true });

        if (data && !error && data.length > 0) {
          loadedTasks = data;
          setTasks(data);
          try {
            localStorage.setItem("scaffold_user_tasks", JSON.stringify(data));
          } catch (e) {}
        }
      }

      setLoading(false);
    };

    fetchTasks();
  }, [supabase]);

  // Permanently turn today's heatmap square green when all to-do targets are completed
  const syncHeatmapDate = (updatedTasks: Task[], currentUser: any) => {
    const allDone = updatedTasks.length > 0 && updatedTasks.every((t) => t.done);
    const doneCount = updatedTasks.filter((t) => t.done).length;
    const storageKey = `scaffold_heatmap_v2_${currentUser?.id || "default"}`;
    try {
      const existing = localStorage.getItem(storageKey);
      const map = existing ? JSON.parse(existing) : {};
      
      if (allDone || doneCount > 0) {
        map[todayStr] = {
          date: todayStr,
          count: allDone ? Math.max(doneCount, 3) : doneCount,
          completed: allDone,
        };
      } else {
        map[todayStr] = {
          date: todayStr,
          count: 0,
          completed: false,
        };
      }
      localStorage.setItem(storageKey, JSON.stringify(map));

      if (currentUser?.id) {
        supabase.auth.updateUser({
          data: {
            heatmap_activity_v2: map,
          },
        });
      }
    } catch (e) {
      console.error("Error syncing heatmap date:", e);
    }
  };

  const handleToggleTask = async (id: string, currentDone: boolean) => {
    const nextDone = !currentDone;
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, done: nextDone } : t
    );

    setTasks(updatedTasks);
    try {
      localStorage.setItem("scaffold_user_tasks", JSON.stringify(updatedTasks));
    } catch (e) {}

    syncHeatmapDate(updatedTasks, user);

    if (user?.id) {
      await supabase
        .from("tasks")
        .update({ done: nextDone })
        .eq("id", id);
    }
  };

  const handleDeleteTask = async (id: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== id);
    setTasks(updatedTasks);
    try {
      localStorage.setItem("scaffold_user_tasks", JSON.stringify(updatedTasks));
    } catch (e) {}

    syncHeatmapDate(updatedTasks, user);

    if (user?.id) {
      await supabase.from("tasks").delete().eq("id", id);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = newTaskLabel.trim();
    if (!label) return;

    setNewTaskLabel("");

    // Fixed clean rewards (no random numbers)
    const xp = 20;
    const coins = 5;

    const tempId = `task_${Date.now()}`;
    const newTask: Task = {
      id: tempId,
      label,
      xp,
      coins,
      done: false,
      user_id: user?.id,
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    try {
      localStorage.setItem("scaffold_user_tasks", JSON.stringify(updatedTasks));
    } catch (e) {}

    if (user?.id) {
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

      if (data && !error) {
        const withRealId = updatedTasks.map((t) =>
          t.id === tempId ? data : t
        );
        setTasks(withRealId);
        try {
          localStorage.setItem("scaffold_user_tasks", JSON.stringify(withRealId));
        } catch (e) {}
      }
    }
  };

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="flex flex-col gap-6 w-full h-full flex-1">
      {/* ── FULL SCREEN Tasks Section ── */}
      <section className="clay rounded-3xl p-8 border border-clay-border flex flex-col flex-1 w-full h-full min-h-[70vh] shadow-sm">
        <div className="flex items-center justify-between mb-6 border-b border-black/5 pb-5">
          <h2 className="text-2xl font-black text-text flex items-center gap-3">
            Today&apos;s Targets
          </h2>
          <span
            className="text-sm font-extrabold uppercase tracking-wider px-4 py-2 rounded-xl"
            style={{
              color: "var(--accent-base)",
              background: "var(--accent-bg)",
              border: "1px solid var(--accent-border)",
            }}
          >
            {tasks.length > 0 ? `${doneCount}/${tasks.length} Completed` : "0 Targets"}
          </span>
        </div>

        {/* Task List (Full width, expanding) */}
        <div className="flex flex-col gap-3.5 flex-1 overflow-y-auto pr-2 scrollbar-hide mb-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-text-dim text-base font-medium">
              Loading targets...
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-accent-bg border border-accent-border">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent-base)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <p className="text-text-dim text-lg font-bold">No targets added today</p>
              <p className="text-text-dimmer text-sm">Add your first to-do below to build your consistency streak!</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-5 p-5 rounded-2xl transition-all border group w-full ${
                  task.done
                    ? "border-emerald-300/70 bg-emerald-500/10 shadow-sm"
                    : "border-clay-border hover:border-gray-400/50 bg-white"
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleTask(task.id, task.done)}
                  className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center border-2 transition-all ${
                    task.done
                      ? "bg-emerald-500 border-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]"
                      : "border-gray-300 hover:border-emerald-400"
                  }`}
                >
                  {task.done && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                {/* Task Info */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg font-bold truncate transition-all ${
                        task.done
                          ? "text-text-dim line-through decoration-text-dimmer/60"
                          : "text-text"
                      }`}
                    >
                      {task.label}
                    </span>
                    {task.done && (
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        COMPLETED ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400 hover:text-red-500 shrink-0"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Task Form (Full width) */}
        <form onSubmit={handleAddTask} className="flex items-center gap-3 mt-auto pt-5 border-t border-black/5 w-full">
          <input
            type="text"
            placeholder="Add a new to-do target..."
            value={newTaskLabel}
            onChange={(e) => setNewTaskLabel(e.target.value)}
            className="flex-1 bg-white border border-clay-border rounded-2xl px-5 py-4 text-base font-medium focus:outline-none focus:border-accent-base focus:ring-2 focus:ring-accent-bg transition-all placeholder:text-text-dimmer shadow-sm"
          />
          <button
            type="submit"
            disabled={!newTaskLabel.trim()}
            className="cta-button !px-8 !py-4 !rounded-2xl !text-base font-extrabold flex items-center gap-2 shrink-0"
          >
            <span>Add Target</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </form>
      </section>
    </div>
  );
}
