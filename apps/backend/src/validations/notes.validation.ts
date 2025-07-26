import { z } from 'zod';

// Zod schemas for TypeScript types
export const notesZodSchema = {
  createNotes: z.object({
    text: z.string().optional(),
    description: z.string().optional(),
    summary: z.string().optional(),
    topics: z.array(z.string()).optional(),
    sources: z.array(z.string()).optional(),
    aiSources: z.array(z.string()).optional(),
    aiTopics: z.array(z.string()).optional(),
    metadata: z.any().optional(),
    aiSummary: z.string().optional(),
    type: z.string().optional(), // 'user' or 'ai'
    difficulty: z.number().optional(),
    requirements: z.array(z.string()).optional(),
  }),

  updateNotes: z.object({
    text: z.string().optional(),
    description: z.string().optional(),
    summary: z.string().optional(),
    topics: z.array(z.string()).optional(),
    sources: z.array(z.string()).optional(),
    aiSources: z.array(z.string()).optional(),
    aiTopics: z.array(z.string()).optional(),
    metadata: z.any().optional(),
    aiSummary: z.string().optional(),
    type: z.string().optional(),
    difficulty: z.number().optional(),
    requirements: z.array(z.string()).optional(),
  }),

  getNotes: z.object({
    type: z.string().optional(), // 'user' or 'ai'
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
  }),

  getSources: z.object({
    type: z.string().optional(), // 'user' or 'ai'
  }),
};

// JSON Schema for Fastify validation
export const notesSchema = {
  createNotes: {
    type: 'object',
    properties: {
      text: { type: 'string' },
      description: { type: 'string' },
      summary: { type: 'string' },
      topics: {
        type: 'array',
        items: { type: 'string' }
      },
      sources: {
        type: 'array',
        items: { type: 'string' }
      },
      aiSources: {
        type: 'array',
        items: { type: 'string' }
      },
      aiTopics: {
        type: 'array',
        items: { type: 'string' }
      },
      metadata: { type: 'object' },
      aiSummary: { type: 'string' },
      type: { type: 'string' },
      difficulty: { type: 'number' },
      requirements: {
        type: 'array',
        items: { type: 'string' }
      },
    },
  },

  updateNotes: {
    type: 'object',
    properties: {
      text: { type: 'string' },
      description: { type: 'string' },
      summary: { type: 'string' },
      topics: {
        type: 'array',
        items: { type: 'string' }
      },
      sources: {
        type: 'array',
        items: { type: 'string' }
      },
      aiSources: {
        type: 'array',
        items: { type: 'string' }
      },
      aiTopics: {
        type: 'array',
        items: { type: 'string' }
      },
      metadata: { type: 'object' },
      aiSummary: { type: 'string' },
      type: { type: 'string' },
      difficulty: { type: 'number' },
      requirements: {
        type: 'array',
        items: { type: 'string' }
      },
    },
  },

  getNotes: {
    type: 'object',
    properties: {
      type: { type: 'string' },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
      offset: { type: 'number', minimum: 0, default: 0 },
    },
  },

  getSources: {
    type: 'object',
    properties: {
      type: { type: 'string' },
    },
  },
};

export type CreateNotesInput = z.infer<typeof notesZodSchema.createNotes>;
export type UpdateNotesInput = z.infer<typeof notesZodSchema.updateNotes>;
export type GetNotesInput = z.infer<typeof notesZodSchema.getNotes>;
export type GetSourcesInput = z.infer<typeof notesZodSchema.getSources>; 