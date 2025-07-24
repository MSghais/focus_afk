import { Server, Socket } from 'socket.io';
import { streamEvents, STREAM_EVENTS } from './index';


export const setupWebSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

  });
  io.on('disconnect', (socket: Socket) => {
    console.log('Client disconnected:', socket.id);
  });
};
