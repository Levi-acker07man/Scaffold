"use client";

import React, { useState, useEffect } from "react";

export function FocusTimerWidget() {
  const [timerSeconds, setTimerSeconds] = useState<number>(1800); // 30m default
  const [initialSeconds, setInitialSeconds] = useState<number>(1800);
  const [timerStep, setTimerStep] = useState<number>(1800);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerCompleted, setTimerCompleted] = useState<boolean>(false);

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

  const formatTimerTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
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
          </div>
        </div>
      </div>

      {/* Compact Digital Timer Display */}
      <div className="flex flex-col items-center justify-center py-3 px-4 rounded-2xl bg-input-bg border border-clay-border relative overflow-hidden">
        {timerCompleted || isRunning ? (
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-text-dimmer mb-0.5">
            {timerCompleted ? "Session Completed! 🎉" : "Session in Progress"}
          </span>
        ) : null}
        <div className="flex items-center w-full px-2 my-1">
          <div className="flex-1" />
          <div className="text-5xl font-black tracking-tight text-text font-mono shrink-0">
            {formatTimerTime(timerSeconds)}
          </div>
          <div className="flex-1 flex flex-col items-end gap-1">
            <button
              onClick={() => {
                const next = Math.min(18000, timerSeconds + timerStep);
                const diff = next - timerSeconds;
                setTimerSeconds(next);
                setInitialSeconds(Math.min(18000, initialSeconds + diff));
              }}
              className="p-1.5 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-text-dim hover:text-text transition-colors transform hover:scale-105 active:scale-95"
              title="Increase timer"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </button>
            <button
              onClick={() => {
                const next = Math.max(60, timerSeconds - timerStep);
                const diff = timerSeconds - next;
                setTimerSeconds(next);
                setInitialSeconds(Math.max(60, initialSeconds - diff));
              }}
              className="p-1.5 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-text-dim hover:text-text transition-colors transform hover:scale-105 active:scale-95"
              title="Decrease timer"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          </div>
        </div>

        {/* Time Adjustment Presets */}
        <div className="flex items-center gap-2 flex-wrap justify-center mt-3">
          {[
            { label: "30m", secs: 1800 },
            { label: "60m", secs: 3600 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setIsRunning(false);
                setTimerCompleted(false);
                setTimerSeconds(preset.secs);
                setInitialSeconds(preset.secs);
                setTimerStep(preset.secs);
              }}
              className={`px-2 py-0.5 rounded-lg text-xs font-extrabold border transition-all ${
                initialSeconds === preset.secs && !timerCompleted
                  ? "bg-accent-base text-void border-accent-base shadow-xs"
                  : "bg-white dark:bg-panel text-text border-clay-border hover:border-gray-400"
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
            className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-white dark:bg-panel text-text border border-clay-border hover:border-gray-400"
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
            className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-white dark:bg-panel text-text border border-clay-border hover:border-gray-400"
            title="Add 1 minute"
          >
            +1m
          </button>
        </div>
      </div>

      {/* Completion Alert */}
      {timerCompleted && (
        <div className="mt-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-between">
          <span>🎉 Time's up! Great session.</span>
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
            <polyline points="1 4 1 10 7 10"></polyline>
            <polyline points="23 20 23 14 17 14"></polyline>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
          </svg>
        </button>
      </div>
    </section>
  );
}
