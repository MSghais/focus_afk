import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getJwtToken } from '../lib/auth'; // adjust import as needed

interface WebSocketContextType {
  publicSocket: Socket | null;
  authedSocket: Socket | null;
  isPublicConnected: boolean;
  isAuthedConnected: boolean;
  error: Error | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  publicSocket: null,
  authedSocket: null,
  isPublicConnected: false,
  isAuthedConnected: false,
  error: null,
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPublicConnected, setIsPublicConnected] = useState(false);
  const [isAuthedConnected, setIsAuthedConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const publicSocketRef = useRef<Socket | null>(null);
  const authedSocketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'ws://localhost:5000';

    // Public socket (no auth)
    const publicSocket = io(backendUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    publicSocketRef.current = publicSocket;

    publicSocket.on('connect', () => {
      setIsPublicConnected(true);
      publicSocket.emit('connection'); // Custom event for public connection
    });
    publicSocket.on('disconnect', () => setIsPublicConnected(false));
    publicSocket.on('connect_error', (err) => {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('Public WebSocket error:', err);
    });

    // Authed socket (with JWT)
    const token = getJwtToken();
    let authedSocket: Socket | null = null;
    if (token) {
      authedSocket = io(backendUrl, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: { token },
      });
      authedSocketRef.current = authedSocket;

      authedSocket.on('connect', () => {
        setIsAuthedConnected(true);
        authedSocket!.emit('authed_connection'); // Custom event for authed connection
      });
      authedSocket.on('disconnect', () => setIsAuthedConnected(false));
      authedSocket.on('connect_error', (err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error('Authed WebSocket error:', err);
      });
    }

    return () => {
      publicSocket.disconnect();
      publicSocket.off();
      if (authedSocket) {
        authedSocket.disconnect();
        authedSocket.off();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        publicSocket: publicSocketRef.current,
        authedSocket: authedSocketRef.current,
        isPublicConnected,
        isAuthedConnected,
        error,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}; 