import { PrismaClient } from "@prisma/client";

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    return user;
  }

  async authenticateUser(userAddress: string, loginType: string) {
    const user = await this.prisma.user.findUnique({
      where: { address: userAddress },
    });
    return user;
  }

  async createUser(userAddress: string) {
    const user = await this.prisma.user.create({
      data: { address: userAddress },
    });
    return user;
  }
}       