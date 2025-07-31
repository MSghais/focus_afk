import { PrismaClient } from "@prisma/client";
import { GamificationService } from "../gamification.service";

export class AuthService {
  private gamificationService?: GamificationService;

  constructor(
    private readonly prisma: PrismaClient,
    gamificationService?: GamificationService
  ) {
    this.gamificationService = gamificationService;
  }

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
        soulboundToken: true,
      },
    });
    return user;
  }

  async authenticateUser(userAddress: string, loginType: string) {
 
    try {
      const user = await this.prisma.user.findUnique({
        where: { userAddress: userAddress },
      });
      // Mint SBT for new user in background (non-blocking)
      if (user?.id && this.gamificationService && !user.soulboundToken) {
        setImmediate(async () => {
          try {
            await this.gamificationService!.mintSBTForNewUser(userAddress, user?.id);
            await this.gamificationService!.generateQuestsForUser(user?.id);
          } catch (error) {
            console.error("Background SBT minting failed:", error);
          }
        });
      }
      return user;
    } catch (error) {
      console.error("Background SBT minting failed:", error);
      return null;
    }
  }

  async createUser(userAddress: string, loginType: string) {
    const user = await this.prisma.user.create({
      data: { userAddress: userAddress, loginType: loginType },
    });

    // Mint SBT for new user in background (non-blocking)
    if (this.gamificationService) {
      setImmediate(async () => {
        try {
          await this.gamificationService!.mintSBTForNewUser(userAddress, user.id);
          await this.gamificationService!.generateQuestsForUser(user.id);
        } catch (error) {
          console.error("Background SBT minting failed:", error);
        }
      });
    }

    return user;
  }
}       