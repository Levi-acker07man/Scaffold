# Study Room Feature — Full Context & Build Guide

> **Purpose:** This document contains ALL context needed to build the Study Room feature from scratch. If the conversation resets or the model changes, read this file first and continue from the task list.

---

## 1. Project Overview

**Scaffold** is a Next.js 14 web app for students. It's a gamified productivity dashboard with:
- A task/to-do system with XP and coins
- An activity heatmap (GitHub-style)
- A shop for cosmetic rewards
- A **Study Room** (currently skeleton/dummy data — THIS is what we're building)

**Goal:** Build a NotebookLM-like Study Room where users can:
1. Start a new chat session (Learn or Solve mode)
2. Upload PDFs, photos, or paste links as study context
3. Chat with a Gemini-powered AI tutor
4. The AI automatically extracts key concepts → generates **mindmaps** and **flashcards**
5. Each chat becomes a "notebook" saved in a library
6. Users can revisit notebooks to see mindmaps, flashcards, and full chat history

---

## 2. Tech Stack & Key Paths

| Item | Detail |
|------|--------|
| **Framework** | Next.js 14 (App Router, `"use client"` components) |
| **Styling** | Tailwind CSS + custom CSS variables in `globals.css` |
| **UI Pattern** | Claymorphism (`.clay` class, `--clay-bg`, `--clay-border`, `--clay-shadow`) |
| **Auth & DB** | Supabase (but we use **localStorage** for this feature for now) |
| **AI Provider** | Google Gemini API via `@google/generative-ai` SDK |
| **Animations** | Framer Motion (`framer-motion`) |
| **Icons** | Lucide React + inline SVGs |
| **State** | React useState/useEffect (no Redux/Zustand) |
| **Workspace Root** | `/home/sunraku/Projects/Scaffold` |
| **Web App Root** | `/home/sunraku/Projects/Scaffold/apps/web` |
| **Dev Server** | `npm run dev` from `apps/web` |
| **Env File** | `apps/web/.env.local` (has Supabase keys, needs `GEMINI_API_KEY`) |

---

## 3. Existing File Inventory

### Pages (App Router)

| File | Purpose | Status |
|------|---------|--------|
| `src/app/(dashboard)/study-room/page.tsx` | Library page — shows notebook cards, "+ New" button | Has mock data, needs rewrite |
| `src/app/(dashboard)/study-room/learn/[id]/page.tsx` | Learn mode chat page | Thin wrapper around ChatInterface |
| `src/app/(dashboard)/study-room/solve/[id]/page.tsx` | Solve mode chat page | Thin wrapper around ChatInterface |
| `src/app/(dashboard)/study-room/notebook/[id]/page.tsx` | Notebook detail — mindmap/flashcard tabs | Has extensive mock data, needs rewrite |
| `src/app/(dashboard)/layout.tsx` | Dashboard layout with sidebar + header | Done, has Study Room nav link |

### Components

| File | Purpose | Status |
|------|---------|--------|
| `src/features/study-room/components/ChatInterface.tsx` | Chat UI with message list, input, upload buttons | Has dummy setTimeout AI responses — needs real Gemini integration |
| `src/features/study-room/components/MindmapViewer.tsx` | SVG-based interactive mindmap with pan/zoom (763 lines) | **DONE — keep as-is**, just feed it real data |
| `src/features/study-room/components/FlashcardDeck.tsx` | 3D flip card deck with prev/next (118 lines) | **DONE — keep as-is**, just feed it real data |

### Types

| File | Purpose |
|------|---------|
| `src/features/study-room/types/index.ts` | TypeScript interfaces: `Notebook`, `Message`, `MindmapNode`, `MindmapEdge`, `Flashcard`, `MindmapTopic` (in MindmapViewer) |

### API Routes (TO BE CREATED)

| File | Purpose |
|------|---------|
| `src/app/api/chat/route.ts` | Proxies chat to Gemini API (server-side, keeps API key secret) |
| `src/app/api/extract/route.ts` | Takes full chat → returns structured mindmap topics + flashcards |

### Data Layer (TO BE CREATED)

| File | Purpose |
|------|---------|
| `src/features/study-room/lib/notebookStore.ts` | localStorage CRUD for notebooks |

---

## 4. Data Models

### Current types in `src/features/study-room/types/index.ts`:
```ts
export type NotebookType = 'learn' | 'solve';

export interface Notebook {
  id: string;
  user_id: string;
  title: string;
  type: NotebookType;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  notebook_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  notebook_id: string;
  front: string;
  back: string;
  created_at: string;
}
```

### MindmapTopic (defined in MindmapViewer.tsx, line 6-11):
```ts
export interface MindmapTopic {
  id: string;
  label: string;
  description?: string;
  children?: MindmapTopic[];
}
```

### Updated Notebook type needed (add to types/index.ts):
```ts
export interface StoredNotebook {
  id: string;
  title: string;
  type: NotebookType;
  messages: Message[];
  topics: MindmapTopic[];      // extracted mindmap data
  flashcards: Flashcard[];     // extracted flashcard data
  context?: string;            // uploaded document text
  created_at: string;
  updated_at: string;
}
```

**localStorage key:** `scaffold_notebooks` — stores `StoredNotebook[]`

---

## 5. Existing UI Patterns to Follow

### Clay card pattern (used everywhere):
```tsx
<div className="clay rounded-3xl p-6 border border-clay-border shadow-sm">
  {/* content */}
</div>
```

### Input field pattern:
```tsx
<input className="bg-[var(--input-bg)] border border-clay-border rounded-xl px-4 py-3 text-text placeholder:text-text-dimmer focus:outline-none focus:border-accent-base" />
```

### Button pattern:
```tsx
<button className="px-6 py-3 bg-accent-base text-[var(--color-void)] font-bold rounded-xl hover:opacity-90 transition-all shadow-sm">
  Button Text
</button>
```

### Tab pattern (from notebook page):
```tsx
<button className={`pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${
  active ? "border-accent-base text-accent-base" : "border-transparent text-text-dim hover:text-text"
}`}>
```

### CSS variables available:
- `--clay-bg`, `--clay-border`, `--clay-shadow` — panel backgrounds
- `--input-bg` — input field backgrounds
- `--accent-base`, `--accent-bg`, `--accent-border` — accent/brand colors
- `--text`, `--text-dim`, `--text-dimmer` — text colors
- `--color-void` — contrast text (white on dark, dark on light)
- `--card-hover-bg`, `--card-hover-border` — hover states

---

## 6. Gemini API Integration Details

### Environment variable needed in `apps/web/.env.local`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```
Note: NO `NEXT_PUBLIC_` prefix — this stays server-side only.

### API Route pattern (`src/app/api/chat/route.ts`):
```ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { messages, mode, context } = await req.json();
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const systemPrompt = mode === "learn" 
    ? "You are a patient, encouraging tutor. Explain concepts clearly with examples..."
    : "You are a Socratic tutor. NEVER give direct answers. Guide with hints and questions...";
  
  // Build chat history from messages array
  // Send to Gemini, get response
  // Return { reply: string }
}
```

### Extract endpoint (`src/app/api/extract/route.ts`):
- Takes: `{ messages: Message[], mode: string }`
- Sends full chat to Gemini with prompt: "Extract the key topics as a hierarchical tree and Q&A flashcards from this conversation. Return JSON."
- Returns: `{ topics: MindmapTopic[], flashcards: Flashcard[] }`

---

## 7. NPM Packages to Install

Run from `apps/web/`:
```bash
npm install @google/generative-ai pdfjs-dist
```

- `@google/generative-ai` — Google's official Gemini SDK
- `pdfjs-dist` — Client-side PDF text extraction (Mozilla's pdf.js)

---

## 8. MindmapViewer Component API

The existing `LearnMindmap` component accepts:
```tsx
<LearnMindmap topics={MindmapTopic[]} title={string} />
```

The existing `SolveMindmap` component accepts:
```tsx
<SolveMindmap problemTitle={string} steps={SocraticStep[]} />
```

Where `SocraticStep`:
```ts
interface SocraticStep {
  id: string;
  label: string;
  hint: string;
  detail?: string;
}
```

The `FlashcardDeck` component accepts:
```tsx
<FlashcardDeck cards={Flashcard[]} />
```

**These components are COMPLETE and should NOT be rewritten.** Just pass them real data instead of mocks.

---

## 9. Sidebar Navigation

The Study Room already has a sidebar link in `layout.tsx` (line 114-132). It uses `pathname === "/study-room"` for active state. The active check should also match sub-routes — this needs updating to `pathname.startsWith("/study-room")`.

---

## 10. Step-by-Step Task List

Below is the exact order of implementation. Each step is self-contained.

### Phase 1: Dependencies & Environment

- [ ] **Step 1.1:** Install npm packages
  ```bash
  cd /home/sunraku/Projects/Scaffold/apps/web
  npm install @google/generative-ai pdfjs-dist
  ```

- [ ] **Step 1.2:** Add `GEMINI_API_KEY` to `apps/web/.env.local`
  - Append line: `GEMINI_API_KEY=` (user fills in their key)

### Phase 2: Data Layer

- [ ] **Step 2.1:** Update `src/features/study-room/types/index.ts`
  - Add `StoredNotebook` interface (see Section 4 above)
  - Export `MindmapTopic` type (currently only in MindmapViewer.tsx)

- [ ] **Step 2.2:** Create `src/features/study-room/lib/notebookStore.ts`
  - localStorage key: `scaffold_notebooks`
  - Functions:
    - `getNotebooks(): StoredNotebook[]`
    - `getNotebook(id: string): StoredNotebook | null`
    - `createNotebook(type: NotebookType, title?: string): StoredNotebook`
    - `updateNotebook(id: string, updates: Partial<StoredNotebook>): void`
    - `deleteNotebook(id: string): void`
    - `addMessage(notebookId: string, message: Message): void`
    - `updateExtractedData(notebookId: string, topics: MindmapTopic[], flashcards: Flashcard[]): void`

### Phase 3: API Routes

- [ ] **Step 3.1:** Create `src/app/api/chat/route.ts`
  - POST handler
  - Accepts: `{ messages: {role, content}[], mode: "learn"|"solve", context?: string }`
  - System prompt differs by mode (learn = explain, solve = Socratic hints)
  - If context is provided, prepend it as system context
  - Returns: `{ reply: string }`
  - Handle errors gracefully (missing API key, rate limits)

- [ ] **Step 3.2:** Create `src/app/api/extract/route.ts`
  - POST handler
  - Accepts: `{ messages: {role, content}[], mode: string }`
  - Prompt Gemini to extract topics as hierarchical MindmapTopic[] tree AND flashcards as {front, back}[] pairs
  - Return: `{ topics: MindmapTopic[], flashcards: Flashcard[] }`
  - Parse Gemini's JSON response safely (strip markdown code fences if present)

### Phase 4: Chat Interface Rewrite

- [ ] **Step 4.1:** Rewrite `src/features/study-room/components/ChatInterface.tsx`
  - Props: `{ notebookId: string, mode: "learn" | "solve" }`
  - On mount: if `notebookId === "new"`, create notebook via `createNotebook()` and update URL
  - If existing ID: load messages from `getNotebook(id).messages`
  - Replace dummy setTimeout with `fetch('/api/chat', { method: 'POST', body: ... })`
  - Show typing indicator (animated dots) while waiting for AI response
  - After each AI response: save messages via `addMessage()`
  - Auto-generate title from first user message (first 50 chars)
  - File upload handling:
    - PDF: use `pdfjs-dist` to extract text, store as `context` on notebook
    - Photo: convert to base64, send to Gemini as inline image data
    - Link: user pastes URL text, stored as context
  - Add "End Session & Save" button → calls `/api/extract` → saves topics + flashcards → redirects to notebook view

### Phase 5: Page Rewrites

- [ ] **Step 5.1:** Rewrite `src/app/(dashboard)/study-room/page.tsx` (Library)
  - Load notebooks from `getNotebooks()`
  - Sort by `updated_at` descending
  - Show real notebook cards (title, type badge, message count, date)
  - Delete notebook on hover (with confirmation)
  - "+ New Notebook" button → modal with Learn/Solve → navigate to `/study-room/learn/new` or `/study-room/solve/new`
  - Empty state: nice illustration + "Create your first notebook" CTA

- [ ] **Step 5.2:** Update `src/app/(dashboard)/study-room/learn/[id]/page.tsx`
  - Pass `notebookId={params.id}` and `mode="learn"` to ChatInterface
  - Use `"use client"` directive

- [ ] **Step 5.3:** Update `src/app/(dashboard)/study-room/solve/[id]/page.tsx`
  - Same as learn but `mode="solve"`

- [ ] **Step 5.4:** Rewrite `src/app/(dashboard)/study-room/notebook/[id]/page.tsx`
  - Load notebook from `getNotebook(params.id)`
  - 3 tabs: **Mindmap** | **Flashcards** | **Chat History**
  - Mindmap tab:
    - If `notebook.type === "learn"` → `<LearnMindmap topics={notebook.topics} title={notebook.title} />`
    - If `notebook.type === "solve"` → convert topics to `SocraticStep[]` format → `<SolveMindmap />`
    - Empty state if no topics extracted yet
  - Flashcards tab: `<FlashcardDeck cards={notebook.flashcards} />`
  - Chat History tab: scrollable read-only message list (reuse chat bubble styles from ChatInterface)
  - "Continue Chat" button → navigates to `/study-room/{type}/{id}`
  - "Re-extract Concepts" button → calls `/api/extract` again with current messages

### Phase 6: Polish

- [ ] **Step 6.1:** Update sidebar active state in `layout.tsx`
  - Change `pathname === "/study-room"` to `pathname.startsWith("/study-room")` so sub-pages highlight the nav item

- [ ] **Step 6.2:** Build verification
  ```bash
  cd /home/sunraku/Projects/Scaffold/apps/web && npm run build
  ```

---

## 11. Important Notes for Implementation

1. **DO NOT rewrite MindmapViewer.tsx or FlashcardDeck.tsx** — they are complete and working. Only feed them real data.

2. **Font pattern:** Task labels use `font-light` per user preference. Chat messages should use regular weight.

3. **The "new" ID pattern:** When user clicks "+ New Notebook" → Learn, navigate to `/study-room/learn/new`. The ChatInterface detects `id === "new"`, creates a real notebook, and should use `window.history.replaceState` to update the URL to the real ID without a page reload.

4. **Gemini model to use:** `gemini-2.0-flash` — fast and cheap, good for chat.

5. **JSON extraction from Gemini:** Gemini sometimes wraps JSON in markdown code fences. Always strip ```json and ``` before parsing.

6. **Error handling in API routes:** If `GEMINI_API_KEY` is not set, return a helpful error message telling the user to add it to `.env.local`.

7. **The layout sidebar** active state check at line 116 currently uses exact match `pathname === "/study-room"` — needs to be `pathname.startsWith("/study-room")` to keep the sidebar highlighted on sub-pages.

---

## 12. File Creation/Modification Summary

| Action | File Path |
|--------|-----------|
| **CREATE** | `src/app/api/chat/route.ts` |
| **CREATE** | `src/app/api/extract/route.ts` |
| **CREATE** | `src/features/study-room/lib/notebookStore.ts` |
| **MODIFY** | `src/features/study-room/types/index.ts` |
| **MODIFY** | `src/features/study-room/components/ChatInterface.tsx` |
| **MODIFY** | `src/app/(dashboard)/study-room/page.tsx` |
| **MODIFY** | `src/app/(dashboard)/study-room/learn/[id]/page.tsx` |
| **MODIFY** | `src/app/(dashboard)/study-room/solve/[id]/page.tsx` |
| **MODIFY** | `src/app/(dashboard)/study-room/notebook/[id]/page.tsx` |
| **MODIFY** | `src/app/(dashboard)/layout.tsx` (sidebar active state) |
| **MODIFY** | `apps/web/.env.local` (add GEMINI_API_KEY) |

All paths are relative to `/home/sunraku/Projects/Scaffold/apps/web/`.
