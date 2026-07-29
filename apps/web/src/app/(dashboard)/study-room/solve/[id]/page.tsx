"use client";

import { ChatInterface } from "@/features/study-room/components/ChatInterface";

export default function SolveModePage({ params }: { params: { id: string } }) {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto min-h-0 -mb-8">
      <ChatInterface notebookId={params.id} mode="solve" />
    </div>
  );
}
