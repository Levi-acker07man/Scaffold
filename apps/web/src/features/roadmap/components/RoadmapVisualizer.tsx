"use client";

import { useState } from "react";

export interface Milestone {
  id: string;
  label: string;
  description: string;
  estimatedHours: number;
}

interface RoadmapVisualizerProps {
  milestones: Milestone[];
  onAddToTasks: (milestone: Milestone) => void;
}

export function RoadmapVisualizer({ milestones, onAddToTasks }: RoadmapVisualizerProps) {
  const [addedMilestones, setAddedMilestones] = useState<Set<string>>(new Set());

  const handleAdd = (milestone: Milestone) => {
    setAddedMilestones((prev) => {
      const next = new Set(prev);
      next.add(milestone.id);
      return next;
    });
    onAddToTasks(milestone);
  };

  return (
    <div className="w-full h-full min-h-[600px] bg-[var(--input-bg)] border border-clay-border rounded-3xl p-8 overflow-y-auto relative shadow-inner">
      <div className="max-w-3xl mx-auto relative pb-12">
        {/* Continuous vertical line */}
        <div className="absolute left-8 top-8 bottom-0 w-1 bg-gradient-to-b from-accent-base/50 to-transparent rounded-full hidden md:block"></div>
        
        <div className="flex flex-col gap-6 relative z-10">
          {milestones.map((milestone, index) => {
            const isAdded = addedMilestones.has(milestone.id);
            
            return (
              <div key={milestone.id} className="relative flex flex-col md:flex-row items-start gap-6 group">
                
                {/* Timeline Node / Circle */}
                <div className="hidden md:flex shrink-0 w-16 h-16 rounded-full bg-[var(--clay-bg)] border-4 border-accent-base shadow-[0_0_15px_rgba(var(--accent-base-rgb),0.3)] items-center justify-center font-black text-xl text-text z-10 group-hover:scale-110 transition-transform">
                  {index + 1}
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-[var(--clay-bg)] border-2 border-clay-border group-hover:border-accent-base/80 rounded-3xl p-6 shadow-sm transition-all relative w-full">
                  
                  <div className="md:hidden absolute -top-4 -left-2 w-10 h-10 rounded-full bg-accent-base text-[var(--color-void)] flex items-center justify-center font-black shadow-md">
                    {index + 1}
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 mt-2 md:mt-0">
                      <h3 className="text-xl font-extrabold text-text mb-2 group-hover:text-accent-base transition-colors">
                        {milestone.label}
                      </h3>
                      <p className="text-text-dim text-sm leading-relaxed mb-4">
                        {milestone.description}
                      </p>
                      <div className="inline-block font-mono text-xs font-black bg-accent-base/10 text-accent-base px-3 py-1.5 rounded-lg border border-accent-base/20">
                        ⏱️ Est. {milestone.estimatedHours} Hours
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleAdd(milestone)}
                      disabled={isAdded}
                      className={`shrink-0 self-start md:self-center px-6 py-3 rounded-xl font-bold text-sm transition-all w-full md:w-auto shadow-sm ${
                        isAdded 
                          ? "bg-green-500/10 text-green-600 border border-green-500/20 cursor-not-allowed" 
                          : "bg-accent-base text-[var(--color-void)] hover:-translate-y-1 hover:shadow-lg active:translate-y-0"
                      }`}
                    >
                      {isAdded ? "✓ Added to Tasks" : "+ Add to Tasks"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
