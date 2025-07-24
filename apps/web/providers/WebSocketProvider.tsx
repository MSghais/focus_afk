import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Define the shape of the context
interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: Error | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  error: null,
});

export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Use env variable or fallback to localhost
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'ws://localhost:5000';
    let didUnmount = false;
    let socket: Socket | null = null;
    try {
      socket = io(backendUrl, {
        withCredentials: true,
        transports: ['websocket'],
        autoConnect: true, // ensure auto connect
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;

      const onConnect = () => {
        if (!didUnmount) setIsConnected(true);
      };
      const onDisconnect = () => {
        if (!didUnmount) setIsConnected(false);
      };
      const onError = (err: any) => {
        if (!didUnmount) {
          setError(err instanceof Error ? err : new Error(String(err)));
          // Log but do not throw
          console.error('WebSocket connection error:', err);
        }
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('connect_error', onError);
      socket.on('error', onError);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('WebSocket connection error:', err);
    }

    // Clean up on unmount
    return () => {
      didUnmount = true;
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('error');
        socket.disconnect();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket: socketRef.current, isConnected, error }}>
      {children}
    </WebSocketContext.Provider>
  );
}; 