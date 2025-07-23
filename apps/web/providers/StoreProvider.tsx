'use client';

import { useEffect } from 'react';
import { initializeStore } from '../store/store';
import { useAuthStore } from '../store/auth';

interface StoreProviderProps {
  children: React.ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from localStorage first
    initializeAuth();
    
    // Initialize the store and database
    initializeStore().catch(console.error);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [initializeAuth]);

  return <>{children}</>;
} 