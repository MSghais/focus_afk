import { z } from 'zod';

// Source type validation schema
const noteSourceSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['text', 'link', 'youtube', 'google_drive', 'file', 'website']),
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  url: z.string().url().optional(),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  metadata: z.any().optional(),
});

// Zod schemas for TypeScript types
export const notesZodSchema = {
  createNotes: z.object({
    text: z.string().optional(),
    description: z.string().optional(),
    summary: z.string().optional(),
    topics: z.array(z.string()).optional(),
    sources: z.array(z.string()).optional(), // Keep for backward compatibility
    noteSources: z.array(noteSourceSchema).optional(), // New structured sources
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
    sources: z.array(z.string()).optional(), // Keep for backward compatibility
    noteSources: z.array(noteSourceSchema).optional(), // New structured sources
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

  chatAboutNotes: z.object({
    noteId: z.string(),
    prompt: z.string(),
    mentorId: z.string().optional(),
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
      noteSources: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { 
              type: 'string',
              enum: ['text', 'link', 'youtube', 'google_drive', 'file', 'website']
            },
            title: { type: 'string' },
            content: { type: 'string' },
            url: { type: 'string' },
            fileType: { type: 'string' },
            fileSize: { type: 'number' },
            metadata: { type: 'object' }
          },
          required: ['type', 'title']
        }
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

  chatAboutNotes: {
    type: 'object',
    properties: {
      noteId: { type: 'string' },
      prompt: { type: 'string' },
      mentorId: { type: 'string' },
    },
    required: ['noteId', 'prompt'],
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
      noteSources: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { 
              type: 'string',
              enum: ['text', 'link', 'youtube', 'google_drive', 'file', 'website']
            },
            title: { type: 'string' },
            content: { type: 'string' },
            url: { type: 'string' },
            fileType: { type: 'string' },
            fileSize: { type: 'number' },
            metadata: { type: 'object' }
          },
          required: ['type', 'title']
        }
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
export type ChatAboutNotesInput = z.infer<typeof notesZodSchema.chatAboutNotes>;
export type NoteSourceInput = z.infer<typeof noteSourceSchema>; 