import { Server, Socket } from 'socket.io';
import { streamEvents, STREAM_EVENTS } from './index';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AiService } from '../ai/ai';
import { generateDailyQuest } from './generate_quest';

const prisma = new PrismaClient();
const aiService = new AiService();

function isToday(date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export const setupWebSocket = (io: Server) => {
  io.on(STREAM_EVENTS.CONNECT, (socket: Socket) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      // Try to verify JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
        if (typeof decoded === 'object' && decoded !== null) {
          socket.data.user = decoded;
          // JwtPayload may have an 'id' property, but it's not guaranteed by type
          // So we use optional chaining and fallback to 'unknown'
          console.log('Authenticated WebSocket user:', (decoded as any)?.id ?? 'unknown');
          // Attach authed_connection handler to this socket
          socket.on('authed_connection', async () => {
            try {
              await generateDailyQuest(socket);
            } catch (err) {
              // ignore
            }
          });
          // Attach quest_of_the_day handler to this socket
          socket.on(STREAM_EVENTS.GENERATE_DAILY_QUEST, async () => {
            console.log('Quest of the day requested:', socket.id);
            try {
              await generateDailyQuest(socket);
            } catch (err) {
              // ignore
            }
          });
          // Attach ping-pong test handler
          socket.on('ping', () => {
            console.log('Received ping from client:', socket.id);
            socket.emit('pong');
            console.log('Sent pong to client:', socket.id);
          });
        }
      } catch (err) {
        // ignore
      }
    } else {
      // No token: treat as public/unauthenticated
      console.log('Public WebSocket connection:', socket.id);
      // Handle public streams/events
    }
  });
  io.on(STREAM_EVENTS.DISCONNECT, (socket: Socket) => {
    console.log('Client disconnected:', socket.id);
  });
  io.on(STREAM_EVENTS.GENERATE_DAILY_QUEST, async (socket: Socket) => {
    console.log('quest_of_the_day error:', socket.id);
    try {
      await generateDailyQuest(socket);
    } catch (err) {
      // ignore
    }
  }); 
};
