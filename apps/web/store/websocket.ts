import { create } from 'zustand';
import { User } from '@prisma/client';
import { initializeAuthFromStorage, saveAuthToStorage, clearAuthFromStorage } from '../lib/auth';

interface WebSocketState {

  userConnected?: User;
  token?: string;
  jwtToken?: string;
  evmAddress?: string;
  starknetAddress?: string;
  loginType?: "ethereum" | "starknet";
  isAuthenticated: boolean;
  setUserConnected: (user: User) => void;
  setToken: (token: string) => void;
  setJwtToken: (token: string) => void;
  setEvmAddress: (address: string) => void;
  setStarknetAddress: (address: string) => void;
  setLoginType: (type: "ethereum" | "starknet") => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  initializeAuth: () => void;
  logout: () => void;

  // WebSocket
  questOfTheDay?: any;
  setQuestOfTheDay: (quest: any) => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  userConnected: undefined,
  token: undefined,
  jwtToken: undefined,
  evmAddress: undefined,
  starknetAddress: undefined,
  loginType: undefined,
  isAuthenticated: false,
  setUserConnected: (user) => set({ userConnected: user }),
  setToken: (token) => set({ token }),
  setJwtToken: (token) => set({ jwtToken: token }),
  setEvmAddress: (address) => set({ evmAddress: address }),
  setStarknetAddress: (address) => set({ starknetAddress: address }),
  setLoginType: (type) => set({ loginType: type }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  // Initialize auth state from localStorage
  initializeAuth: () => {
    initializeAuthFromStorage();
  },

  // Logout and clear all auth data
  logout: () => {
    clearAuthFromStorage();
    set({
      userConnected: undefined,
      token: undefined,
      jwtToken: undefined,
      evmAddress: undefined,
      starknetAddress: undefined,
      loginType: undefined,
      isAuthenticated: false,
    });
  },

  // WebSocket
  questOfTheDay: undefined,
  setQuestOfTheDay: (quest: any) => set({ questOfTheDay: quest }),
})); 