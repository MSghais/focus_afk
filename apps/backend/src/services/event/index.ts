import { EventEmitter } from 'events';

export const streamEvents = new EventEmitter();

// Increase max listeners if needed
streamEvents.setMaxListeners(20);

export const STREAM_EVENTS = {

} as const;
