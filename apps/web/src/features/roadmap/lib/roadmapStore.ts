export interface TopicResource {
  summary: string;
  keyConcepts: string[];
  practiceExercise: string;
  searchTerms: string[];
}

export interface Milestone {
  id: string;
  label: string;
  description: string;
  estimatedHours: number;
  resources?: TopicResource;
}

export interface Roadmap {
  id: string;
  topic: string;
  level: string;
  timeframe: string;
  milestones: Milestone[];
  createdAt: string;
}

const STORAGE_KEY = "scaffold_roadmaps";

export const roadmapStore = {
  getRoadmaps: (): Roadmap[] => {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to parse roadmaps", e);
      return [];
    }
  },

  getRoadmap: (id: string): Roadmap | undefined => {
    const roadmaps = roadmapStore.getRoadmaps();
    return roadmaps.find((r) => r.id === id);
  },

  saveRoadmap: (roadmap: Roadmap) => {
    if (typeof window === "undefined") return;
    const roadmaps = roadmapStore.getRoadmaps();
    const existingIndex = roadmaps.findIndex((r) => r.id === roadmap.id);
    
    if (existingIndex >= 0) {
      roadmaps[existingIndex] = roadmap;
    } else {
      roadmaps.unshift(roadmap);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roadmaps));
  },

  saveTopicResources: (roadmapId: string, milestoneId: string, resources: TopicResource) => {
    const roadmap = roadmapStore.getRoadmap(roadmapId);
    if (!roadmap) return;

    const milestoneIndex = roadmap.milestones.findIndex((m) => m.id === milestoneId);
    if (milestoneIndex === -1) return;

    roadmap.milestones[milestoneIndex].resources = resources;
    roadmapStore.saveRoadmap(roadmap);
  },

  deleteRoadmap: (id: string) => {
    if (typeof window === "undefined") return;
    const roadmaps = roadmapStore.getRoadmaps().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roadmaps));
  }
};
