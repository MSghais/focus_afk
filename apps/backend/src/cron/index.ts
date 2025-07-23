import { FastifyInstance } from "fastify";
import { CronService } from "../services/cron.service";

export const initCron = (fastify: FastifyInstance) => {
  const cronService = new CronService(fastify.prisma);
  cronService.awardDailyConnectionBadgesForAllUsers();
  // Run every day at 12:00 AM
 
  setInterval(async () => {
    await cronService.awardDailyConnectionBadgesForAllUsers();
  }, 1000 * 60 * 60 * 24);
};