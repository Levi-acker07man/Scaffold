import { ChatInterface } from "@/features/study-room/components/ChatInterface";

export default function LearnModePage({ params }: { params: { id: string } }) {
  return (
    <div className="h-[calc(100vh-8rem)] w-full max-w-5xl mx-auto">
      <ChatInterface notebookId={params.id} mode="learn" />
    </div>
  );
}
