import { create } from 'zustand';
import { Mentor, Message } from '../types';
// import { Mentor, Message } from '@prisma/client';

interface MentorsState {

  mentors?: Mentor[];
  selectedMentor?: Mentor;
  messages?: Message[];
  setMentors: (mentors: Mentor[]) => void;
  setSelectedMentor: (selectedMentor: Mentor | undefined) => void;
  setMessages: (messages: Message[]) => void;
}

export const useMentorsStore = create<MentorsState>((set, get) => ({
  mentors: [],
  selectedMentor: undefined,
  messages: [],
  setMentors: (mentors) => set({ mentors }),
  setSelectedMentor: (selectedMentor) => set({ selectedMentor: selectedMentor || undefined }),
  setMessages: (messages) => set({ messages }),
})); 