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

  // Message operations
  async createMessage(userId: string, messageData: any) {
    return this.prisma.message.create({
      data: {
        ...messageData,
        userId,
      },
    });
  }

  async getUserMessages(userId: string, options: { mentorId?: string; limit?: number; offset?: number } = {}) {
    const { mentorId, limit = 50, offset = 0 } = options;

    const whereClause: any = { userId };
    if (mentorId) {
      whereClause.mentorId = mentorId;
    }

    return this.prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
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
      },
    });
  }

  async saveChatMessages(userId: string, userMessage: string, assistantResponse: string, options: { mentorId?: string; model?: string } = {}) {
    const { mentorId, model } = options;

    // Save user message
    await this.prisma.message.create({
      data: {
        userId,
        mentorId,
        role: 'user',
        content: userMessage,
        model,
      },
    });

    // Save assistant response
    return this.prisma.message.create({
      data: {
        userId,
        mentorId,
        role: 'assistant',
        content: assistantResponse,
        model,
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