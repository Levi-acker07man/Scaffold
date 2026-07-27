"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newFutureTaskLabel, setNewFutureTaskLabel] = useState("");
  const [user, setUser] = useState<any>(null);

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

  // ── TIMER STATE ──
  const [timerSeconds, setTimerSeconds] = useState<number>(1500); // 25m default
  const [initialSeconds, setInitialSeconds] = useState<number>(1500);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerCompleted, setTimerCompleted] = useState<boolean>(false);
  const [liveClockStr, setLiveClockStr] = useState<string>("");

  const supabase = useMemo(() => createClient(), []);
  const dateSliderRef = useRef<HTMLDivElement>(null);

  // Live Clock string in corner
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveClockStr(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer countdown hook
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setTimerCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timerSeconds]);

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
    const updatedTasks = tasks.filter((t) => t.id !== id);
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

    const xp = 20;
    const coins = 5;
    const tempId = `task_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 6)}`;

    const newTask: Task = {
      id: tempId,
      label,
      xp,
      coins,
      done: false,
      user_id: user?.id,
      date: targetDate,
    };

    const updatedTasks = [...tasks, newTask];
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
      let insertPayload: any = {
        user_id: user.id,
        label,
        xp,
        coins,
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

  const formatTimerTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full h-full flex-1 min-h-[calc(100vh-100px)]">
      {/* ══════════════════════════════════════════════════
          LEFT COLUMN (7 cols): TODAY'S TARGETS (WITH CHECKBOXES)
         ══════════════════════════════════════════════════ */}
      <section className="clay rounded-3xl p-6 lg:p-8 border border-clay-border flex flex-col lg:col-span-7 h-full min-h-[520px] shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-4">
          <div>
            <h2 className="text-2xl font-black text-text flex items-center gap-3">
              Today&apos;s Targets
            </h2>
            <p className="text-xs font-semibold text-text-dimmer mt-1">
              Targets scheduled for today automatically appear here
            </p>
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
            placeholder="✨ Add a target for today..."
            value={newTaskLabel}
            onChange={(e) => setNewTaskLabel(e.target.value)}
            className="flex-1 bg-white border-2 border-clay-border hover:border-accent-border/80 rounded-2xl px-4 py-3.5 text-sm md:text-base font-medium focus:outline-none focus:border-accent-base focus:ring-4 focus:ring-accent-base/20 transition-all duration-300 placeholder:text-text-dimmer shadow-sm hover:shadow-md focus:scale-[1.01]"
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
        <div className="flex flex-col gap-3.5 flex-1 overflow-y-auto pr-2 scrollbar-hide">
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
              <div className="text-center">
                <p className="text-text-dim text-lg font-bold">
                  No targets scheduled for today
                </p>
                <p className="text-text-dimmer text-sm mt-1">
                  Add a target above or schedule upcoming days in the planner!
                </p>
              </div>
            </div>
          ) : (
            todayTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-4 p-4 lg:p-5 rounded-2xl transition-all duration-300 ease-out transform hover:-translate-y-0.5 hover:scale-[1.01] border group w-full ${
                  task.done
                    ? "border-emerald-300/80 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 shadow-sm"
                    : "border-clay-border hover:border-accent-border/60 hover:shadow-md bg-white"
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
                      className={`text-base lg:text-lg font-bold truncate transition-all duration-300 ${
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
      <div className="lg:col-span-5 flex flex-col gap-5 h-full">
        {/* ── UPPER HALF: COMPACT FOCUS TIMER WIDGET ── */}
        <section className="clay rounded-3xl p-5 border border-clay-border flex flex-col shrink-0 shadow-sm">
          <div className="flex items-center justify-between border-b border-black/5 pb-2.5 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-accent-bg border border-accent-border flex items-center justify-center">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent-base)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-black text-text">Focus Timer</h3>
                <p className="text-[10px] font-medium text-text-dimmer">
                  Custom countdown session
                </p>
              </div>
            </div>
            {/* Subtle live clock indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-input-bg border border-clay-border">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-mono font-extrabold text-text tracking-wider">
                {liveClockStr || "00:00"}
              </span>
            </div>
          </div>

          {/* Compact Digital Timer Display */}
          <div className="flex flex-col items-center justify-center py-3 px-4 rounded-2xl bg-input-bg border border-clay-border relative overflow-hidden">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-text-dimmer mb-0.5">
              {timerCompleted
                ? "Session Completed! 🎉"
                : isRunning
                ? "Session in Progress"
                : "Ready to Focus"}
            </span>
            <div className="text-4xl font-black tracking-tight text-text font-mono my-0.5">
              {formatTimerTime(timerSeconds)}
            </div>

            {/* Time Adjustment Presets */}
            <div className="flex items-center gap-1 flex-wrap justify-center mt-2">
              {[
                { label: "15m", secs: 900 },
                { label: "25m", secs: 1500 },
                { label: "45m", secs: 2700 },
                { label: "60m", secs: 3600 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setIsRunning(false);
                    setTimerCompleted(false);
                    setTimerSeconds(preset.secs);
                    setInitialSeconds(preset.secs);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-xs font-extrabold border transition-all ${
                    initialSeconds === preset.secs && !timerCompleted
                      ? "bg-accent-base text-void border-accent-base shadow-xs"
                      : "bg-white text-text border-clay-border hover:border-gray-400"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() => {
                  const next = Math.max(60, timerSeconds - 60);
                  setTimerSeconds(next);
                  setInitialSeconds(next);
                }}
                className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-white text-text border border-clay-border hover:border-gray-400"
                title="Subtract 1 minute"
              >
                -1m
              </button>
              <button
                onClick={() => {
                  const next = timerSeconds + 60;
                  setTimerSeconds(next);
                  setInitialSeconds(next);
                }}
                className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-white text-text border border-clay-border hover:border-gray-400"
                title="Add 1 minute"
              >
                +1m
              </button>
            </div>
          </div>

          {/* Completion Alert */}
          {timerCompleted && (
            <div className="mt-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-between">
              <span>🎉 Time&apos;s up! Great session.</span>
              <button
                onClick={() => {
                  setTimerCompleted(false);
                  setTimerSeconds(initialSeconds);
                }}
                className="underline font-extrabold hover:text-emerald-950"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Compact Timer Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => {
                if (timerCompleted) setTimerCompleted(false);
                setIsRunning(!isRunning);
              }}
              className="cta-button !py-2.5 !rounded-xl flex-1 !text-xs font-extrabold flex items-center justify-center gap-1.5"
            >
              {isRunning ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                  >
                    <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                    <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                  </svg>
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <span>
                    {timerSeconds === initialSeconds ? "Start Timer" : "Resume"}
                  </span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsRunning(false);
                setTimerCompleted(false);
                setTimerSeconds(initialSeconds);
              }}
              className="px-3 py-2.5 rounded-xl text-xs font-extrabold border border-clay-border bg-input-bg hover:bg-gray-200/50 text-text transition-all flex items-center justify-center gap-1.5"
              title="Reset Timer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Reset</span>
            </button>
          </div>
        </section>

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
                className="w-7 h-8 rounded-xl border border-clay-border bg-white hover:bg-gray-100 flex items-center justify-center text-text-dim font-bold transition-all shrink-0 shadow-xs"
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
                          ? "bg-gradient-to-br from-accent-base to-purple-700 text-void border-accent-base shadow-lg scale-105 ring-2 ring-accent-base/30"
                          : "bg-input-bg text-text border-clay-border hover:border-accent-border/60 hover:bg-white hover:shadow-xs"
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
                className="w-7 h-8 rounded-xl border border-clay-border bg-white hover:bg-gray-100 flex items-center justify-center text-text-dim font-bold transition-all shrink-0 shadow-xs transform hover:scale-110 active:scale-90"
                title="Slide right"
              >
                ›
              </button>
            </div>

            {/* Selected Date Header */}
            <div className="flex items-center justify-between mt-2.5 mb-1.5 px-1 shrink-0">
              <span className="text-xs font-black uppercase tracking-wider text-text-dim">
                {selectedDateObj?.label || selectedFutureDate}
              </span>
              <span className="text-[10px] font-semibold text-text-dimmer">
                No checkboxes (Heatmap safe)
              </span>
            </div>

            {/* Add Future Task Form (ANIMATED & INTERACTIVE) */}
            <form
              onSubmit={handleAddFutureTask}
              className="flex items-center gap-2 mb-2.5 shrink-0 relative group"
            >
              <input
                type="text"
                placeholder={`📅 Schedule target for ${selectedDateObj?.dayName || "this day"}...`}
                value={newFutureTaskLabel}
                onChange={(e) => setNewFutureTaskLabel(e.target.value)}
                className="flex-1 bg-white border-2 border-clay-border hover:border-accent-border/80 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:border-accent-base focus:ring-4 focus:ring-accent-base/20 transition-all duration-300 placeholder:text-text-dimmer shadow-xs hover:shadow-sm focus:scale-[1.01]"
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
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1 scrollbar-hide my-1 max-h-[160px]">
              {futureTasksForSelectedDate.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-5 px-4 rounded-xl bg-input-bg border border-clay-border/50">
                  <p className="text-xs font-bold text-text-dim">
                    No targets scheduled for this date
                  </p>
                  <p className="text-[11px] text-text-dimmer mt-0.5 text-center">
                    Add targets above to have them ready when the day arrives
                  </p>
                </div>
              ) : (
                futureTasksForSelectedDate.map((task, idx) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-clay-border bg-white hover:border-accent-border/60 hover:shadow-sm transition-all duration-300 ease-out transform hover:-translate-y-0.5 hover:scale-[1.01] group shrink-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Number badge instead of checkbox */}
                      <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-bg to-purple-100 border border-accent-border flex items-center justify-center text-xs font-extrabold text-accent-base shrink-0 shadow-xs">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-text truncate group-hover:text-accent-base transition-colors duration-200">
                        {task.label}
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

