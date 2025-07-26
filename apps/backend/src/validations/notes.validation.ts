import { z } from 'zod';

// Zod schemas for TypeScript types
export const notesZodSchema = {
  createNotes: z.object({
    name: z.string().min(1, 'Name is required'),
    role: z.string().default('personal_assistant'),
    knowledges: z.array(z.string()).min(1, 'At least one knowledge area is required'),
    about: z.string().optional(),
  }),

  updateNotes: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    role: z.string().optional(),
    knowledges: z.array(z.string()).optional(),
    about: z.string().optional(),
    isActive: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    metadata: z.any().optional(),
    personality: z.any().optional(),
    knowledge: z.any().optional(),
    imageUrl: z.string().optional(),
    sources: z.array(z.string()).optional(),
  }),

  createNote: z.object({
    mentorId: z.string().optional(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1, 'Content is required'),
    model: z.string().optional(),
    tokens: z.number().optional(),
    metadata: z.any().optional(),
  }),

  getNotes: z.object({
    mentorId: z.string().optional(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
  }),

  updateNote: z.object({
    accountName: z.string().min(1, 'Account name is required').optional(),
    accountAddress: z.string().optional(),
    accountDetails: z.any().optional(),
    isActive: z.boolean().optional(),
    balance: z.number().optional(),
    currency: z.string().optional(),
  }),
};

// JSON Schema for Fastify validation
export const notesSchema = {
  createNotes: {
    type: 'object',
    required: ['name', 'knowledges'],
    properties: {
      name: { type: 'string', minLength: 1 },
      role: { type: 'string', default: 'personal_assistant' },
      knowledges: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1
      },
      about: { type: 'string' },
    },
  },

  updateNotes: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      role: { type: 'string' },
      knowledges: {
        type: 'array',
        items: { type: 'string' }
      },
      about: { type: 'string' },
      isActive: { type: 'boolean' },
      isPublic: { type: 'boolean' },
      metadata: { type: 'object' },
      personality: { type: 'object' },
      knowledge: { type: 'object' },
      sources: { type: 'array', items: { type: 'string' } },
      imageUrl: { type: 'string' },
    },
  },

  createNote: {
    type: 'object',
    required: ['role', 'content'],
    properties: {
      mentorId: { type: 'string' },
      role: { type: 'string', enum: ['user', 'assistant', 'system'] },
      content: { type: 'string', minLength: 1 },
      model: { type: 'string' },
      tokens: { type: 'number' },
      metadata: { type: 'object' },
    },
  },

  getNotes: {
    type: 'object',
    properties: {
      mentorId: { type: 'string' },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
      offset: { type: 'number', minimum: 0, default: 0 },
    },
  },


  updateNote: {
    type: 'object',
    properties: {
      accountName: { type: 'string', minLength: 1 },
      accountAddress: { type: 'string' },
      accountDetails: { type: 'object' },
      isActive: { type: 'boolean' },
      balance: { type: 'number' },
      currency: { type: 'string' },
    },
  },
};

export type CreateNotesInput = z.infer<typeof notesZodSchema.createNotes>;
export type UpdateNotesInput = z.infer<typeof notesZodSchema.updateNotes>;
export type GetNotesInput = z.infer<typeof notesZodSchema.getNotes>;
export type CreateNoteInput = z.infer<typeof notesZodSchema.createNote>;
export type UpdateNoteInput = z.infer<typeof notesZodSchema.updateNote>; 