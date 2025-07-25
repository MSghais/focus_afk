import { PrismaClient } from '@prisma/client';

export class ChatService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create a new chat
  async createChat(userId: string, chatData: {
    mentorId?: string;
    title?: string;
    metadata?: any;
  }) {
    return this.prisma.chat.create({
      data: {
        userId,
        ...chatData,
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  // Get user's chats
  async getUserChats(userId: string, options: {
    mentorId?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const { mentorId, isActive = true, limit = 50, offset = 0 } = options;

    const whereClause: any = { userId, isActive };
    if (mentorId) {
      whereClause.mentorId = mentorId;
    }

    return this.prisma.chat.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get only the latest message for preview
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });
  }

  // Get a specific chat with all messages
  async getChat(chatId: string, userId: string) {
    return this.prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  // Update chat
  async updateChat(chatId: string, userId: string, updateData: {
    title?: string;
    isActive?: boolean;
    metadata?: any;
  }) {
    const result = await this.prisma.chat.updateMany({
      where: { id: chatId, userId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new Error('Chat not found');
    }

    return this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  // Delete chat (soft delete)
  async deleteChat(chatId: string, userId: string) {
    const result = await this.prisma.chat.updateMany({
      where: { id: chatId, userId },
      data: { isActive: false },
    });

    if (result.count === 0) {
      throw new Error('Chat not found');
    }

    return { message: 'Chat deleted successfully' };
  }

  // Create a message in a chat
  async createMessage(chatId: string, userId: string, messageData: {
    role: string;
    content: string;
    prompt?: string;
    model?: string;
    tokens?: number;
    metadata?: any;
    taskId?: string;
  }) {
    return this.prisma.message.create({
      data: {
        chat: {
          connect: { id: chatId }
        },
        user: {
          connect: { id: userId }
        },
        ...messageData,
      },
    });
  }

  // Create a standalone message (not linked to any chat)
  async createStandaloneMessage(userId: string, messageData: {
    role: string;
    content: string;
    prompt?: string;
    model?: string;
    tokens?: number;
    metadata?: any;
    taskId?: string;
  }) {
    return this.prisma.message.create({
      data: {
        user: {
          connect: { id: userId }
        },
        ...messageData,
      },
    });
  }

  // Get messages for a chat
  async getChatMessages(chatId: string, userId: string, options: {
    limit?: number;
    offset?: number;
  } = {}) {
    const { limit = 50, offset = 0 } = options;

    // Verify the chat belongs to the user
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });
  }

  // Save a conversation (user message + assistant response) to a chat
  async saveConversation(
    chatId: string,
    userId: string,
    userMessage: string,
    assistantResponse: string,
    options: {
      model?: string;
      tokens?: number;
      metadata?: any;
      taskId?: string;
    } = {}
  ) {
    const { model, tokens, metadata, taskId } = options;

    // Save user message
    const userMsg = await this.prisma.message.create({
      data: {
        chat: {
          connect: { id: chatId }
        },
        user: {
          connect: { id: userId }
        },
        role: 'user',
        content: userMessage,
        model,
        metadata,
        taskId,
      },
    });

    // Save assistant response
    const assistantMsg = await this.prisma.message.create({
      data: {
        chat: {
          connect: { id: chatId }
        },
        user: {
          connect: { id: userId }
        },
        role: 'assistant',
        content: assistantResponse,
        model,
        tokens,
        metadata,
        taskId,
      },
    });

    // Update chat's updatedAt timestamp
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return {
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    };
  }

  // Get or create a chat for a mentor
  async getOrCreateMentorChat(userId: string, mentorId: string, title?: string) {
    // Try to find an existing active chat for this mentor
    let chat = await this.prisma.chat.findFirst({
      where: {
        userId,
        mentorId,
        isActive: true,
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // If no chat exists, create a new one
    if (!chat) {
      chat = await this.createChat(userId, {
        mentorId,
        title: title || `Chat with ${mentorId}`,
      });
    }

    return chat;
  }

  // Get chat statistics
  async getChatStats(userId: string) {
    const totalChats = await this.prisma.chat.count({
      where: { userId, isActive: true },
    });

    const totalMessages = await this.prisma.message.count({
      where: {
        chat: {
          userId,
          isActive: true,
        },
      },
    });

    const mentorChats = await this.prisma.chat.count({
      where: {
        userId,
        isActive: true,
        mentorId: { not: null },
      },
    });

    const standaloneChats = await this.prisma.chat.count({
      where: {
        userId,
        isActive: true,
        mentorId: null,
      },
    });

    return {
      totalChats,
      totalMessages,
      mentorChats,
      standaloneChats,
    };
  }
} 