"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getNotebooks, deleteNotebook } from "@/features/study-room/lib/notebookStore";
import { StoredNotebook } from "@/features/study-room/types";

export default function StudyRoomLibraryPage() {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [notebooks, setNotebooks] = useState<StoredNotebook[]>([]);

  const loadNotebooks = () => {
    const loaded = getNotebooks();
    loaded.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    setNotebooks(loaded);
  };

  useEffect(() => {
    loadNotebooks();
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this notebook?")) {
      deleteNotebook(id);
      loadNotebooks();
    }
  };

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
      {notebooks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="w-24 h-24 mb-6 text-6xl">📚</div>
          <h2 className="text-2xl font-bold text-text mb-2">Your library is empty</h2>
          <p className="text-text-dim mb-6">
            Create your first notebook to start learning or solving problems with your AI tutor.
          </p>
          <button
            onClick={() => setShowNewDialog(true)}
            className="px-6 py-3 bg-accent-bg text-accent-base font-bold rounded-xl hover:bg-[var(--accent-hover-bg)] border border-accent-border transition-colors shadow-sm"
          >
            Create Notebook
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notebooks.map((notebook) => (
            <Link
              key={notebook.id}
              href={`/study-room/notebook/${notebook.id}`}
              className="group relative p-6 rounded-2xl border border-clay-border bg-[var(--input-bg)] hover:bg-[var(--card-hover-bg)] hover:border-[var(--card-hover-border)] transition-all flex flex-col h-48"
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
                <div className="text-xs font-bold text-text-dim px-2 py-1 bg-[var(--clay-bg)] rounded-full">
                  {notebook.messages.length} msgs
                </div>
              </div>
              <h3 className="text-xl font-bold text-text mb-2 line-clamp-2 group-hover:text-accent-base transition-colors pr-8">
                {notebook.title}
              </h3>
              <p className="text-sm text-text-dim mt-auto">
                Updated {new Date(notebook.updated_at).toLocaleDateString()}
              </p>
              
              <button
                onClick={(e) => handleDelete(e, notebook.id)}
                className="absolute right-4 top-[50%] -translate-y-[50%] opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                title="Delete Notebook"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </Link>
          ))}
        </div>
      )}

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
