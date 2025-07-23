import type { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { pinata } from '../../services/pinata';
import { DEFAULT_MODEL, LLM_FREE_MODELS_NAME, LLM_MODELS_NAME } from '../../config/models';
import { AiService } from '../../services/ai/ai';
import { mentorSchema } from '../../validations/mentor.validation';
import type { CreateMentorInput, UpdateMentorInput, CreateMessageInput, GetMessagesInput, CreateFundingAccountInput, UpdateFundingAccountInput } from '../../validations/mentor.validation';
import { z } from 'zod';
import { MentorService } from '../../services/mentor/mentor.service';
dotenv.config();

async function fundingAccountRoutes(fastify: FastifyInstance) {
  const aiService = new AiService();
  const mentorService = new MentorService(fastify.prisma);

  // Check if the plugin is already registered
  if (!fastify.hasContentTypeParser('multipart/form-data')) {
    fastify.register(fastifyMultipart);
  }

  // Create a funding account
  fastify.post('/funding-accounts', {
    preHandler: [fastify.authenticate],
    schema: {
      body: mentorSchema.createFundingAccount,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const accountData = request.body as CreateFundingAccountInput;

      const fundingAccount = await fastify.prisma.fundingAccount.create({
        data: {
          ...accountData,
          userId,
        },
      });

      return reply.code(201).send(fundingAccount);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Get user's funding accounts
  fastify.get('/funding-accounts', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      const fundingAccounts = await fastify.prisma.fundingAccount.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      return reply.code(200).send(fundingAccounts);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Update a funding account
  fastify.put('/funding-accounts/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      body: mentorSchema.updateFundingAccount,
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const accountId = (request.params as { id: string }).id;
      const updateData = request.body as UpdateFundingAccountInput;

      const account = await fastify.prisma.fundingAccount.updateMany({
        where: { id: accountId, userId },
        data: updateData,
      });

      if (account.count === 0) {
        return reply.code(404).send({ message: 'Funding account not found' });
      }

      const updatedAccount = await fastify.prisma.fundingAccount.findUnique({
        where: { id: accountId },
      });

      return reply.code(200).send(updatedAccount);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  // Delete a funding account (soft delete)
  fastify.delete('/funding-accounts/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const accountId = (request.params as { id: string }).id;

      const account = await fastify.prisma.fundingAccount.updateMany({
        where: { id: accountId, userId },
        data: { isActive: false },
      });

      if (account.count === 0) {
        return reply.code(404).send({ message: 'Funding account not found' });
      }

      return reply.code(200).send({ message: 'Funding account deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

}

export default fundingAccountRoutes;
