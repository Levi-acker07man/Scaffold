"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useShop } from "@/shared/context/ShopContext";
import { FocusTimerWidget } from "@/shared/components/FocusTimerWidget";

interface Task {
  id: string;
  label: string;
  xp: number;
  coins: number;
  done: boolean;
  user_id?: string;
  date?: string; // YYYY-MM-DD format (if undefined/null, defaults to today)
}

interface UpcomingDate {
  dateStr: string;
  dayName: string;
  dayNum: string;
  monthName: string;
  label: string;
}

export default function DashboardPage() {
  const { addReward, subtractReward } = useShop();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newFutureTaskLabel, setNewFutureTaskLabel] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const normalizeTasksByDay = (taskList: Task[], referenceTodayStr: string): Task[] => {
    const counts: Record<string, number> = {};
    taskList.forEach((t) => {
      const d = t.date || referenceTodayStr;
      counts[d] = (counts[d] || 0) + 1;
    });

    return taskList.map((t) => {
      const d = t.date || referenceTodayStr;
      const total = counts[d] || 1;
      const reward = Number((10 / total).toFixed(1));
      return {
        ...t,
        xp: reward,
        coins: reward,
      };
    });
  };

  // Today's date string in YYYY-MM-DD (local timezone)
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Upcoming 14 days starting from Tomorrow
  const upcomingDates = useMemo(() => {
    const dates: UpcomingDate[] = [];
    const [y, m, d] = todayStr.split("-").map(Number);
    const baseDate = new Date(y, m - 1, d);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let i = 1; i <= 14; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setDate(baseDate.getDate() + i);
      const year = nextDate.getFullYear();
      const month = String(nextDate.getMonth() + 1).padStart(2, "0");
      const day = String(nextDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const dayName = dayNames[nextDate.getDay()];
      const monthName = monthNames[nextDate.getMonth()];
      const dayNum = String(nextDate.getDate());

      dates.push({
        dateStr,
        dayName,
        dayNum,
        monthName,
        label: i === 1 ? "Tomorrow" : `${dayName}, ${monthName} ${dayNum}`,
      });
    }
    return dates;
  }, [todayStr]);

  const [selectedFutureDate, setSelectedFutureDate] = useState<string>(
    () => upcomingDates[0]?.dateStr || ""
  );

  const supabase = useMemo(() => createClient(), []);
  const dateSliderRef = useRef<HTMLDivElement>(null);

  // Fetch tasks on mount (from localStorage first, then Supabase)
  useEffect(() => {
    const fetchTasks = async () => {
      let loadedTasks: Task[] = [];
      const localTasksMap = new Map<string, Task>();

      try {
        const localData = localStorage.getItem("scaffold_user_tasks");
        if (localData) {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) {
            parsed.forEach((t: Task) => {
              if (t && t.id) localTasksMap.set(t.id, t);
            });
          }
        }
      } catch (e) {
        console.error("Error reading localStorage tasks:", e);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: true });

        if (data && !error && data.length > 0) {
          loadedTasks = data.map((st: any) => {
            const local = localTasksMap.get(st.id);
            return {
              ...st,
              date: st.date || local?.date || todayStr,
            };
          });
          // Preserve any local tasks (e.g. future scheduled tasks) not yet in Supabase
          localTasksMap.forEach((lt, id) => {
            if (!loadedTasks.some((st) => st.id === id)) {
              loadedTasks.push(lt);
            }
          });
          setTasks(loadedTasks);
          try {
            localStorage.setItem(
              "scaffold_user_tasks",
              JSON.stringify(loadedTasks)
            );
          } catch (e) {}
        } else if (localTasksMap.size > 0) {
          loadedTasks = Array.from(localTasksMap.values());
          setTasks(loadedTasks);
        }
      } else if (localTasksMap.size > 0) {
        loadedTasks = Array.from(localTasksMap.values());
        setTasks(loadedTasks);
      }

      setLoading(false);
      syncHeatmapDate(loadedTasks, session?.user || null);
    };

    fetchTasks();
  }, [supabase, todayStr]);

  // Sync heatmap ONLY for today's tasks
  const syncHeatmapDate = (allTasks: Task[], currentUser: any) => {
    const todayTasks = allTasks.filter(
      (t) => !t.date || t.date === todayStr
    );
    const allDone =
      todayTasks.length > 0 && todayTasks.every((t) => t.done);
    const doneCount = todayTasks.filter((t) => t.done).length;

    const updateKey = (key: string) => {
      try {
        const existing = localStorage.getItem(key);
        const map = existing ? JSON.parse(existing) : {};

        if (allDone) {
          map[todayStr] = {
            date: todayStr,
            count: Math.max(doneCount, 3),
            completed: true,
          };
        } else {
          delete map[todayStr];
        }
        localStorage.setItem(key, JSON.stringify(map));
        return map;
      } catch (e) {
        console.error("Error syncing heatmap date:", e);
        return null;
      }
    };

    const defaultMap = updateKey("scaffold_heatmap_v2_default");
    let userMap = defaultMap;
    if (currentUser?.id) {
      userMap = updateKey(`scaffold_heatmap_v2_${currentUser.id}`) || defaultMap;
      try {
        supabase.auth.updateUser({
          data: {
            heatmap_activity_v2: userMap,
          },
        });
      } catch (e) {}
    }

    try {
      window.dispatchEvent(
        new CustomEvent("scaffold_heatmap_updated", {
          detail: { map: userMap || defaultMap, todayStr },
        })
      );
    } catch (e) {}
  };

  const handleToggleTask = async (id: string, currentDone: boolean) => {
    const nextDone = !currentDone;
    const task = tasks.find((t) => t.id === id);
    const d = task?.date || todayStr;
    const dayTasks = tasks.filter((t) => (t.date || todayStr) === d);
    const N = dayTasks.length || 1;
    const oldDoneCount = dayTasks.filter((t) => t.done).length;
    const newDoneCount = nextDone
      ? oldDoneCount + 1
      : Math.max(0, oldDoneCount - 1);

    const oldCumulative = Math.min(
      10,
      Number((oldDoneCount * (10 / N)).toFixed(1))
    );
    const newCumulative = Math.min(
      10,
      Number((newDoneCount * (10 / N)).toFixed(1))
    );

    if (nextDone && newCumulative > oldCumulative) {
      const earned = Number((newCumulative - oldCumulative).toFixed(1));
      await addReward(earned, earned);
    } else if (!nextDone && oldCumulative > newCumulative) {
      const lost = Number((oldCumulative - newCumulative).toFixed(1));
      await subtractReward(lost, lost);
    }

    const updatedTasks = normalizeTasksByDay(
      tasks.map((t) => (t.id === id ? { ...t, done: nextDone } : t)),
      todayStr
    );

    setTasks(updatedTasks);
    try {
      localStorage.setItem(
        "scaffold_user_tasks",
        JSON.stringify(updatedTasks)
      );
    } catch (e) {}

    syncHeatmapDate(updatedTasks, user);

    if (user?.id) {
      await supabase.from("tasks").update({ done: nextDone }).eq("id", id);
    }
  };

  const handleDeleteTask = async (id: string) => {
    const updatedTasks = normalizeTasksByDay(
      tasks.filter((t) => t.id !== id),
      todayStr
    );
    setTasks(updatedTasks);
    try {
      localStorage.setItem(
        "scaffold_user_tasks",
        JSON.stringify(updatedTasks)
      );
    } catch (e) {}

    syncHeatmapDate(updatedTasks, user);

    if (user?.id) {
      await supabase.from("tasks").delete().eq("id", id);
    }
  };

  const handleCreateTask = async (labelStr: string, targetDate: string) => {
    const label = labelStr.trim();
    if (!label) return;

    const tempId = `task_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 6)}`;

    const newTask: Task = {
      id: tempId,
      label,
      xp: 10,
      coins: 10,
      done: false,
      user_id: user?.id,
      date: targetDate,
    };

    const updatedTasks = normalizeTasksByDay([...tasks, newTask], todayStr);
    setTasks(updatedTasks);
    try {
      localStorage.setItem(
        "scaffold_user_tasks",
        JSON.stringify(updatedTasks)
      );
    } catch (e) {}

    if (targetDate === todayStr) {
      syncHeatmapDate(updatedTasks, user);
    }

    if (user?.id) {
      const created = updatedTasks.find((t) => t.id === tempId) || newTask;
      let insertPayload: any = {
        user_id: user.id,
        label,
        xp: created.xp,
        coins: created.coins,
        done: false,
        date: targetDate,
      };

      let { data, error } = await supabase
        .from("tasks")
        .insert(insertPayload)
        .select()
        .single();

      // Fallback if 'date' column does not exist in Supabase schema
      if (
        error &&
        (error.code === "42703" ||
          error.message?.includes("column") ||
          error.code === "PGRST204")
      ) {
        delete insertPayload.date;
        const fallbackRes = await supabase
          .from("tasks")
          .insert(insertPayload)
          .select()
          .single();
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (data && !error) {
        const withRealId = updatedTasks.map((t) =>
          t.id === tempId ? { ...data, date: targetDate } : t
        );
        setTasks(withRealId);
        try {
          localStorage.setItem(
            "scaffold_user_tasks",
            JSON.stringify(withRealId)
          );
        } catch (e) {}
      }
    }
  };

  const handleAddTodayTask = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateTask(newTaskLabel, todayStr);
    setNewTaskLabel("");
  };

  const handleAddFutureTask = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateTask(newFutureTaskLabel, selectedFutureDate);
    setNewFutureTaskLabel("");
  };

  const slideLeft = () => {
    if (dateSliderRef.current) {
      dateSliderRef.current.scrollBy({ left: -220, behavior: "smooth" });
    }
  };

  const slideRight = () => {
    if (dateSliderRef.current) {
      dateSliderRef.current.scrollBy({ left: 220, behavior: "smooth" });
    }
  };

  // Filter tasks for Today vs Selected Future Date
  const todayTasks = tasks.filter((t) => !t.date || t.date === todayStr);
  const futureTasksForSelectedDate = tasks.filter(
    (t) => t.date === selectedFutureDate
  );

  const todayDoneCount = todayTasks.filter((t) => t.done).length;
  const selectedDateObj = upcomingDates.find(
    (d) => d.dateStr === selectedFutureDate
  );

  if (!isMounted) {
    return <div className="w-full h-full flex items-center justify-center text-text-dim">Loading...</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-full flex-1 min-h-0">
      {/* ══════════════════════════════════════════════════
          LEFT COLUMN (7 cols): TODAY'S TARGETS (WITH CHECKBOXES)
         ══════════════════════════════════════════════════ */}
      <section className="clay rounded-3xl p-6 lg:p-8 border border-clay-border flex flex-col w-full lg:w-7/12 h-full min-h-0 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-4">
          <div>
            <h2 className="text-2xl font-black text-text flex items-center gap-3">
              Today&apos;s Targets
            </h2>
          </div>
          <span
            className="text-xs font-extrabold uppercase tracking-wider px-3.5 py-2 rounded-xl shrink-0"
            style={{
              color: "var(--accent-base)",
              background: "var(--accent-bg)",
              border: "1px solid var(--accent-border)",
            }}
          >
            {todayTasks.length > 0
              ? `${todayDoneCount}/${todayTasks.length} Completed`
              : "0 Targets"}
          </span>
        </div>

        {/* Add Today's Task Form (ANIMATED & INTERACTIVE) */}
        <form
          onSubmit={handleAddTodayTask}
          className="flex items-center gap-3 mb-5 shrink-0 relative group"
        >
          <input
            type="text"
            placeholder="Add Task"
            value={newTaskLabel}
            onChange={(e) => setNewTaskLabel(e.target.value)}
            className="flex-1 bg-input-bg text-text border-2 border-clay-border hover:border-accent-border/80 rounded-2xl px-4 py-3.5 text-sm md:text-base font-medium focus:outline-none focus:border-accent-base focus:ring-4 focus:ring-accent-base/20 transition-all duration-300 placeholder:text-text-dimmer shadow-sm hover:shadow-md focus:scale-[1.01]"
          />
          <button
            type="submit"
            disabled={!newTaskLabel.trim()}
            className="cta-button !px-6 !py-3.5 !rounded-2xl !text-sm md:!text-base font-extrabold flex items-center gap-2 shrink-0 transform hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 group/btn"
          >
            <span>Add Target</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover/btn:rotate-90 group-hover/btn:scale-110"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </form>

        {/* Task List (Today) */}
        <div className="flex flex-col gap-3.5 flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center h-full text-text-dim text-base font-medium animate-pulse">
              Loading targets...
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-accent-bg border border-accent-border animate-bounce shadow-md">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent-base)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div className="text-center text-text-dim text-lg font-bold">
                No Tasks
              </div>
            </div>
          ) : (
            todayTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-4 p-4 lg:p-5 rounded-2xl transition-all duration-300 ease-out transform hover:-translate-y-0.5 hover:scale-[1.01] hover:z-10 relative border group w-full ${
                  task.done
                    ? "border-emerald-300/80 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 shadow-sm"
                    : "border-clay-border hover:border-accent-border/60 hover:shadow-md bg-white dark:bg-panel"
                }`}
              >
                {/* Checkbox (ONLY FOR TODAY - ANIMATED BOUNCE) */}
                <button
                  onClick={() => handleToggleTask(task.id, task.done)}
                  className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center border-2 transform hover:scale-110 active:scale-90 transition-all duration-200 ${
                    task.done
                      ? "bg-emerald-500 border-emerald-500 shadow-[0_0_14px_rgba(34,197,94,0.5)]"
                      : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50"
                  }`}
                >
                  {task.done && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-in zoom-in duration-200"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                {/* Task Label */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-base lg:text-lg font-light truncate transition-all duration-300 ${
                        task.done
                          ? "text-text-dim line-through decoration-text-dimmer/60"
                          : "text-text group-hover:text-accent-base"
                      }`}
                    >
                      {task.label}
                    </span>
                    {task.done && (
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0 shadow-xs animate-pulse">
                        COMPLETED ✓
                      </span>
                    )}
                      <span
                        className="text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center gap-1.5 shrink-0"
                        title="Daily reward share for this task"
                      >
                        <span>🪙 {task.coins || 10}</span>
                        <span className="text-gray-600 dark:text-white flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                          {task.xp || 10} XP
                        </span>
                      </span>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110 active:scale-90 w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400 hover:text-red-500 shrink-0"
                  title="Remove target"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          RIGHT COLUMN (5 cols): COMPACT TIMER + EXPANDED FUTURE PLANNER
         ══════════════════════════════════════════════════ */}
      <div className="w-full lg:w-5/12 flex flex-col gap-5 h-full min-h-0">
        <FocusTimerWidget />

        {/* ── LOWER HALF: COMPACT SLIDING DATE & FUTURE DAY PLANNER ── */}
        <section className="clay rounded-3xl p-5 border border-clay-border flex flex-col flex-1 shadow-sm justify-between">
          <div className="flex flex-col flex-1 min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/5 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-accent-bg border border-accent-border flex items-center justify-center">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent-base)"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-text">
                    Future Days Planner
                  </h3>
                  <p className="text-[10px] font-medium text-text-dimmer">
                    Schedule upcoming day targets
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-accent-bg text-text border border-accent-border">
                {futureTasksForSelectedDate.length}{" "}
                {futureTasksForSelectedDate.length === 1 ? "Target" : "Targets"}
              </span>
            </div>

            {/* Horizontal Sliding Date Option */}
            <div className="relative flex items-center gap-1 my-1.5 shrink-0">
              <button
                onClick={slideLeft}
                type="button"
                className="w-7 h-8 rounded-xl border border-clay-border bg-white dark:bg-panel hover:bg-gray-100 dark:hover:bg-panel-2 flex items-center justify-center text-text-dim font-bold transition-all shrink-0 shadow-xs"
                title="Slide left"
              >
                ‹
              </button>
              <div
                ref={dateSliderRef}
                className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 px-1 scroll-smooth flex-1"
              >
                {upcomingDates.map((d) => {
                  const countForDay = tasks.filter(
                    (t) => t.date === d.dateStr
                  ).length;
                  const isSelected = selectedFutureDate === d.dateStr;
                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => setSelectedFutureDate(d.dateStr)}
                      className={`flex flex-col items-center justify-center min-w-[54px] py-1.5 px-2 rounded-xl border transition-all duration-200 ease-out transform hover:-translate-y-0.5 shrink-0 relative ${
                        isSelected
                          ? "bg-gray-200 dark:bg-white text-black border-gray-300 dark:border-white shadow-md dark:shadow-[0_0_12px_rgba(255,255,255,0.5)] scale-105 ring-2 ring-gray-300/50 dark:ring-white/30"
                          : "bg-input-bg text-text border-clay-border hover:border-accent-border/60 hover:bg-white dark:hover:bg-panel-2 hover:shadow-xs"
                      }`}
                    >
                      <span className="text-[9px] font-extrabold tracking-wider uppercase opacity-75">
                        {d.dayName}
                      </span>
                      <span className="text-xs font-black my-0.5">
                        {d.dayNum}
                      </span>
                      <span className="text-[9px] font-bold uppercase opacity-70">
                        {d.monthName}
                      </span>
                      {countForDay > 0 && (
                        <span className="mt-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500 text-white leading-none shadow-xs animate-pulse">
                          {countForDay}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={slideRight}
                type="button"
                className="w-7 h-8 rounded-xl border border-clay-border bg-white dark:bg-panel hover:bg-gray-100 dark:hover:bg-panel-2 flex items-center justify-center text-text-dim font-bold transition-all shrink-0 shadow-xs transform hover:scale-110 active:scale-90"
                title="Slide right"
              >
                ›
              </button>
            </div>



            {/* Add Future Task Form (ANIMATED & INTERACTIVE) */}
            <form
              onSubmit={handleAddFutureTask}
              className="flex items-center gap-2 mb-2.5 shrink-0 relative group"
            >
              <input
                type="text"
                placeholder={`Add Task for ${selectedDateObj?.dayName || "this day"}`}
                value={newFutureTaskLabel}
                onChange={(e) => setNewFutureTaskLabel(e.target.value)}
                className="flex-1 bg-input-bg text-text border-2 border-clay-border hover:border-accent-border/80 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:border-accent-base focus:ring-4 focus:ring-accent-base/20 transition-all duration-300 placeholder:text-text-dimmer shadow-xs hover:shadow-sm focus:scale-[1.01]"
              />
              <button
                type="submit"
                disabled={!newFutureTaskLabel.trim()}
                className="cta-button !px-4 !py-2.5 !rounded-xl !text-xs font-extrabold flex items-center gap-1.5 shrink-0 transform hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0 group/btn"
              >
                <span>Add</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover/btn:rotate-90 group-hover/btn:scale-110"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </form>

            {/* Future Tasks List for Selected Date */}
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1 scrollbar-hide my-1 min-h-0">
              {futureTasksForSelectedDate.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs font-bold text-text-dim pb-4">
                  No Tasks
                </div>
              ) : (
                futureTasksForSelectedDate.map((task, idx) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-clay-border bg-white dark:bg-panel hover:border-accent-border/60 hover:shadow-sm transition-all duration-300 ease-out transform hover:-translate-y-0.5 hover:scale-[1.01] hover:z-10 relative group shrink-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Number badge instead of checkbox */}
                      <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-bg to-purple-100 border border-accent-border flex items-center justify-center text-xs font-extrabold text-accent-base shrink-0 shadow-xs">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-light text-text truncate group-hover:text-accent-base transition-colors duration-200">
                        {task.label}
                      </span>
                      <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center gap-1 shrink-0">
                        <span>🪙 {task.coins || 10}</span>
                        <span className="text-gray-600 dark:text-white flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                          {task.xp || 10} XP
                        </span>
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110 active:scale-90 w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400 hover:text-red-500 shrink-0"
                      title="Remove target"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

