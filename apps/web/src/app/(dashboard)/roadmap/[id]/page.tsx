"use client";

import { useEffect, useState } from "react";
import { roadmapStore, Roadmap, Milestone } from "@/features/roadmap/lib/roadmapStore";
import { createNotebook, addMessage } from "@/features/study-room/lib/notebookStore";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RoadmapMapPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);

  useEffect(() => {
    const data = roadmapStore.getRoadmap(params.id);
    if (data) setRoadmap(data);
  }, [params.id]);

  const handleLearn = (milestone: Milestone) => {
    if (!roadmap) return;
    
    // Create a new notebook
    const context = `Roadmap Topic: ${roadmap.topic}\nMilestone: ${milestone.label}\nDescription: ${milestone.description}\nThe user wants to learn this topic step-by-step.`;
    const notebook = createNotebook('learn', milestone.label, context);
    
    // Inject the first user message so the AI starts teaching immediately
    addMessage(notebook.id, {
      id: Math.random().toString(36).substring(2, 15),
      notebook_id: notebook.id,
      role: 'user',
      content: `I am ready to learn about ${milestone.label}. Please start teaching me this topic step-by-step.`,
      created_at: new Date().toISOString()
    });

    // Navigate to the new study room
    router.push(`/study-room/learn/${notebook.id}`);
  };

  if (!roadmap) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-dim">Loading map or roadmap not found...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/create-roadmap" className="p-2 hover:bg-[var(--clay-bg)] rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-dim" />
            </Link>
            <h1 className="text-3xl font-extrabold text-text">{roadmap.topic}</h1>
          </div>
          <p className="text-text-dim ml-11">
            Level: {roadmap.level} • Timeframe: {roadmap.timeframe}
          </p>
        </div>
      </header>

      <div className="flex-1 w-full bg-[var(--input-bg)] border border-clay-border rounded-3xl p-8 overflow-y-auto shadow-inner">
        <div className="max-w-4xl mx-auto relative pb-12 pt-8">
          {/* Continuous vertical line */}
          <div className="absolute left-8 md:left-1/2 top-8 bottom-0 w-1 bg-gradient-to-b from-accent-base/50 to-transparent -translate-x-1/2 rounded-full hidden md:block"></div>
          
          <div className="flex flex-col gap-12 relative z-10">
            {roadmap.milestones.map((milestone, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={milestone.id} className={`relative flex flex-col md:flex-row items-center w-full group ${isEven ? "md:justify-start" : "md:justify-end"}`}>
                  
                  {/* Center Node & Learn Button Wrapper */}
                  <div className="hidden md:flex flex-col items-center absolute left-1/2 -translate-x-1/2 z-20 -mt-10">
                    <button 
                       onClick={() => handleLearn(milestone)}
                       className="mb-2 px-4 py-1.5 bg-accent-base text-[var(--color-void)] text-xs font-black uppercase tracking-wider rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-105"
                    >
                      Learn
                    </button>
                    <div className="shrink-0 w-16 h-16 rounded-full bg-[var(--clay-bg)] border-4 border-accent-base shadow-[0_0_15px_rgba(var(--accent-base-rgb),0.3)] flex items-center justify-center font-black text-xl text-text group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content Card (Link) */}
                  <Link 
                    href={`/roadmap/${roadmap.id}/topic/${milestone.id}`}
                    className={`flex-1 bg-[var(--clay-bg)] border-2 border-clay-border hover:border-accent-base rounded-3xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all relative w-full md:w-[45%] cursor-pointer ${isEven ? "md:mr-[55%]" : "md:ml-[55%]"}`}
                  >
                    <div className="md:hidden flex justify-between items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-accent-base text-[var(--color-void)] flex items-center justify-center font-black shadow-md">
                        {index + 1}
                      </div>
                      <button 
                         onClick={(e) => { e.preventDefault(); handleLearn(milestone); }}
                         className="px-4 py-1.5 bg-accent-base text-[var(--color-void)] text-xs font-black uppercase tracking-wider rounded-full shadow-md active:scale-95 transition-transform"
                      >
                        Learn
                      </button>
                    </div>
                    
                    <h3 className="text-xl font-extrabold text-text mb-2 group-hover:text-accent-base transition-colors mt-2 md:mt-0">
                      {milestone.label}
                    </h3>
                    <p className="text-text-dim text-sm leading-relaxed mb-4 line-clamp-3">
                      {milestone.description}
                    </p>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="inline-block font-mono text-xs font-black bg-accent-base/10 text-accent-base px-3 py-1.5 rounded-lg border border-accent-base/20">
                        ⏱️ Est. {milestone.estimatedHours}h
                      </div>
                      <span className="text-accent-base font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Explore <span className="text-lg">→</span>
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
