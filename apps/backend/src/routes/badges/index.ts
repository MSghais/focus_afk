import type { FastifyInstance } from 'fastify';
import { BadgeService } from '../../services/badge.service';
import { CronService } from '../../services/cron.service';

async function badgesRoutes(fastify: FastifyInstance) {
  const badgeService = new BadgeService(fastify.prisma);

  // Get all badges for a user
  fastify.get('/user/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const badges = await badgeService.getUserBadges(userId);
    return { success: true, badges };
  });

  // (Optional) Award daily connection badge for testing
  fastify.post('/user/:userId/daily', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const badge = await badgeService.awardDailyConnectionBadge(userId);
    return { success: true, badge };
  });

  // Trigger daily badge cron for all users (manual/cron)
  fastify.post('/cron/daily', async (request, reply) => {
    const cronService = new CronService(fastify.prisma);
    const result = await cronService.awardDailyConnectionBadgesForAllUsers();
    return { success: true, ...result };
  });
}

export default badgesRoutes;
