"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FlashcardDeck } from "@/features/study-room/components/FlashcardDeck";
import {
  LearnMindmap,
  SolveMindmap,
  SocraticStep,
} from "@/features/study-room/components/MindmapViewer";
import { getNotebook, updateExtractedData } from "@/features/study-room/lib/notebookStore";
import { StoredNotebook } from "@/features/study-room/types";

export default function NotebookPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"mindmap" | "flashcards" | "chat">("mindmap");
  const [notebook, setNotebook] = useState<StoredNotebook | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [highlightedTopic, setHighlightedTopic] = useState<string | null>(null);

  const handleExploreInChat = (label: string) => {
    setHighlightedTopic(label);
    setActiveTab("chat");
  };

  useEffect(() => {
    if (activeTab === "chat" && highlightedTopic && notebook?.messages && notebook.messages.length > 0) {
      const cleanTopic = highlightedTopic
        .toLowerCase()
        .replace(/[0-9]+\./g, "")
        .replace(/[^\w\s]/g, " ")
        .trim();

      const stopWords = new Set([
        "the", "and", "for", "with", "from", "that", "this", "what", "how",
        "why", "are", "you", "can", "have", "not", "but", "about", "which",
        "where", "when", "who", "will", "would", "could", "should", "into",
        "over", "under", "more", "most", "some", "such", "than", "then",
        "step", "mode", "part", "topic", "session", "root"
      ]);

      const words = cleanTopic
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !stopWords.has(w));

      let targetId: string | null = null;
      let maxScore = 0;

      for (const msg of notebook.messages) {
        const content = msg.content.toLowerCase();
        let score = 0;

        // Exact or partial phrase match
        if (cleanTopic.length > 3 && content.includes(cleanTopic)) {
          score += 100;
        }

        // Keyword matches & stem matches
        for (const w of words) {
          if (content.includes(w)) {
            score += 25;
          } else {
            const stem = w.replace(/(s|es|ed|ing|ion)$/, "");
            if (stem.length >= 4 && content.includes(stem)) {
              score += 15;
            }
          }
        }

        if (score > maxScore) {
          maxScore = score;
          targetId = msg.id;
        }
      }

      // If no positive score, match the latest assistant message where concepts are explained, rather than the start of chat!
      if (!targetId) {
        const assistantMsgs = notebook.messages.filter((m) => m.role === "assistant");
        targetId = assistantMsgs.length > 0
          ? assistantMsgs[Math.max(0, assistantMsgs.length - 1)].id
          : notebook.messages[notebook.messages.length - 1]?.id;
      }

      if (targetId) {
        const idToScroll = targetId;
        setTimeout(() => {
          const el = document.getElementById(`msg-${idToScroll}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-2", "ring-accent-base", "bg-accent-base/15", "scale-[1.01]", "transition-all", "duration-500");
            setTimeout(() => {
              el.classList.remove("ring-2", "ring-accent-base", "bg-accent-base/15", "scale-[1.01]");
            }, 3500);
          }
        }, 150);
      }
    }
  }, [activeTab, highlightedTopic, notebook]);

  useEffect(() => {
    const loaded = getNotebook(params.id);
    if (loaded) {
      setNotebook(loaded);
    } else {
      router.push("/study-room");
    }
  }, [params.id, router]);

  const handleReExtract = async () => {
    if (!notebook) return;
    setIsExtracting(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: notebook.messages,
          mode: notebook.type,
          context: notebook.context,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        updateExtractedData(notebook.id, data.topics || [], data.flashcards || []);
        // Reload notebook
        setNotebook(getNotebook(notebook.id));
      } else {
        console.error("Extract API error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtracting(false);
    }
  };

  if (!notebook) return <div className="p-8 text-center text-text-dim">Loading...</div>;

  const isLearnMode = notebook.type === "learn";

  const effectiveTopics =
    notebook.topics &&
    notebook.topics.length === 1 &&
    notebook.topics[0].children &&
    (notebook.topics[0].children.length || 0) > 1
      ? notebook.topics[0].children
      : notebook.topics || [];

  // Convert MindmapTopic to SocraticStep for Solve mode
  const solveSteps: SocraticStep[] = effectiveTopics.map((t, idx) => ({
    id: t.id || `s${idx}`,
    label: t.label,
    hint: t.description || "Think about this step.",
    detail: t.children?.map(c => c.label).join(", "),
  }));

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
          <button
            onClick={handleReExtract}
            disabled={isExtracting}
            className="px-4 py-2 border border-clay-border rounded-xl font-bold text-text hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
          >
            {isExtracting ? "Extracting..." : "Re-extract Concepts"}
          </button>
          <Link
            href={`/study-room/${notebook.type}/${params.id}`}
            className="px-4 py-2 bg-accent-base text-[var(--color-void)] rounded-xl font-bold hover:opacity-90 transition-all shadow-sm"
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
        <button
          onClick={() => setActiveTab("chat")}
          className={`pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${
            activeTab === "chat"
              ? "border-accent-base text-accent-base"
              : "border-transparent text-text-dim hover:text-text"
          }`}
        >
          Chat History
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-[70vh] bg-[var(--clay-bg)] rounded-3xl border border-clay-border overflow-hidden relative flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, duration: 0.3 }}
            className="w-full h-full flex-1 flex flex-col min-h-0"
          >
            {activeTab === "mindmap" && (
              <div className="w-full h-full min-h-[500px]">
                {(!notebook.topics || notebook.topics.length === 0) ? (
                  <div className="flex items-center justify-center h-full min-h-[500px] text-text-dim">
                    No concepts extracted yet. Click "Re-extract Concepts" or chat more.
                  </div>
                ) : isLearnMode ? (
                  <LearnMindmap topics={effectiveTopics} title={notebook.title} onExploreInChat={handleExploreInChat} />
                ) : (
                  <SolveMindmap problemTitle={notebook.title} steps={solveSteps} onExploreInChat={handleExploreInChat} />
                )}
              </div>
            )}

            {activeTab === "flashcards" && (
              <div className="w-full h-full flex items-center justify-center pt-8 pb-16">
                {(!notebook.flashcards || notebook.flashcards.length === 0) ? (
                   <div className="text-text-dim">No flashcards extracted yet.</div>
                ) : (
                  <FlashcardDeck cards={notebook.flashcards} />
                )}
              </div>
            )}

            {activeTab === "chat" && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0 h-full">
                {highlightedTopic && (
                  <div className="bg-accent-bg border border-accent-border rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in duration-200 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">💬</span>
                      <div>
                        <span className="text-[11px] font-bold text-accent-base uppercase tracking-wider block">Exploring Topic</span>
                        <h4 className="font-extrabold text-text text-base">{highlightedTopic}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/study-room/${notebook.type}/${notebook.id}`}
                        className="px-4 py-2 bg-accent-base text-[var(--color-void)] rounded-xl text-xs font-extrabold hover:opacity-90 transition-all shadow-sm"
                      >
                        Ask in Live Chat →
                      </Link>
                      <button
                        onClick={() => setHighlightedTopic(null)}
                        className="p-2 text-text-dim hover:text-text rounded-xl hover:bg-clay-bg transition-colors"
                        title="Clear topic filter"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {notebook.messages.length === 0 ? (
                  <div className="text-center text-text-dim mt-8">No messages in this chat.</div>
                ) : (
                  notebook.messages.map((msg) => {
                    const content = msg.content.toLowerCase();
                    const cleanTopic = (highlightedTopic || "").toLowerCase().replace(/[0-9]+\./g, "").trim();
                    const words = cleanTopic.split(/\s+/).filter((w) => w.length >= 3);
                    const isMentioned =
                      highlightedTopic &&
                      (content.includes(cleanTopic) ||
                        words.some((k) => {
                          const stem = k.replace(/(s|es|ed|ing|ion)$/, "");
                          return content.includes(stem);
                        }));

                    return (
                      <div
                        key={msg.id}
                        id={`msg-${msg.id}`}
                        className={`max-w-[85%] rounded-2xl p-5 transition-all duration-300 ${
                          msg.role === "user"
                            ? "bg-accent-base text-[var(--color-void)] self-end rounded-br-none"
                            : "bg-[var(--input-bg)] border border-clay-border self-start rounded-bl-none text-text"
                        }`}
                      >
                        {isMentioned && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-base/20 text-accent-base text-xs font-bold mb-2">
                            <span>✨</span>
                            <span>Mentioned: {highlightedTopic}</span>
                          </div>
                        )}
                        {msg.role === "user" ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:mb-5 prose-headings:mt-8 prose-headings:mb-4 prose-headings:font-extrabold prose-ul:mb-5 prose-li:mb-2 prose-a:text-accent-base">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
