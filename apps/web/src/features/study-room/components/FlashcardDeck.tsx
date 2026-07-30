"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Flashcard } from "@/features/study-room/types";

export function FlashcardDeck({ cards }: { cards: Flashcard[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!cards || cards.length === 0) {
    return (
      <div className="p-8 text-center text-text-dim border border-clay-border border-dashed rounded-2xl bg-[var(--input-bg)]">
        No flashcards generated yet. Keep chatting to generate flashcards!
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      {/* Card Container */}
      <div
        className="relative w-full h-64 cursor-pointer group select-none"
        style={{ perspective: 1000 }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="w-full h-full relative"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 w-full h-full bg-[var(--clay-bg)] border-2 border-clay-border rounded-2xl p-8 flex flex-col justify-center items-center text-center group-hover:border-accent-base/50 transition-all shadow-sm"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              opacity: isFlipped ? 0 : 1,
              pointerEvents: isFlipped ? "none" : "auto",
              transition: "opacity 0.15s ease-in-out",
            }}
          >
            <span className="absolute top-4 left-4 text-xs font-bold text-accent-base uppercase tracking-wider">
              Question
            </span>
            <h3 className="text-xl font-bold text-text">{currentCard.front}</h3>
            <p className="absolute bottom-4 text-xs text-text-dimmer">
              Click to flip
            </p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 w-full h-full bg-accent-bg border-2 border-accent-base/40 rounded-2xl p-8 flex flex-col justify-center items-center text-center shadow-sm"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              opacity: isFlipped ? 1 : 0,
              pointerEvents: isFlipped ? "auto" : "none",
              transition: "opacity 0.15s ease-in-out",
            }}
          >
            <span className="absolute top-4 left-4 text-xs font-bold text-accent-base uppercase tracking-wider">
              Answer
            </span>
            <p className="text-base text-text leading-relaxed font-medium">{currentCard.back}</p>
            <p className="absolute bottom-4 text-xs text-text-dimmer">
              Click to flip back
            </p>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between w-full mt-8">
        <button
          onClick={handlePrev}
          className="p-3 bg-[var(--input-bg)] border border-clay-border rounded-xl hover:bg-[var(--card-hover-bg)] transition-colors text-text"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-sm font-bold text-text-dim">
          {currentIndex + 1} / {cards.length}
        </span>
        <button
          onClick={handleNext}
          className="p-3 bg-[var(--input-bg)] border border-clay-border rounded-xl hover:bg-[var(--card-hover-bg)] transition-colors text-text"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
