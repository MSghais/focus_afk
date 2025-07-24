import { Server, Socket } from 'socket.io';
import { streamEvents, STREAM_EVENTS } from './index';
import jwt from 'jsonwebtoken';


export const setupWebSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      // Try to verify JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
        // jwt.verify can return either a string or JwtPayload, so we need to check
        if (typeof decoded === 'object' && decoded !== null) {
          socket.data.user = decoded;
          // JwtPayload may have an 'id' property, but it's not guaranteed by type
          // So we use optional chaining and fallback to 'unknown'
          console.log('Authenticated WebSocket user:', (decoded as any)?.id ?? 'unknown');
          // Handle authed streams/events
        } else {
          // If decoded is a string, treat as invalid for our purposes
          console.log('WebSocket auth failed: Invalid token payload');
          socket.disconnect(true);
        }
      } catch (err) {
      }
    } else {
      // No token: treat as public/unauthenticated
      console.log('Public WebSocket connection:', socket.id);
      // Handle public streams/events
    }
  });
  io.on('authed_connection', (socket: Socket) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      // Try to verify JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
        // jwt.verify can return either a string or JwtPayload, so we need to check
        if (typeof decoded === 'object' && decoded !== null) {
          socket.data.user = decoded;
          // JwtPayload may have an 'id' property, but it's not guaranteed by type
          // So we use optional chaining and fallback to 'unknown'
          console.log('Authenticated WebSocket user:', (decoded as any)?.id ?? 'unknown');
          // Handle authed streams/events
        } else {
          // If decoded is a string, treat as invalid for our purposes
          console.log('WebSocket auth failed: Invalid token payload');
          socket.disconnect(true);
        }
      } catch (err) {
      }
    } else {
      // No token: treat as public/unauthenticated
      console.log('Public WebSocket connection:', socket.id);
      // Handle public streams/events
    }
  });
  io.on('disconnect', (socket: Socket) => {
    console.log('Client disconnected:', socket.id);
  });
};
