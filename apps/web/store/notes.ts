import { create } from 'zustand';
import { Note, Message, NoteSource } from '../types';
// import { Mentor, Message } from '@prisma/client';

interface NotesState {

  notes?: Note[];
  selectedNote?: Note;
  messages?: Message[];
  noteSources?: NoteSource[];
  selectedNoteSource?: NoteSource;
  setNotes: (notes: Note[]) => void;
  setSelectedNote: (selectedNote: Note | undefined) => void;
  setMessages: (messages: Message[]) => void;
  setNoteSources: (noteSources: NoteSource[]) => void;
  setSelectedNoteSource: (selectedNoteSource: NoteSource | undefined) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  selectedNote: undefined,
  messages: [],
  noteSources: [],
  selectedNoteSource: undefined,
  setNotes: (notes) => set({ notes }),
  setSelectedNote: (selectedNote) => set({ selectedNote: selectedNote || undefined }),
  setMessages: (messages) => set({ messages }),
  setNoteSources: (noteSources) => set({ noteSources }),
  setSelectedNoteSource: (selectedNoteSource) => set({ selectedNoteSource: selectedNoteSource || undefined }),
})); 