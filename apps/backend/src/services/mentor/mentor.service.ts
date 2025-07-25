import { PrismaClient } from '@prisma/client';

export class MentorService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Mentor operations
  async createMentor(userId: string, mentorData: any) {
    return this.prisma.mentor.create({
      data: {
        ...mentorData,
        userId,
      },
    });
  }

  async getUserMentors(userId: string) {
    return this.prisma.mentor.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMentor(userId: string, mentorId: string, updateData: any) {
    const result = await this.prisma.mentor.updateMany({
      where: { id: mentorId, userId },
      data: updateData,
    });

    if (result.count === 0) {
      throw new Error('Mentor not found');
    }

    return this.prisma.mentor.findUnique({
      where: { id: mentorId },
    });
  }

  async deleteMentor(userId: string, mentorId: string) {
    const result = await this.prisma.mentor.updateMany({
      where: { id: mentorId, userId },
      data: { isActive: false },
    });

    if (result.count === 0) {
      throw new Error('Mentor not found');
    }

    return { message: 'Mentor deleted successfully' };
  }

  // Message operations (legacy - for standalone messages)
  async createStandaloneMessage(userId: string, messageData: any) {
    return this.prisma.message.create({
      data: {
        ...messageData,
        user: {
          connect: { id: userId }
        },
        // chatId is null for standalone messages
      },
    });
  }

  async getStandaloneMessages(userId: string, options: { limit?: number; offset?: number } = {}) {
    const { limit = 50, offset = 0 } = options;

    return this.prisma.message.findMany({
      where: {
        chatId: null, // Only standalone messages
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async saveStandaloneMessages(userId: string, userMessage: string, assistantResponse: string, options: { model?: string; metadata?: any } = {}) {
    const { model, metadata } = options;

    // Save user message
    await this.prisma.message.create({
      data: {
        role: 'user',
        content: userMessage,
        model,
        metadata,
        user: {
          connect: { id: userId }
        },
      },
    });

    // Save assistant response
    return this.prisma.message.create({
      data: {
        role: 'assistant',
        content: assistantResponse,
        model,
        metadata,
        user: {
          connect: { id: userId }
        },
      },
    });
  }

  // Funding account operations
  async createFundingAccount(userId: string, accountData: any) {
    return this.prisma.fundingAccount.create({
      data: {
        ...accountData,
        userId,
      },
    });
  }

  async getUserFundingAccounts(userId: string) {
    return this.prisma.fundingAccount.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateFundingAccount(userId: string, accountId: string, updateData: any) {
    const result = await this.prisma.fundingAccount.updateMany({
      where: { id: accountId, userId },
      data: updateData,
    });

    if (result.count === 0) {
      throw new Error('Funding account not found');
    }

    return this.prisma.fundingAccount.findUnique({
      where: { id: accountId },
    });
  }

  async deleteFundingAccount(userId: string, accountId: string) {
    const result = await this.prisma.fundingAccount.updateMany({
      where: { id: accountId, userId },
      data: { isActive: false },
    });

    if (result.count === 0) {
      throw new Error('Funding account not found');
    }

    return { message: 'Funding account deleted successfully' };
  }
} 