import { PrismaClient } from "@prisma/client";

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        userAddress: true,
        loginType: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async authenticateUser(userAddress: string, loginType: string) {
    const user = await this.prisma.user.findUnique({
      where: { userAddress: userAddress },
    });
    return user;
  }

  async createUser(userAddress: string, loginType: string) {
    const user = await this.prisma.user.create({
      data: { userAddress: userAddress, loginType: loginType },
    });
    return user;
  }
}       