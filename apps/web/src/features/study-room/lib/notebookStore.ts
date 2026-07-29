import { StoredNotebook, NotebookType, Message, MindmapTopic, Flashcard } from '../types';

const STORAGE_KEY = 'scaffold_notebooks';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function getNotebooks(): StoredNotebook[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getNotebook(id: string): StoredNotebook | null {
  const notebooks = getNotebooks();
  return notebooks.find(n => n.id === id) || null;
}

export function createNotebook(type: NotebookType, title: string = 'New Notebook', context?: string): StoredNotebook {
  const notebooks = getNotebooks();
  const newNotebook: StoredNotebook = {
    id: generateId(),
    title,
    type,
    messages: [],
    topics: [],
    flashcards: [],
    context,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  notebooks.push(newNotebook);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notebooks));
  return newNotebook;
}

export function updateNotebook(id: string, updates: Partial<StoredNotebook>): void {
  const notebooks = getNotebooks();
  const index = notebooks.findIndex(n => n.id === id);
  if (index !== -1) {
    notebooks[index] = { 
      ...notebooks[index], 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notebooks));
  }
}

export function deleteNotebook(id: string): void {
  const notebooks = getNotebooks();
  const filtered = notebooks.filter(n => n.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function addMessage(notebookId: string, message: Message): void {
  const notebook = getNotebook(notebookId);
  if (notebook) {
    const messages = [...notebook.messages, message];
    // Auto-update title if it's the first user message and title is default
    let title = notebook.title;
    if (messages.length === 1 && message.role === 'user' && title === 'New Notebook') {
      title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
    }
    updateNotebook(notebookId, { messages, title });
  }
}

export function updateExtractedData(notebookId: string, topics: MindmapTopic[], flashcards: Flashcard[]): void {
  updateNotebook(notebookId, { topics, flashcards });
}
