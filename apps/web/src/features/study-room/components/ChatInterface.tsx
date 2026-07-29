"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Message } from "@/features/study-room/types";
import {
  getNotebook,
  createNotebook,
  addMessage,
  updateExtractedData,
  updateNotebook
} from "@/features/study-room/lib/notebookStore";

interface ChatInterfaceProps {
  notebookId: string;
  mode: "learn" | "solve";
}

export function ChatInterface({ notebookId, mode }: ChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [context, setContext] = useState<string | undefined>();
  
  const currentNotebookId = useRef(notebookId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (notebookId === "new") {
      const newNb = createNotebook(mode);
      currentNotebookId.current = newNb.id;
      window.history.replaceState(null, "", `/study-room/${mode}/${newNb.id}`);
    } else {
      const existing = getNotebook(notebookId);
      if (existing) {
        setMessages(existing.messages);
        if (existing.context) setContext(existing.context);
      }
    }
  }, [notebookId, mode]);

  // Auto-reply if the last message is from the user (e.g. injected by Roadmap)
  useEffect(() => {
    const triggerAutoReply = async () => {
      if (messages.length === 0) return;
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "user" && !isTyping) {
        setIsTyping(true);
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: messages,
              mode,
              context,
            }),
          });
          
          if (res.ok) {
            const data = await res.json();
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              notebook_id: currentNotebookId.current,
              role: "assistant",
              content: data.reply,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => {
               // Only add if not already added to avoid strict mode double triggers
               if (prev[prev.length - 1].id === aiMessage.id) return prev;
               return [...prev, aiMessage];
            });
            addMessage(currentNotebookId.current, aiMessage);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsTyping(false);
        }
      }
    };
    
    // We only want to auto-reply if the AI hasn't responded yet and we aren't currently typing
    if (messages.length > 0 && messages[messages.length - 1].role === "user" && !isTyping) {
        // Debounce slightly to ensure state is settled
        const timer = setTimeout(() => {
            triggerAutoReply();
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [messages, mode, context]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userContent = input;
    const newMessage: Message = {
      id: Date.now().toString(),
      notebook_id: currentNotebookId.current,
      role: "user",
      content: userContent,
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput("");
    addMessage(currentNotebookId.current, newMessage);

    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          mode,
          context,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          notebook_id: currentNotebookId.current,
          role: "assistant",
          content: data.reply,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        addMessage(currentNotebookId.current, aiMessage);
      } else {
        console.error("Chat API error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEndSession = async () => {
    if (messages.length === 0) {
      router.push(`/study-room/notebook/${currentNotebookId.current}`);
      return;
    }

    setIsExtracting(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          mode,
          context,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        updateExtractedData(currentNotebookId.current, data.topics || [], data.flashcards || []);
        router.push(`/study-room/notebook/${currentNotebookId.current}`);
      } else {
        console.error("Extract API error");
        setIsExtracting(false);
      }
    } catch (err) {
      console.error(err);
      setIsExtracting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(false);

    if (file.type === "application/pdf") {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        // Use local worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n";
        }
        
        setContext(fullText);
        updateNotebook(currentNotebookId.current, { context: fullText });
        alert("PDF loaded as context successfully!");
      } catch (err) {
        console.error("Error parsing PDF:", err);
        alert("Failed to parse PDF.");
      }
    } else if (file.type.startsWith("image/")) {
      alert("Image upload will be supported in future versions using multimodal features.");
    }
  };

  const handleLinkInput = () => {
    const linkText = prompt("Paste a link or text context:");
    if (linkText) {
      setContext(linkText);
      updateNotebook(currentNotebookId.current, { context: linkText });
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 flex flex-col min-h-0 bg-[var(--clay-bg)] rounded-3xl overflow-hidden border border-clay-border shadow-sm">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-clay-border bg-[var(--input-bg)]">
        <div className="flex items-center gap-3">
          <Link
            href="/study-room"
            className="p-2 hover:bg-[var(--card-hover-bg)] rounded-full transition-colors text-text-dim"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${mode === "learn" ? "bg-blue-500" : "bg-green-500"}`} />
            <h2 className="font-bold text-lg text-text capitalize">{mode} Mode</h2>
          </div>
        </div>
        
        <div className="flex gap-2">
          {context && (
            <span className="px-3 py-2 bg-green-500/10 text-green-500 text-xs font-bold rounded-lg flex items-center">
              Context Loaded
            </span>
          )}
          <button
            onClick={handleEndSession}
            disabled={isExtracting}
            className="px-4 py-2 bg-accent-bg text-accent-base font-bold text-sm rounded-lg hover:bg-[var(--accent-hover-bg)] border border-accent-border transition-colors disabled:opacity-50"
          >
            {isExtracting ? "Extracting..." : "End Session & Save"}
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${mode === "learn" ? "bg-blue-500/10 border border-blue-500/20" : "bg-green-500/10 border border-green-500/20"}`}>
              <span className="text-2xl">{mode === "learn" ? "📚" : "✍️"}</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-text">Welcome to your {mode} session</h3>
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
              className={`max-w-[85%] rounded-2xl p-5 ${
                msg.role === "user"
                  ? "bg-accent-base text-[var(--color-void)] self-end rounded-br-none"
                  : "bg-[var(--input-bg)] border border-clay-border self-start rounded-bl-none text-text"
              }`}
            >
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
          ))
        )}
        {isTyping && (
          <div className="bg-[var(--input-bg)] border border-clay-border self-start rounded-2xl rounded-bl-none p-4 text-text-dim">
            <span className="animate-pulse">...</span>
          </div>
        )}
      </div>
    </div>

    {/* Input Area */}
      <div className="shrink-0 relative">
        <div className="flex items-end gap-2 bg-[var(--clay-bg)] border border-clay-border rounded-3xl p-3 focus-within:border-accent-base transition-colors shadow-sm">
          <button
            className="p-3 text-text-dim hover:text-accent-base hover:bg-accent-bg rounded-xl transition-colors"
            title="Upload Document"
            onClick={() => setIsUploading(!isUploading)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            placeholder={mode === "learn" ? "Ask about a concept..." : "Describe the problem you're stuck on..."}
            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:outline-none resize-none py-3 px-2 text-text placeholder:text-text-dimmer"
            rows={1}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-3 bg-accent-base text-[var(--color-void)] rounded-xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {/* Upload Menu */}
        {isUploading && (
          <div className="absolute bottom-20 left-4 bg-[var(--clay-bg)] border border-clay-border rounded-xl shadow-lg p-2 flex gap-2 z-50">
            <input 
              type="file" 
              accept=".pdf,image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1 p-3 hover:bg-[var(--card-hover-bg)] rounded-lg transition-colors text-xs font-bold text-text-dim hover:text-text"
            >
              <span className="text-xl">📄</span> File
            </button>
            <button 
              onClick={handleLinkInput}
              className="flex flex-col items-center gap-1 p-3 hover:bg-[var(--card-hover-bg)] rounded-lg transition-colors text-xs font-bold text-text-dim hover:text-text"
            >
              <span className="text-xl">🔗</span> Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
