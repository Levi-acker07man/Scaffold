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

export interface MindmapNode {
  id: string;
  notebook_id: string;
  label: string;
  type: string;
  parent_id?: string | null;
  position_x?: number;
  position_y?: number;
}

export interface MindmapEdge {
  id: string;
  notebook_id: string;
  source_id: string;
  target_id: string;
  label?: string;
}

export interface Flashcard {
  id: string;
  notebook_id: string;
  front: string;
  back: string;
  created_at: string;
}
