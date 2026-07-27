"use client";

import { useState } from "react";
import Link from "next/link";
import { Message } from "@/features/study-room/types";

interface ChatInterfaceProps {
  notebookId: string;
  mode: "learn" | "solve";
}

export function ChatInterface({ notebookId, mode }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      notebook_id: notebookId,
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setInput("");

    // Simulate AI response for now
    setTimeout(() => {
      const aiContent =
        mode === "solve"
          ? "That's an interesting problem! Before I give you the answer, let me ask: what do you think the first step should be? Think about which concept or formula might be relevant here."
          : `Great question! Let me explain this concept. ${input.includes("?") ? "Here's what you need to know..." : "This is a simulated response in learn mode."}`;

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        notebook_id: notebookId,
        role: "assistant",
        content: aiContent,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--clay-bg)] rounded-3xl overflow-hidden border border-clay-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-clay-border bg-[var(--input-bg)]">
        <div className="flex items-center gap-3">
          <Link
            href="/study-room"
            className="p-2 hover:bg-[var(--card-hover-bg)] rounded-full transition-colors text-text-dim"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                mode === "learn" ? "bg-blue-500" : "bg-green-500"
              }`}
            />
            <h2 className="font-bold text-lg text-text capitalize">
              {mode} Mode
            </h2>
          </div>
        </div>
        <Link
          href={`/study-room/notebook/${notebookId}`}
          className="px-4 py-2 bg-accent-bg text-accent-base font-bold text-sm rounded-lg hover:bg-[var(--accent-hover-bg)] border border-accent-border transition-colors"
        >
          View Notebook
        </Link>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                mode === "learn"
                  ? "bg-blue-500/10 border border-blue-500/20"
                  : "bg-green-500/10 border border-green-500/20"
              }`}
            >
              <span className="text-2xl">
                {mode === "learn" ? "📚" : "✍️"}
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-text">
              Welcome to your {mode} session
            </h3>
            <p className="text-text-dim text-sm">
              {mode === "learn"
                ? "Upload a PDF, photo, or provide a link, and start asking questions to learn the material deeply."
                : "Share a problem you are stuck on. I won't give you the answer directly — instead, I'll guide you with hints so you truly understand the solution."}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === "user"
                  ? "bg-accent-base text-[var(--color-void)] self-end rounded-br-none"
                  : "bg-[var(--input-bg)] border border-clay-border self-start rounded-bl-none text-text"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-clay-border bg-[var(--input-bg)] relative">
        <div className="flex items-end gap-2 bg-[var(--clay-bg)] border border-clay-border rounded-2xl p-2 focus-within:border-accent-base transition-colors">
          <button
            className="p-3 text-text-dim hover:text-accent-base hover:bg-accent-bg rounded-xl transition-colors"
            title="Upload Document (PDF, Photo, Link)"
            onClick={() => setIsUploading(!isUploading)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              mode === "learn"
                ? "Ask about a concept..."
                : "Describe the problem you're stuck on..."
            }
            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:outline-none resize-none py-3 px-2 text-text placeholder:text-text-dimmer"
            rows={1}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 bg-accent-base text-[var(--color-void)] rounded-xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {/* Upload Menu */}
        {isUploading && (
          <div className="absolute bottom-20 left-4 bg-[var(--clay-bg)] border border-clay-border rounded-xl shadow-lg p-2 flex gap-2 z-50">
            <button className="flex flex-col items-center gap-1 p-3 hover:bg-[var(--card-hover-bg)] rounded-lg transition-colors text-xs font-bold text-text-dim hover:text-text">
              <span className="text-xl">📄</span> PDF
            </button>
            <button className="flex flex-col items-center gap-1 p-3 hover:bg-[var(--card-hover-bg)] rounded-lg transition-colors text-xs font-bold text-text-dim hover:text-text">
              <span className="text-xl">🖼️</span> Photo
            </button>
            <button className="flex flex-col items-center gap-1 p-3 hover:bg-[var(--card-hover-bg)] rounded-lg transition-colors text-xs font-bold text-text-dim hover:text-text">
              <span className="text-xl">🔗</span> Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
