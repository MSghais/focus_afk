import { create } from 'zustand';
import { User } from '@prisma/client';

  interface AuthState {
  
  userConnected?: User;
  token?: string;
  jwtToken?: string;
  evmAddress?: string;
  starknetAddress?: string;
  loginType?: "ethereum" | "starknet";
  setUserConnected: (user: User) => void;
  setToken: (token: string) => void;
  setJwtToken: (token: string) => void;
  setEvmAddress: (address: string) => void;
  setStarknetAddress: (address: string) => void;
  setLoginType: (type: "ethereum" | "starknet") => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userConnected: undefined,
  token: undefined,
  jwtToken: undefined,
  evmAddress: undefined,
  starknetAddress: undefined,
  loginType: undefined,
  setUserConnected: (user) => set({ userConnected: user }),
  setToken: (token) => set({ token }),
  setJwtToken: (token) => set({ jwtToken: token }),
  setEvmAddress: (address) => set({ evmAddress: address }),
  setStarknetAddress: (address) => set({ starknetAddress: address }),
  setLoginType: (type) => set({ loginType: type }),
})); 