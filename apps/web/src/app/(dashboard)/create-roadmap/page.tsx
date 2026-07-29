"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { roadmapStore, Roadmap } from "@/features/roadmap/lib/roadmapStore";
import Link from "next/link";

export default function CreateRoadmapPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [timeframe, setTimeframe] = useState("1 month");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [savedRoadmaps, setSavedRoadmaps] = useState<Roadmap[]>([]);

  useEffect(() => {
    setSavedRoadmaps(roadmapStore.getRoadmaps());
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    
    setIsGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, level, timeframe }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate roadmap.");
      }

      const data = await res.json();
      if (data.error) {
         throw new Error(data.error);
      }
      
      const newRoadmap: Roadmap = {
        id: `rm_${Date.now()}`,
        topic,
        level,
        timeframe,
        milestones: data.milestones || [],
        createdAt: new Date().toISOString()
      };

      roadmapStore.saveRoadmap(newRoadmap);
      router.push(`/roadmap/${newRoadmap.id}`);

    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <header className={`flex justify-between items-center shrink-0 absolute top-0 left-0 right-0 z-10`}>
        <div>
          <h1 className="text-3xl font-extrabold text-text">Create Roadmap</h1>
          <p className="text-text-dim mt-1">
            Plan your learning journey with an AI-generated study roadmap.
          </p>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto h-full absolute inset-0 pt-20">
        
        {savedRoadmaps.length > 0 && (
          <div className="w-full mb-8">
            <h2 className="text-sm font-bold text-text-dim mb-3 uppercase tracking-wider">Your Recent Roadmaps</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {savedRoadmaps.slice(0, 3).map((r) => (
                <Link key={r.id} href={`/roadmap/${r.id}`} className="shrink-0 bg-[var(--clay-bg)] border border-clay-border p-3 rounded-xl hover:border-accent-base transition-colors flex flex-col gap-1 w-48">
                  <span className="font-bold text-text truncate">{r.topic}</span>
                  <span className="text-xs text-text-dim">{r.level} • {r.timeframe}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleGenerate} className="w-full bg-[var(--clay-bg)] p-8 rounded-3xl border border-clay-border shadow-sm flex flex-col gap-5">
          <div>
            <label className="block text-sm font-bold text-text mb-2">What do you want to learn?</label>
            <input
              type="text"
              placeholder="e.g. Master React JS, Learn Calculus III..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="w-full bg-input-bg text-text border-2 border-clay-border hover:border-accent-border/80 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-base transition-all"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-text mb-2">Current Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-input-bg text-text border-2 border-clay-border hover:border-accent-border/80 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-base transition-all"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-text mb-2">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full bg-input-bg text-text border-2 border-clay-border hover:border-accent-border/80 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-base transition-all"
              >
                <option>1 week</option>
                <option>1 month</option>
                <option>3 months</option>
                <option>6 months</option>
              </select>
            </div>
          </div>

          {error && <div className="text-red-500 text-sm font-bold mt-2">{error}</div>}

          <button
            type="submit"
            disabled={!topic || isGenerating}
            className="mt-4 w-full py-4 bg-accent-base text-[var(--color-void)] font-extrabold rounded-xl hover:opacity-90 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5 text-[var(--color-void)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : "Generate Roadmap"}
          </button>
        </form>
      </div>
    </div>
  );
}
