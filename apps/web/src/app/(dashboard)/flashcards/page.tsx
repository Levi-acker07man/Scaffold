"use client";

import { useState } from "react";

type Flashcard = {
  id: string;
  front: string;
  back: string;
  color: string;
};

const PASTEL_COLORS = [
  "bg-yellow-100 border-yellow-200",
  "bg-blue-100 border-blue-200",
  "bg-green-100 border-green-200",
  "bg-pink-100 border-pink-200",
  "bg-purple-100 border-purple-200",
  "bg-orange-100 border-orange-200",
];

export default function FlashcardsPage() {
  const [activeTab, setActiveTab] = useState<"typical" | "neuro">("typical");
  const [typicalCards, setTypicalCards] = useState<Flashcard[]>([]);
  const [neuroCards, setNeuroCards] = useState<Flashcard[]>([]);

  const addCard = (type: "typical" | "neuro") => {
    const newCard: Flashcard = {
      id: Math.random().toString(36).substr(2, 9),
      front: "",
      back: "",
      color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
    };

    if (type === "typical") {
      setTypicalCards([...typicalCards, newCard]);
    } else {
      setNeuroCards([...neuroCards, newCard]);
    }
  };

  const updateCard = (type: "typical" | "neuro", id: string, side: "front" | "back", value: string) => {
    const updateFn = (cards: Flashcard[]) =>
      cards.map((c) => (c.id === id ? { ...c, [side]: value } : c));

    if (type === "typical") {
      setTypicalCards(updateFn(typicalCards));
    } else {
      setNeuroCards(updateFn(neuroCards));
    }
  };

  const deleteCard = (type: "typical" | "neuro", id: string) => {
    if (type === "typical") {
      setTypicalCards(typicalCards.filter((c) => c.id !== id));
    } else {
      setNeuroCards(neuroCards.filter((c) => c.id !== id));
    }
  };

  const renderCards = (cards: Flashcard[], type: "typical" | "neuro") => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`relative flex flex-col p-6 rounded-2xl border-2 shadow-sm transition-transform hover:-translate-y-1 group ${card.color} ${
            type === "neuro" ? "gap-4 min-h-[250px]" : "gap-2 min-h-[200px]"
          }`}
          style={{
            boxShadow: "3px 4px 10px rgba(0,0,0,0.05), inset 0 2px 5px rgba(255,255,255,0.7)",
          }}
        >
          {/* Delete Button */}
          <button
            onClick={() => deleteCard(type, card.id)}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Delete card"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black/50 hover:text-red-500">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className="flex-1 flex flex-col">
            <label className="text-[10px] uppercase tracking-wider font-bold text-black/60 dark:text-black/60 mb-1">
              Front (Term)
            </label>
            <textarea
              className={`w-full bg-transparent border-none outline-none resize-none font-medium text-black dark:text-black placeholder-black/40 dark:placeholder-black/40 ${
                type === "neuro" ? "text-lg leading-relaxed" : "text-base"
              }`}
              placeholder="Enter term..."
              value={card.front}
              onChange={(e) => updateCard(type, card.id, "front", e.target.value)}
              rows={2}
            />
          </div>
          
          <div className="h-px w-full bg-black/10 my-2"></div>
          
          <div className="flex-1 flex flex-col">
            <label className="text-[10px] uppercase tracking-wider font-bold text-black/60 dark:text-black/60 mb-1">
              Back (Definition)
            </label>
            <textarea
              className={`w-full bg-transparent border-none outline-none resize-none text-black dark:text-black placeholder-black/40 dark:placeholder-black/40 ${
                type === "neuro" ? "text-base leading-loose" : "text-sm"
              }`}
              placeholder="Enter definition..."
              value={card.back}
              onChange={(e) => updateCard(type, card.id, "back", e.target.value)}
              rows={3}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text">Flash Cards</h1>
          <p className="text-text-dim mt-1">Create and study with custom sticky notes.</p>
        </div>
        
        {/* Top Add Button (Optional shortcut) */}
        <button
          onClick={() => addCard(activeTab)}
          className="cta-button max-w-[150px] !py-3 !text-sm flex items-center justify-center gap-2"
        >
          <span>+ Add Card</span>
        </button>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-input-bg border border-clay-border rounded-xl w-fit mb-4">
        <button
          onClick={() => setActiveTab("typical")}
          className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
            activeTab === "typical"
              ? "bg-white dark:bg-panel-2 text-gray-900 dark:text-white shadow-sm border border-black/5 dark:border-white/10"
              : "text-text-dim hover:text-text"
          }`}
        >
          Typical Learner
        </button>
        <button
          onClick={() => setActiveTab("neuro")}
          className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
            activeTab === "neuro"
              ? "bg-white dark:bg-panel-2 text-gray-900 dark:text-white shadow-sm border border-black/5 dark:border-white/10"
              : "text-text-dim hover:text-text"
          }`}
        >
          NeuroDivergent Learner
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-2">
        {activeTab === "typical" && (
          <div>
            <p className="text-sm text-text-dim">Standard compact flashcards for quick review.</p>
            {renderCards(typicalCards, "typical")}
          </div>
        )}
        
        {activeTab === "neuro" && (
          <div>
            <p className="text-sm text-text-dim">Flashcards with extra spacing, clear separation, and larger typography for easier reading.</p>
            {renderCards(neuroCards, "neuro")}
          </div>
        )}
      </div>
    </div>
  );
}
