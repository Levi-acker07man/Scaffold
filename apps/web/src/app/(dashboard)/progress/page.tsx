"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useShop } from "@/shared/context/ShopContext";

interface Task {
  id: string;
  label: string;
  xp: number;
  coins: number;
  done: boolean;
  created_at?: string;
  date?: string;
}

interface DayActivity {
  date: string; // YYYY-MM-DD
  count: number;
  completed: boolean;
}

const formatLocalDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCodingLevelInfo = (lvl: number) => {
  const safeLvl = Math.max(1, lvl);
  return {
    title: "Level",
    roman: safeLvl.toString(),
    fullName: `Level ${safeLvl}`,
  };
};

interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  rarity: "Legendary" | "Epic" | "Rare" | "Common";
  unlocked: boolean;
  unlockedDate: string;
  image: string;
  category: string;
}

interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  rarity: "Legendary" | "Epic" | "Rare" | "Common";
  image: string;
  category: string;
  reqType: "streak" | "total";
  reqValue: number;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "streak-1",
    title: "1-Day Streak",
    description:
      "Awarded for starting your journey with a 1-day coding streak.",
    rarity: "Common",
    image: "/images/badges/1-day-streak.png",
    category: "STREAKS",
    reqType: "streak",
    reqValue: 1,
  },
  {
    id: "streak-30",
    title: "30-Day Streak",
    description:
      "Awarded for keeping an impressive 30-day coding streak alive.",
    rarity: "Rare",
    image: "/images/badges/30-days-streak.png",
    category: "STREAKS",
    reqType: "streak",
    reqValue: 30,
  },
  {
    id: "streak-60",
    title: "60-Day Streak",
    description:
      "Awarded for maintaining a relentless 60-day coding streak.",
    rarity: "Epic",
    image: "/images/badges/60-days-streak.png",
    category: "STREAKS",
    reqType: "streak",
    reqValue: 60,
  },
  {
    id: "streak-90",
    title: "90-Day Streak",
    description:
      "Awarded for an elite 90-day streak of daily problem solving.",
    rarity: "Epic",
    image: "/images/badges/90-days-streak.png",
    category: "STREAKS",
    reqType: "streak",
    reqValue: 90,
  },
  {
    id: "streak-150",
    title: "150-Day Streak",
    description:
      "Awarded for achieving a legendary 150-day uninterrupted streak.",
    rarity: "Legendary",
    image: "/images/badges/150-days-streak.png",
    category: "STREAKS",
    reqType: "streak",
    reqValue: 150,
  },
  {
    id: "streak-210",
    title: "210-Day Streak",
    description:
      "Awarded for a titanic 210-day streak of pure dedication.",
    rarity: "Legendary",
    image: "/images/badges/210-days-streak.png",
    category: "STREAKS",
    reqType: "streak",
    reqValue: 210,
  },
  {
    id: "total-50",
    title: "50 Days Total Active",
    description:
      "Awarded for accumulating 50 total days of active coding.",
    rarity: "Rare",
    image: "/images/badges/50-days-total.png",
    category: "MILESTONE",
    reqType: "total",
    reqValue: 50,
  },
  {
    id: "total-100",
    title: "100 Days Total Active",
    description:
      "Awarded for reaching the 100-day active coding milestone.",
    rarity: "Epic",
    image: "/images/badges/100-days-total.png",
    category: "MILESTONE",
    reqType: "total",
    reqValue: 100,
  },
  {
    id: "total-200",
    title: "200 Days Total Active",
    description:
      "Awarded for dedicating 200 total days to your programming mastery.",
    rarity: "Legendary",
    image: "/images/badges/200-days-total.png",
    category: "MILESTONE",
    reqType: "total",
    reqValue: 200,
  },
  {
    id: "total-300",
    title: "300 Days Total Active",
    description:
      "Awarded for an awe-inspiring 300 total days of active coding.",
    rarity: "Legendary",
    image: "/images/badges/300-days-total.png",
    category: "MILESTONE",
    reqType: "total",
    reqValue: 300,
  },
];

export default function HeatmapPage() {
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(
    null
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityMap, setActivityMap] = useState<Record<string, DayActivity>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const supabase = useMemo(() => createClient(), []);
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  const shop = useShop();
  const xp = shop?.xp ?? 170309;
  const level = shop?.level ?? 11;
  const currentLevelXp = shop?.currentLevelXp ?? 6779;
  const xpNeeded = shop?.xpNeeded ?? 10000;
  const coins = shop?.coins ?? 1200;

  const currLevelInfo = useMemo(() => getCodingLevelInfo(level), [level]);
  const nextLevelInfo = useMemo(() => getCodingLevelInfo(level + 1), [level]);

  // Fetch real tasks and real heatmap activity on mount or event
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    let mergedMap: Record<string, DayActivity> = {};

    // 1. Load from v2 localStorage (both default and user-specific keys)
    try {
      const defaultLocal = localStorage.getItem("scaffold_heatmap_v2_default");
      if (defaultLocal) {
        mergedMap = { ...mergedMap, ...JSON.parse(defaultLocal) };
      }
      if (session?.user?.id) {
        const userLocal = localStorage.getItem(`scaffold_heatmap_v2_${session.user.id}`);
        if (userLocal) {
          mergedMap = { ...mergedMap, ...JSON.parse(userLocal) };
        }
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
    }

    // 3. Fetch user tasks from Supabase database or fallback to localStorage
    let allTasks: Task[] = [];
    try {
      const localTasksStr = localStorage.getItem("scaffold_user_tasks");
      if (localTasksStr) {
        allTasks = JSON.parse(localTasksStr);
      }
    } catch (e) { }

    if (session?.user?.id) {
      const { data: dbTasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true });

      if (dbTasks && dbTasks.length > 0) {
        allTasks = dbTasks;
      }
    }

    setTasks(allTasks);

    // Filter ONLY today's tasks for today's completion status
    const todayTasks = allTasks.filter((t) => !t.date || t.date === todayStr);
    const allDone = todayTasks.length > 0 && todayTasks.every((t) => t.done);
    const doneCount = todayTasks.filter((t) => t.done).length;

    if (allDone) {
      mergedMap[todayStr] = {
        date: todayStr,
        count: Math.max(doneCount, 3),
        completed: true,
      };
    } else {
      delete mergedMap[todayStr];
    }

    // Persist updated map to localStorage
    try {
      localStorage.setItem("scaffold_heatmap_v2_default", JSON.stringify(mergedMap));
      if (session?.user?.id) {
        localStorage.setItem(`scaffold_heatmap_v2_${session.user.id}`, JSON.stringify(mergedMap));
      }
    } catch (e) { }

    setActivityMap(mergedMap);
    setLoading(false);
  }, [supabase, todayStr]);

  useEffect(() => {
    fetchAllData();

    const handleUpdate = () => {
      fetchAllData();
    };
    window.addEventListener("focus", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("scaffold_heatmap_updated", handleUpdate);

    return () => {
      window.removeEventListener("focus", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("scaffold_heatmap_updated", handleUpdate);
    };
  }, [fetchAllData]);

  // Calculate Streak Counters strictly from real activity (ZERO random numbers)
  const { currentStreak, longestStreak, totalActiveDays } = useMemo(() => {
    let current = 0;
    let longest = 0;
    let temp = 0;

    const now = new Date();
    let checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let dateStr = formatLocalDate(checkDate);

    // Count backwards for active streak
    if (activityMap[dateStr]?.completed) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
      dateStr = formatLocalDate(checkDate);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      dateStr = formatLocalDate(checkDate);
    }

    while (activityMap[dateStr]?.completed) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
      dateStr = formatLocalDate(checkDate);
    }

    // Longest streak across all real active dates
    const activeDates = Object.keys(activityMap)
      .filter((d) => activityMap[d]?.completed)
      .sort();

    if (activeDates.length > 0) {
      temp = 1;
      longest = 1;
      for (let i = 1; i < activeDates.length; i++) {
        const prev = new Date(activeDates[i - 1] + "T00:00:00");
        const curr = new Date(activeDates[i] + "T00:00:00");
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          temp++;
          if (temp > longest) longest = temp;
        } else if (diffDays > 1) {
          temp = 1;
        }
      }
    }

    const totalDays = Object.values(activityMap).filter((d) => d && (d.completed || (d.count && d.count > 0))).length;

    return {
      currentStreak: Math.max(current, activityMap[todayStr]?.completed ? 1 : 0),
      longestStreak: Math.max(longest, current),
      totalActiveDays: totalDays,
    };
  }, [activityMap, todayStr]);

  // Dynamically calculate which badges the user has unlocked based on their real stats
  const unlockedBadges = useMemo(() => {
    return BADGE_DEFINITIONS.filter((b) => {
      if (b.reqType === "streak") {
        return longestStreak >= b.reqValue || currentStreak >= b.reqValue;
      } else if (b.reqType === "total") {
        return totalActiveDays >= b.reqValue;
      }
      return false;
    }).map((b) => ({
      ...b,
      unlocked: true,
      unlockedDate: "Earned",
    }));
  }, [currentStreak, longestStreak, totalActiveDays]);

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
      const ds = formatLocalDate(curr);
      currWeek.push({
        date: ds,
        isFuture: ds > todayStr,
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
        const monthName = new Date(firstDay + "T00:00:00").toLocaleString("default", { month: "short" });
        if (!seenMonths.has(monthName)) {
          seenMonths.add(monthName);
          labels.push({ label: monthName, colIndex: colIdx });
        }
      }
    });

    return { weeks: weeksArr, monthLabels: labels };
  }, [activityMap, todayStr]);

  // Style class for each square
  const getCellClassName = (cell: { date: string; isFuture: boolean; activity?: DayActivity }) => {
    if (cell.isFuture) return "heatmap-cell-future";
    const act = cell.activity;
    const isToday = cell.date === todayStr;

    let base = "heatmap-cell ";
    if (act?.completed || (act?.count && act.count > 0)) {
      const count = act?.count || 3;
      if (count >= 3) base += "heatmap-cell-level-3 ";
      else if (count === 2) base += "heatmap-cell-level-2 ";
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

  if (!isMounted) {
    return <div className="w-full h-full flex items-center justify-center text-text-dim">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full pb-20 sm:pb-28">
      {/* ── Page Title & Live Calendar Indicator ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-black/5 dark:border-white/10 pb-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight">
            Activity Heatmap
          </h1>
        </div>
      </div>

      {/* ── 1. THE FULLSCREEN HEATMAP SECTION ── */}
      <div className="clay rounded-3xl p-5 sm:p-6 pb-6 border border-clay-border flex flex-col gap-4 shadow-sm w-full">

        {/* Full Year Activity Calendar Grid (Stretches across full width, big cells, never chopped) */}
        <div className="w-full py-1">
          <div className="flex flex-col w-full">
            {/* Month Labels (Percentage Positioning across full width) */}
            <div className="flex h-5 relative mb-1.5 pl-9 w-full">
              {monthLabels.map((m, idx) => (
                <span
                  key={idx}
                  className="heatmap-month-label absolute text-xs font-bold text-text-dim"
                  style={{
                    left: `${(m.colIndex / Math.max(1, weeks.length - 1)) * 95}%`,
                  }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* Grid Area (Weekdays + 52 Week Columns expanding across entire card width) */}
            <div className="flex gap-2 sm:gap-2.5 w-full items-stretch">
              {/* Day Labels - 7-row grid exactly matching the 7 rows of the heatmap */}
              <div className="grid grid-rows-7 gap-1 sm:gap-1.5 text-right pr-2 select-none shrink-0 w-8">
                <div />
                <div className="flex items-center justify-end"><span className="heatmap-day-label text-xs font-bold text-text-dim leading-none">Mon</span></div>
                <div />
                <div className="flex items-center justify-end"><span className="heatmap-day-label text-xs font-bold text-text-dim leading-none">Wed</span></div>
                <div />
                <div className="flex items-center justify-end"><span className="heatmap-day-label text-xs font-bold text-text-dim leading-none">Fri</span></div>
                <div />
              </div>

              {/* Heatmap Columns (flex-1 justify-between w-full stretches across entire card width to the end big) */}
              <div className="flex gap-1 sm:gap-1.5 flex-1 justify-between w-full min-w-0">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-rows-7 gap-1 sm:gap-1.5 flex-1 min-w-0">
                    {week.map((cell, dIdx) => (
                      <div
                        key={dIdx}
                        title={`${cell.date}: ${cell.activity?.completed
                          ? "Active Day • Completed"
                          : "No activity recorded"
                          }`}
                        className={`w-full aspect-square max-w-[22px] min-w-[7px] rounded-[3px] sm:rounded-md transition-all duration-150 ${getCellClassName(cell)}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="heatmap-legend pt-3 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-end gap-2 text-xs text-text-dim font-semibold">
          <span>Less</span>
          <div className="w-4 h-4 rounded bg-void-2 border border-clay-border" title="0 completed" />
          <div className="w-4 h-4 rounded bg-[#86efac] border border-[#4ade80]" title="1 completed" />
          <div className="w-4 h-4 rounded bg-[#4ade80] border border-[#22c55e]" title="2 completed" />
          <div className="w-4 h-4 rounded bg-[#22c55e] border border-[#16a34a] shadow-[0_0_8px_rgba(34,197,94,0.5)]" title="3+ completed" />
          <span>More</span>
        </div>
      </div>

      {/* ── 2. COMPACT STREAK COUNTERS (Small, Highly Visible & Low Vertical Size) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        {/* Current Streak */}
        <div className="rounded-2xl py-2.5 px-4 flex items-center justify-between gap-3 border border-clay-border bg-white dark:bg-panel shadow-sm hover:shadow transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
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
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
            </div>
            <div>
              <span className="block text-[10px] font-black text-text-dim uppercase tracking-wider">
                Current Streak
              </span>
              <span className="block text-[11px] font-semibold text-text-dim/70">
                Consecutive days
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-1 text-right">
            <span className="text-xl sm:text-2xl font-black text-text tracking-tight">
              {currentStreak}
            </span>
            <span className="text-[10px] font-extrabold text-text-dim uppercase">
              Days
            </span>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="rounded-2xl py-2.5 px-4 flex items-center justify-between gap-3 border border-clay-border bg-white dark:bg-panel shadow-sm hover:shadow transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/20 shrink-0">
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
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div>
              <span className="block text-[10px] font-black text-text-dim uppercase tracking-wider">
                Longest Streak
              </span>
              <span className="block text-[11px] font-semibold text-text-dim/70">
                All-time record
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-1 text-right">
            <span className="text-xl sm:text-2xl font-black text-text tracking-tight">
              {longestStreak}
            </span>
            <span className="text-[10px] font-extrabold text-text-dim uppercase">
              Days
            </span>
          </div>
        </div>

        {/* Total Active Days */}
        <div className="rounded-2xl py-2.5 px-4 flex items-center justify-between gap-3 border border-clay-border bg-white dark:bg-panel shadow-sm hover:shadow transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <span className="block text-[10px] font-black text-text-dim uppercase tracking-wider">
                Total Active
              </span>
              <span className="block text-[11px] font-semibold text-text-dim/70">
                Recorded days
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-1 text-right">
            <span className="text-xl sm:text-2xl font-black text-text tracking-tight">
              {totalActiveDays}
            </span>
            <span className="text-[10px] font-extrabold text-text-dim uppercase">
              Days
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. LEVEL & XP POWER COUNTER ("The Whole Counter Thing Box") ── */}
      <div className="clay rounded-3xl border border-clay-border p-6 sm:p-10 py-8 sm:py-12 shadow-sm flex flex-col gap-8 sm:gap-10 relative w-full">
        {/* Top Header: Coding Rank Badge + Power Level Total */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-black/5 dark:border-white/10 pb-6 sm:pb-8">
          {/* Left: Coding Level Badge */}
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 shadow-sm">
              <span className="text-xl sm:text-2xl font-black tracking-wide text-text font-mono lowercase">
                {currLevelInfo.title}
              </span>
              <span className="bg-black dark:bg-white text-white dark:text-black text-xs sm:text-sm font-black px-2.5 py-0.5 rounded uppercase tracking-wider shadow">
                {currLevelInfo.roman}
              </span>
            </div>
          </div>

          {/* Right: Total XP badge inside whole box */}
          <div className="flex items-center gap-3 self-start sm:self-auto bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-5 py-3">
            <span className="text-amber-500 font-black text-lg sm:text-xl">⚡</span>
            <div className="flex flex-col text-right">
              <span className="text-base sm:text-lg font-black text-text font-mono">
                {xp.toLocaleString()} TOTAL XP
              </span>
              <span className="text-xs sm:text-sm text-text-dim font-mono font-medium">
                Lifetime earned
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Level Badges above Bar + Straight Line Tube Bar + XP Statistics */}
        <div className="flex flex-col gap-3 relative z-10">
          {/* Starting part of the bar counter just above inside the whole counter box - level pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm sm:text-base font-mono font-bold">
            {/* Left Pill: Current Status (Without duplicating level title text) */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>CURRENT PROGRESS</span>
            </div>

            {/* Right Pill: Next Level */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-text-dim">
              <span>Next: {nextLevelInfo.fullName}</span>
              <span className="font-sans font-bold">&rarr;</span>
            </div>
          </div>

          {/* Straight line tube getting filled with xp */}
          <div className="h-5 sm:h-6 w-full bg-black/15 dark:bg-black/40 rounded-full overflow-hidden p-1 border border-black/10 dark:border-white/10 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-sm relative overflow-hidden"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, (currentLevelXp / Math.max(1, xpNeeded)) * 100)
                )}%`,
              }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse opacity-40" />
            </div>
          </div>

          {/* In the end area of that bar just below - Total XP / Required XP */}
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono pt-3 pb-1">
            <div className="text-base sm:text-lg font-black text-text">
              <span>
                {currentLevelXp.toLocaleString()}
              </span>
              <span className="text-text-dim font-bold">
                {" "}
                / {xpNeeded.toLocaleString()} XP
              </span>
            </div>
            <div className="text-sm sm:text-base font-bold text-text-dim sm:text-right">
              {Math.max(0, xpNeeded - currentLevelXp).toLocaleString()} XP to{" "}
              {nextLevelInfo.fullName}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. ACHIEVEMENTS & UNLOCKED BADGES AREA ── */}
      <div
        id="achievements-section"
        className="clay rounded-3xl border border-clay-border p-6 sm:p-8 shadow-sm flex flex-col gap-6 relative w-full mt-2 sm:mt-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 dark:border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-text">
                Achievements
              </span>
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-500/20 font-mono">
                {unlockedBadges.length} Unlocked
              </span>
            </div>
          </div>
        </div>

        {/* Unlocked Badges Grid */}
        {unlockedBadges.length === 0 ? (
          <div className="rounded-2xl border border-clay-border bg-black/5 dark:bg-white/5 p-8 text-center text-text-dim text-sm font-mono">
            No badges unlocked yet. Keep coding daily to unlock your first streak or milestone badge!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 w-full">
            {unlockedBadges.map((badge) => (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className="rounded-2xl border border-clay-border bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 p-5 flex flex-col items-center justify-between text-center gap-3 cursor-pointer hover:scale-[1.03] hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
              >
                {/* Subtle green top indicator */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                {/* Badge 3D Image with Extruded Shadow */}
                <div className="relative my-2">
                  <img
                    src={badge.image}
                    alt={badge.title}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                    style={{
                      filter:
                        "drop-shadow(0 10px 10px rgba(0,0,0,0.3)) drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                    }}
                  />
                </div>

                {/* Title */}
                <h3 className="text-sm font-black text-text font-mono leading-snug">
                  {badge.title}
                </h3>

                {/* Rarity & Unlocked Pill */}
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                  {badge.rarity}
                </span>

                {/* Click hint */}
                <span className="text-[10px] text-text-dim font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  ✦ Click 3D View
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 5. FULL-SCREEN 3D STARRY NIGHT BADGE MODAL ── */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-[#06040d] overflow-hidden select-none animate-in fade-in duration-300"
          onClick={() => setSelectedBadge(null)}
        >
          {/* Starry Night Sky Background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-[#0a0618] to-[#040208] pointer-events-none" />

          {/* Cosmic Nebula Glows */}
          <div className="absolute -top-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse pointer-events-none" />

          {/* Twinkling Starfield */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(60)].map((_, i) => {
              const size = (i % 3) + 1;
              const top = (i * 17) % 100;
              const left = (i * 29) % 100;
              const delay = (i % 5) * 0.7;
              return (
                <div
                  key={i}
                  className="absolute rounded-full bg-white animate-pulse"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    top: `${top}%`,
                    left: `${left}%`,
                    opacity: 0.3 + (i % 7) * 0.1,
                    animationDelay: `${delay}s`,
                    animationDuration: `${1.5 + (i % 4)}s`,
                  }}
                />
              );
            })}
          </div>

          {/* Keyframe Style for 3D Continuous Extruded Rotation */}
          <style jsx>{`
            @keyframes rotate3dBadge {
              0% {
                transform: rotateY(0deg) rotateX(10deg);
              }
              50% {
                transform: rotateY(180deg) rotateX(-10deg);
              }
              100% {
                transform: rotateY(360deg) rotateX(10deg);
              }
            }
            .badge-3d-rotate {
              transform-style: preserve-3d;
              animation: rotate3dBadge 6s linear infinite;
            }
            .badge-3d-layer {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              object-fit: contain;
              pointer-events: none;
            }
          `}</style>

          {/* Close Header Button */}
          <button
            onClick={() => setSelectedBadge(null)}
            className="absolute top-6 right-6 z-20 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>✕ Close</span>
          </button>

          {/* Center Content Modal Card */}
          <div
            className="relative z-10 flex flex-col items-center justify-center max-w-xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 3D Extruded Rotating Badge Container */}
            <div
              className="relative w-64 h-64 sm:w-72 sm:h-72 my-4 flex items-center justify-center"
              style={{ perspective: "1200px" }}
            >
              <div className="relative w-full h-full badge-3d-rotate flex items-center justify-center">
                {/* Extruded Z-Axis Back Layers for physical geometric depth */}
                {[14, 12, 10, 8, 6, 4, 2].map((depth) => (
                  <img
                    key={depth}
                    src={selectedBadge.image}
                    alt=""
                    className="badge-3d-layer brightness-[0.3]"
                    style={{
                      transform: `translateZ(${-depth}px)`,
                      filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.8))",
                    }}
                  />
                ))}

                {/* Main Front Layer */}
                <img
                  src={selectedBadge.image}
                  alt={selectedBadge.title}
                  className="w-full h-full object-contain relative z-10"
                  style={{
                    transform: "translateZ(0px)",
                    filter:
                      "drop-shadow(0 15px 25px rgba(0,0,0,0.8)) drop-shadow(0 0 20px rgba(34,197,94,0.3))",
                  }}
                />
              </div>
            </div>

            {/* Glowing Title */}
            <h2 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight mt-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              {selectedBadge.title}
            </h2>

            {/* Clean Rarity Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-widest mt-3 shadow-[0_0_15px_rgba(34,197,94,0.3)] font-mono">
              <span>✦ {selectedBadge.rarity} ✦</span>
            </div>

            {/* Description Text */}
            <p className="max-w-md text-sm sm:text-base text-gray-300 font-medium leading-relaxed mt-4 px-4">
              {selectedBadge.description}
            </p>


          </div>
        </div>
      )}
    </div>
  );
}
/* Next.js heatmap page HMR trigger */
