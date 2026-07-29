"use client";

import { useEffect, useState } from "react";
import { roadmapStore, Roadmap, Milestone } from "@/features/roadmap/lib/roadmapStore";
import Link from "next/link";
import { ArrowLeft, BookOpen, Search, CheckCircle2, CheckCircle } from "lucide-react";

export default function TopicDetailPage({ params }: { params: { id: string, nodeId: string } }) {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    const data = roadmapStore.getRoadmap(params.id);
    if (data) {
      setRoadmap(data);
      const m = data.milestones.find((m) => m.id === params.nodeId);
      if (m) {
        setMilestone(m);
        // Check if already in tasks
        try {
          const tasks = JSON.parse(localStorage.getItem("scaffold_user_tasks") || "[]");
          const exists = tasks.some((t: any) => t.id === `rm_${m.id}`);
          setIsAdded(exists);
        } catch (e) {}

        if (!m.resources) {
          generateResources(data.topic, m);
        }
      }
    }
  }, [params.id, params.nodeId]);

  const generateResources = async (mainTopic: string, m: Milestone) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/roadmap/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mainTopic, 
          nodeTitle: m.label,
          nodeDescription: m.description
        }),
      });

      if (!res.ok) throw new Error("Failed to generate resources.");
      const data = await res.json();
      
      roadmapStore.saveTopicResources(params.id, m.id, data);
      
      // Update local state to reflect new resources
      setMilestone((prev) => prev ? { ...prev, resources: data } : null);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToTasks = () => {
    if (!milestone) return;
    try {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      
      const newTask = {
        id: `rm_${milestone.id}`,
        label: `${milestone.label}: ${milestone.description}`,
        xp: 15,
        coins: 15,
        done: false,
        date: todayStr,
      };

      const tasks = JSON.parse(localStorage.getItem("scaffold_user_tasks") || "[]");
      tasks.push(newTask);
      localStorage.setItem("scaffold_user_tasks", JSON.stringify(tasks));
      setIsAdded(true);
    } catch (err) {
      console.error("Failed to add task", err);
    }
  };

  if (!roadmap || !milestone) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-dim">Loading topic details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/roadmap/${roadmap.id}`} className="p-2 hover:bg-[var(--clay-bg)] rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-dim" />
            </Link>
            <h1 className="text-3xl font-extrabold text-text">{milestone.label}</h1>
          </div>
          <p className="text-text-dim ml-11">
            Part of: {roadmap.topic}
          </p>
        </div>
        
        <button 
          onClick={handleAddToTasks}
          disabled={isAdded}
          className={`px-6 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 ${
            isAdded 
              ? "bg-green-500/10 text-green-600 border border-green-500/20 cursor-not-allowed" 
              : "bg-accent-base text-[var(--color-void)] hover:-translate-y-1 hover:shadow-lg"
          }`}
        >
          {isAdded ? (
            <><CheckCircle2 className="w-5 h-5" /> Added to Today's Tasks</>
          ) : (
            <>+ Schedule for Today</>
          )}
        </button>
      </header>

      <div className="flex-1 w-full overflow-y-auto pb-12">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          
          <div className="bg-[var(--clay-bg)] border border-clay-border rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-extrabold text-text mb-4">Milestone Overview</h2>
            <p className="text-text-dim leading-relaxed">{milestone.description}</p>
          </div>

          {isLoading && (
            <div className="bg-[var(--clay-bg)] border border-clay-border rounded-3xl p-12 shadow-sm flex flex-col items-center justify-center gap-4">
               <svg className="animate-spin h-8 w-8 text-accent-base" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-text font-bold">Generating personalized study resources...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-red-500 font-bold">
              {error}
            </div>
          )}

          {milestone.resources && !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-[var(--clay-bg)] border border-clay-border rounded-3xl p-8 shadow-sm md:col-span-2">
                <div className="flex items-center gap-3 mb-4 text-accent-base">
                  <BookOpen className="w-6 h-6" />
                  <h2 className="text-xl font-extrabold text-text">In-Depth Summary</h2>
                </div>
                <p className="text-text-dim leading-relaxed whitespace-pre-wrap">
                  {milestone.resources.summary}
                </p>
              </div>

              <div className="bg-[var(--clay-bg)] border border-clay-border rounded-3xl p-8 shadow-sm">
                <h2 className="text-xl font-extrabold text-text mb-4">Key Concepts</h2>
                <ul className="flex flex-col gap-3">
                  {milestone.resources.keyConcepts.map((concept, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-accent-base shrink-0 mt-0.5" />
                      <span className="text-text-dim">{concept}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-6">
                <div className="bg-[var(--clay-bg)] border border-clay-border rounded-3xl p-8 shadow-sm flex-1">
                  <h2 className="text-xl font-extrabold text-text mb-4">Practice Exercise</h2>
                  <p className="text-text-dim leading-relaxed bg-input-bg p-4 rounded-xl border border-clay-border">
                    {milestone.resources.practiceExercise}
                  </p>
                </div>

                <div className="bg-[var(--clay-bg)] border border-clay-border rounded-3xl p-8 shadow-sm flex-1">
                  <div className="flex items-center gap-3 mb-4 text-accent-base">
                    <Search className="w-6 h-6" />
                    <h2 className="text-xl font-extrabold text-text">Recommended Searches</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {milestone.resources.searchTerms.map((term, i) => (
                      <span key={i} className="bg-input-bg text-text-dim px-3 py-1.5 rounded-lg border border-clay-border text-sm">
                        "{term}"
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
