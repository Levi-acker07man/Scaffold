"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";

interface Task {
  id: string;
  label: string;
  xp: number;
  coins: number;
  done: boolean;
  created_at?: string;
}

interface DayActivity {
  date: string; // YYYY-MM-DD
  count: number;
  completed: boolean;
}

export default function HeatmapPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityMap, setActivityMap] = useState<Record<string, DayActivity>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);

  const supabase = useMemo(() => createClient(), []);
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Use a v2 storage key so any old random/demo data from previous tests is ignored!
  const getStorageKey = (userId?: string) => `scaffold_heatmap_v2_${userId || "default"}`;

  // Fetch real tasks and real heatmap activity on mount
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      let mergedMap: Record<string, DayActivity> = {};
      const storageKey = getStorageKey(session?.user?.id);

      // 1. Load from v2 localStorage (completely clean of old demo data)
      try {
        const local = localStorage.getItem(storageKey);
        if (local) {
          mergedMap = JSON.parse(local);
        }
      } catch (e) {
        console.error("Error reading localStorage:", e);
      }

      // 2. Load real activity from Supabase user metadata
      if (session?.user) {
        setUser(session.user);
        try {
          const { data: userData } = await supabase.auth.getUser();
          const metaMap = userData.user?.user_metadata?.heatmap_activity_v2;
          if (metaMap && typeof metaMap === "object") {
            mergedMap = { ...mergedMap, ...metaMap };
          }
        } catch (e) {
          console.error("Error loading user metadata:", e);
        }

        // 3. Fetch user tasks from Supabase database or fallback to localStorage
        let allTasks: Task[] = [];
        try {
          const localTasksStr = localStorage.getItem("scaffold_user_tasks");
          if (localTasksStr) {
            allTasks = JSON.parse(localTasksStr);
          }
        } catch (e) {}

        const { data: dbTasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: true });

        if (dbTasks && dbTasks.length > 0) {
          allTasks = dbTasks;
        }

        setTasks(allTasks);

        // Turn today permanently green when all items in the to-do list are checked completed
        const allDone = allTasks.length > 0 && allTasks.every((t) => t.done);
        const doneCount = allTasks.filter((t) => t.done).length;

        if (allDone || doneCount > 0) {
          mergedMap[todayStr] = {
            date: todayStr,
            count: allDone ? Math.max(doneCount, 3) : doneCount,
            completed: allDone,
          };
        }
      }

      setActivityMap(mergedMap);
      setLoading(false);
    };

    fetchAllData();
  }, [supabase, todayStr]);

  // Save real heatmap data persistently
  const saveActivityMap = async (newMap: Record<string, DayActivity>) => {
    const storageKey = getStorageKey(user?.id);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newMap));
    } catch (e) {
      console.error("Error saving localStorage:", e);
    }

    if (user?.id) {
      try {
        await supabase.auth.updateUser({
          data: {
            heatmap_activity_v2: newMap,
          },
        });
      } catch (e) {}
    }
  };

  // Toggle a day active/completed when clicked on the heatmap
  const handleCellClick = async (dateStr: string, isFuture: boolean) => {
    if (isFuture) return;

    const current = activityMap[dateStr];
    const isNowCompleted = !current?.completed;
    const newCount = isNowCompleted ? (current?.count ? current.count + 1 : 1) : 0;

    const updatedMap: Record<string, DayActivity> = {
      ...activityMap,
      [dateStr]: {
        date: dateStr,
        count: newCount,
        completed: isNowCompleted,
      },
    };

    setActivityMap(updatedMap);
    await saveActivityMap(updatedMap);
  };

  // Calculate Streak Counters strictly from real activity (ZERO random numbers)
  const { currentStreak, longestStreak, totalActiveDays } = useMemo(() => {
    let current = 0;
    let longest = 0;
    let temp = 0;

    const now = new Date();
    let checkDate = new Date(now);
    let dateStr = checkDate.toISOString().split("T")[0];

    // Count backwards for active streak
    if (activityMap[dateStr]?.completed) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
      dateStr = checkDate.toISOString().split("T")[0];
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      dateStr = checkDate.toISOString().split("T")[0];
    }

    while (activityMap[dateStr]?.completed) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
      dateStr = checkDate.toISOString().split("T")[0];
    }

    // Longest streak across all real active dates
    const activeDates = Object.keys(activityMap)
      .filter((d) => activityMap[d]?.completed)
      .sort();

    if (activeDates.length > 0) {
      temp = 1;
      longest = 1;
      for (let i = 1; i < activeDates.length; i++) {
        const prev = new Date(activeDates[i - 1]);
        const curr = new Date(activeDates[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          temp++;
          if (temp > longest) longest = temp;
        } else if (diffDays > 1) {
          temp = 1;
        }
      }
    }

    const totalDays = Object.values(activityMap).filter((d) => d.completed || d.count > 0).length;

    return {
      currentStreak: Math.max(current, activityMap[todayStr]?.completed ? 1 : 0),
      longestStreak: Math.max(longest, current),
      totalActiveDays: totalDays,
    };
  }, [activityMap, todayStr]);

  // Generate LeetCode-style 52-week calendar grid ending on today's week
  const { weeks, monthLabels } = useMemo(() => {
    const weeksArr: Array<Array<{ date: string; isFuture: boolean; activity?: DayActivity }>> = [];
    const today = new Date();
    const endDate = new Date(today);
    const dayOfWeek = endDate.getDay(); // 0 (Sun) - 6 (Sat)
    endDate.setDate(endDate.getDate() + (6 - dayOfWeek));

    const weeksCount = 52;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - weeksCount * 7 + 1);

    let currWeek: Array<{ date: string; isFuture: boolean; activity?: DayActivity }> = [];
    const curr = new Date(startDate);

    while (curr <= endDate) {
      const ds = curr.toISOString().split("T")[0];
      currWeek.push({
        date: ds,
        isFuture: curr > today,
        activity: activityMap[ds],
      });

      if (currWeek.length === 7) {
        weeksArr.push(currWeek);
        currWeek = [];
      }
      curr.setDate(curr.getDate() + 1);
    }

    if (currWeek.length > 0) weeksArr.push(currWeek);

    // Month headers
    const labels: Array<{ label: string; colIndex: number }> = [];
    const seenMonths = new Set<string>();
    weeksArr.forEach((w, colIdx) => {
      const firstDay = w[0]?.date;
      if (firstDay) {
        const monthName = new Date(firstDay).toLocaleString("default", { month: "short" });
        if (!seenMonths.has(monthName)) {
          seenMonths.add(monthName);
          labels.push({ label: monthName, colIndex: colIdx });
        }
      }
    });

    return { weeks: weeksArr, monthLabels: labels };
  }, [activityMap]);

  // Style class for each square
  const getCellClassName = (cell: { date: string; isFuture: boolean; activity?: DayActivity }) => {
    if (cell.isFuture) return "heatmap-cell-future";
    const act = cell.activity;
    const isToday = cell.date === todayStr;

    let base = "heatmap-cell ";
    if (act?.completed || (act?.count && act.count > 0)) {
      if (act.count >= 3) base += "heatmap-cell-level-3 ";
      else if (act.count === 2) base += "heatmap-cell-level-2 ";
      else base += "heatmap-cell-level-1 ";
    }
    if (isToday) base += "heatmap-cell-today ";
    return base;
  };

  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  return (
    <div className="flex flex-col gap-8 w-full h-full flex-1">
      {/* ── Page Title & Live Calendar Indicator ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/5 pb-5">
        <div>
          <h1 className="text-3xl font-black text-text tracking-tight">
            Activity Heatmap
          </h1>
          <p className="text-sm font-medium text-text-dim mt-1">
            365-day consistency calendar. Automatically updates with your target completions.
          </p>
        </div>

        {/* Today Calendar Indicator */}
        <div className="flex items-center gap-3">
          <div className="clay px-5 py-2.5 rounded-2xl border border-clay-border flex items-center gap-3 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span className="text-sm font-extrabold text-text uppercase tracking-wider">
              Today: {formattedToday}
            </span>
          </div>
        </div>
      </div>

      {/* ── 1. THE FULLSCREEN HEATMAP SECTION ── */}
      <div className="clay rounded-3xl p-8 border border-clay-border flex flex-col gap-6 shadow-sm w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-text">
            {weeks.length * 7}-Day Calendar Grid
          </h2>
          <span className="text-xs font-bold text-text-dim">
            Click any square to record activity
          </span>
        </div>

        {/* Big Fullscreen LeetCode Calendar Grid */}
        <div className="heatmap-scroll w-full py-2">
          <div className="inline-flex flex-col min-w-full w-full">
            {/* Month Labels */}
            <div className="flex h-6 relative mb-2 pl-10 w-full">
              {monthLabels.map((m, idx) => (
                <span
                  key={idx}
                  className="heatmap-month-label absolute text-xs font-bold text-text-dim"
                  style={{ left: `${40 + m.colIndex * 21}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* Grid Area (Weekdays + Week Columns) */}
            <div className="flex gap-4 w-full">
              {/* Day Labels */}
              <div className="flex flex-col justify-between py-1 text-right pr-2 w-8 select-none">
                <span className="heatmap-day-label text-xs font-bold">Mon</span>
                <span className="heatmap-day-label text-xs font-bold">Wed</span>
                <span className="heatmap-day-label text-xs font-bold">Fri</span>
              </div>

              {/* Heatmap Columns (Bigger 18px squares stretching across full screen width) */}
              <div className="flex gap-1 flex-1 justify-between w-full">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1 flex-1 items-center">
                    {week.map((cell, dIdx) => (
                      <div
                        key={dIdx}
                        onClick={() => handleCellClick(cell.date, cell.isFuture)}
                        title={`${cell.date}: ${
                          cell.activity?.completed
                            ? "Active Day • Completed"
                            : "No activity recorded"
                        }`}
                        className={`w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-[4px] transition-all duration-150 ${getCellClassName(cell)}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="heatmap-legend pt-4 border-t border-black/5 flex items-center justify-end gap-2 text-xs text-text-dim font-semibold">
          <span>Less</span>
          <div className="w-4 h-4 rounded bg-void-2 border border-clay-border" title="0 completed" />
          <div className="w-4 h-4 rounded bg-[#86efac] border border-[#4ade80]" title="1 completed" />
          <div className="w-4 h-4 rounded bg-[#4ade80] border border-[#22c55e]" title="2 completed" />
          <div className="w-4 h-4 rounded bg-[#22c55e] border border-[#16a34a] shadow-[0_0_8px_rgba(34,197,94,0.5)]" title="3+ completed" />
          <span>More</span>
        </div>
      </div>

      {/* ── 2. BELOW THE HEATMAP: THE STREAK COUNTER ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
        {/* Current Streak */}
        <div
          className="rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all border relative overflow-hidden"
          style={{
            background: "rgba(34, 197, 94, 0.08)",
            borderColor: "rgba(34, 197, 94, 0.3)",
            boxShadow:
              "0 4px 16px rgba(34, 197, 94, 0.08), inset 0 2px 2px rgba(255, 255, 255, 0.7)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{
              background: "rgba(34, 197, 94, 0.15)",
              border: "2px solid rgba(34, 197, 94, 0.4)",
              boxShadow: "0 0 16px rgba(34, 197, 94, 0.3)",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
          <span className="text-4xl font-black text-text tracking-tight">
            {currentStreak} Days
          </span>
          <span className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-2">
            Current Streak 🔥
          </span>
          <span className="text-xs font-semibold text-text-dim mt-2">
            Consecutive days of recorded activity
          </span>
        </div>

        {/* Longest Streak */}
        <div
          className="rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all border relative overflow-hidden"
          style={{
            background: "rgba(251, 146, 60, 0.06)",
            borderColor: "rgba(251, 146, 60, 0.25)",
            boxShadow:
              "0 4px 16px rgba(251, 146, 60, 0.06), inset 0 2px 2px rgba(255, 255, 255, 0.7)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{
              background: "rgba(251, 146, 60, 0.15)",
              border: "2px solid rgba(251, 146, 60, 0.35)",
              boxShadow: "0 0 16px rgba(251, 146, 60, 0.25)",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fb923c"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <span className="text-4xl font-black text-text tracking-tight">
            {longestStreak} Days
          </span>
          <span className="text-xs font-black text-orange-500 uppercase tracking-widest mt-2">
            Longest Streak 🏆
          </span>
          <span className="text-xs font-semibold text-text-dim mt-2">
            Your all-time best consistency record
          </span>
        </div>

        {/* Total Active Days */}
        <div
          className="rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all border relative overflow-hidden"
          style={{
            background: "rgba(99, 102, 241, 0.06)",
            borderColor: "rgba(99, 102, 241, 0.25)",
            boxShadow:
              "0 4px 16px rgba(99, 102, 241, 0.06), inset 0 2px 2px rgba(255, 255, 255, 0.7)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{
              background: "rgba(99, 102, 241, 0.15)",
              border: "2px solid rgba(99, 102, 241, 0.35)",
              boxShadow: "0 0 16px rgba(99, 102, 241, 0.25)",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <span className="text-4xl font-black text-text tracking-tight">
            {totalActiveDays} Days
          </span>
          <span className="text-xs font-black text-indigo-600 uppercase tracking-widest mt-2">
            Total Active Days 🗓️
          </span>
          <span className="text-xs font-semibold text-text-dim mt-2">
            Total days recorded on your heatmap
          </span>
        </div>
      </div>
    </div>
  );
}
