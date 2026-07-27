"use client";

import { useState } from "react";
import Link from "next/link";
import { Notebook } from "@/features/study-room/types";

// Mock data until Supabase is hooked up
const MOCK_NOTEBOOKS: Notebook[] = [
  {
    id: "1",
    user_id: "user1",
    title: "Introduction to Machine Learning",
    type: "learn",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: "user1",
    title: "Calculus III Homework",
    type: "solve",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function StudyRoomLibraryPage() {
  const [showNewDialog, setShowNewDialog] = useState(false);

  return (
    <div className="flex flex-col h-full relative">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-text">Study Room</h1>
          <p className="text-text-dim mt-1">
            Your personal library of intelligent notebooks.
          </p>
        </div>
        <button
          onClick={() => setShowNewDialog(true)}
          className="px-6 py-3 bg-accent-base text-[var(--color-void)] font-bold rounded-xl hover:opacity-90 transition-all shadow-sm"
        >
          + New Notebook
        </button>
      </header>

      {/* Library Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_NOTEBOOKS.map((notebook) => (
          <Link
            key={notebook.id}
            href={`/study-room/notebook/${notebook.id}`}
            className="group p-6 rounded-2xl border border-clay-border bg-[var(--input-bg)] hover:bg-[var(--card-hover-bg)] hover:border-[var(--card-hover-border)] transition-all flex flex-col h-48"
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={`px-3 py-1 text-xs font-bold rounded-full ${
                  notebook.type === "learn"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-green-500/10 text-green-600 dark:text-green-400"
                }`}
              >
                {notebook.type.charAt(0).toUpperCase() + notebook.type.slice(1)}
              </div>
            </div>
            <h3 className="text-xl font-bold text-text mb-2 line-clamp-2 group-hover:text-accent-base transition-colors">
              {notebook.title}
            </h3>
            <p className="text-sm text-text-dim mt-auto">
              Updated {new Date(notebook.updated_at).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>

      {/* New Notebook Dialog Modal */}
      {showNewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--clay-bg)] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-clay-border">
            <h2 className="text-2xl font-bold text-text mb-2">
              Create New Notebook
            </h2>
            <p className="text-text-dim mb-6">
              Choose how you want to interact with your study materials.
            </p>

            <div className="flex flex-col gap-4">
              <Link
                href="/study-room/learn/new"
                className="flex items-center gap-4 p-4 rounded-xl border border-clay-border hover:border-accent-base hover:bg-accent-bg transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📚</span>
                </div>
                <div>
                  <h3 className="font-bold text-text">Learn</h3>
                  <p className="text-sm text-text-dim">
                    Upload materials and let the AI guide you through the
                    concepts.
                  </p>
                </div>
              </Link>

              <Link
                href="/study-room/solve/new"
                className="flex items-center gap-4 p-4 rounded-xl border border-clay-border hover:border-green-500/50 hover:bg-green-500/5 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">✍️</span>
                </div>
                <div>
                  <h3 className="font-bold text-text">Solve</h3>
                  <p className="text-sm text-text-dim">
                    Upload problems and get Socratic, hint-based guidance from
                    the AI.
                  </p>
                </div>
              </Link>
            </div>

            <button
              onClick={() => setShowNewDialog(false)}
              className="mt-8 w-full py-3 font-bold text-text-dim hover:text-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
