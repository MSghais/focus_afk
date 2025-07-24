import { EventEmitter } from 'events';

export const streamEvents = new EventEmitter();

// Increase max listeners if needed
streamEvents.setMaxListeners(20);

export const STREAM_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  MESSAGE: 'message',
  PING: 'ping',
  PONG: 'pong',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  STREAM_TEXT_LLM: 'stream_text_llm',
  STREAM_VOICE_LLM: 'stream_voice_llm',
  GENERATE_DAILY_QUEST: 'generate_daily_quest',
} as const;
