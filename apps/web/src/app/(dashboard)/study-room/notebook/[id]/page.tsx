"use client";

import { useState } from "react";
import Link from "next/link";
import { FlashcardDeck } from "@/features/study-room/components/FlashcardDeck";
import {
  LearnMindmap,
  SolveMindmap,
  MindmapTopic,
  SocraticStep,
} from "@/features/study-room/components/MindmapViewer";

/* ── Mock data for Learn mode ── */
const MOCK_LEARN_TOPICS: MindmapTopic[] = [
  {
    id: "1",
    label: "Machine Learning",
    description: "A branch of AI that enables systems to learn from data.",
    children: [
      {
        id: "1-1",
        label: "Supervised Learning",
        description: "Learning from labeled input-output pairs.",
        children: [
          { id: "1-1-1", label: "Classification", description: "Predicting discrete categories (e.g. spam detection)." },
          { id: "1-1-2", label: "Regression", description: "Predicting continuous values (e.g. house prices)." },
        ],
      },
      {
        id: "1-2",
        label: "Unsupervised Learning",
        description: "Finding patterns in data without explicit labels.",
        children: [
          { id: "1-2-1", label: "Clustering", description: "Grouping similar data points together (e.g. K-Means)." },
          { id: "1-2-2", label: "Dimensionality Reduction", description: "Reducing features while preserving information (e.g. PCA)." },
        ],
      },
      {
        id: "1-3",
        label: "Reinforcement Learning",
        description: "Learning through trial, error, and reward signals.",
        children: [
          { id: "1-3-1", label: "Q-Learning" },
          { id: "1-3-2", label: "Policy Gradient" },
        ],
      },
    ],
  },
  {
    id: "2",
    label: "Model Evaluation",
    description: "Techniques to assess how well a model performs.",
    children: [
      { id: "2-1", label: "Train/Test Split" },
      { id: "2-2", label: "Cross-Validation" },
      { id: "2-3", label: "Metrics (Accuracy, F1, AUC)" },
    ],
  },
];

/* ── Mock data for Solve mode ── */
const MOCK_SOLVE_STEPS: SocraticStep[] = [
  {
    id: "s1",
    label: "Understand the problem",
    hint: "What are the given values and what is the question asking you to find? Write down the knowns and unknowns.",
    detail: "This is always the first step in any problem-solving approach.",
  },
  {
    id: "s2",
    label: "Identify the relevant formula",
    hint: "Think about which equation relates the given variables. What concept does this problem test?",
  },
  {
    id: "s3",
    label: "Substitute the values",
    hint: "Plug the known values into the formula. What do you notice about the units?",
  },
  {
    id: "s4",
    label: "Solve algebraically",
    hint: "Isolate the unknown variable. What intermediate result do you get?",
    detail: "Show your work step by step — don't skip ahead.",
  },
  {
    id: "s5",
    label: "Verify your answer",
    hint: "Does your answer make physical sense? Try plugging it back into the original equation.",
  },
];

const MOCK_FLASHCARDS = [
  { id: "1", notebook_id: "1", front: "What is Supervised Learning?", back: "A type of machine learning where the model is trained on labeled data, learning to map inputs to known outputs.", created_at: "" },
  { id: "2", notebook_id: "1", front: "What is Unsupervised Learning?", back: "A type of machine learning where the model identifies patterns and structure in data without labeled examples.", created_at: "" },
  { id: "3", notebook_id: "1", front: "What is Reinforcement Learning?", back: "A type of learning where an agent learns to make decisions by taking actions and receiving rewards or penalties.", created_at: "" },
];

// In a real app, this would come from DB based on the notebook type
const MOCK_NOTEBOOK = {
  id: "1",
  title: "Introduction to Machine Learning",
  type: "learn" as const,
};

export default function NotebookPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<"mindmap" | "flashcards">("mindmap");
  const notebook = MOCK_NOTEBOOK;
  const isLearnMode = notebook.type === "learn";

  return (
    <div className="flex flex-col h-full">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/study-room"
              className="text-sm text-text-dim hover:text-accent-base transition-colors"
            >
              Study Room
            </Link>
            <span className="text-sm text-text-dimmer">/</span>
            <span className="text-sm text-text font-bold">
              {notebook.title}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-text">
            {notebook.title}
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/study-room/${notebook.type}/${params.id}`}
            className="px-4 py-2 border border-clay-border rounded-xl font-bold text-text hover:bg-[var(--card-hover-bg)] transition-colors"
          >
            Continue Chat
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-clay-border mb-6">
        <button
          onClick={() => setActiveTab("mindmap")}
          className={`pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${
            activeTab === "mindmap"
              ? "border-accent-base text-accent-base"
              : "border-transparent text-text-dim hover:text-text"
          }`}
        >
          {isLearnMode ? "Concept Map" : "Socratic Path"}
        </button>
        <button
          onClick={() => setActiveTab("flashcards")}
          className={`pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${
            activeTab === "flashcards"
              ? "border-accent-base text-accent-base"
              : "border-transparent text-text-dim hover:text-text"
          }`}
        >
          Flashcards
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-[500px] bg-[var(--clay-bg)] rounded-3xl border border-clay-border overflow-hidden relative">
        {activeTab === "mindmap" && (
          <div className="w-full h-full min-h-[500px]">
            {isLearnMode ? (
              <LearnMindmap topics={MOCK_LEARN_TOPICS} title={notebook.title} />
            ) : (
              <SolveMindmap problemTitle={notebook.title} steps={MOCK_SOLVE_STEPS} />
            )}
          </div>
        )}

        {activeTab === "flashcards" && (
          <div className="w-full h-full flex items-center justify-center pt-8 pb-16">
            <FlashcardDeck cards={MOCK_FLASHCARDS} />
          </div>
        )}
      </div>
    </div>
  );
}
