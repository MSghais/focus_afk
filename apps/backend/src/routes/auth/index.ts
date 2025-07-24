import { FastifyInstance } from 'fastify';
import { LoginInput, RefreshTokenInput } from '../../validations/auth.validation';
import { SignatureService } from '../../services/auth/signature.service';
import { AuthService } from '../../services/auth/auth.service';
import { ethers } from "ethers";
import { ec } from 'starknet';
import { BadgeService } from '../../services/badge.service';

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(fastify.prisma);
  const signatureService = new SignatureService();
  const badgeService = new BadgeService(fastify.prisma);

  // // Specific OPTIONS handler for auth routes
  // fastify.options('/evm-login', async (request, reply) => {
  //   console.log('🔐 Auth OPTIONS - evm-login endpoint');
  //   console.log('🔐 Auth OPTIONS - Origin:', request.headers.origin);
    
  //   reply.header('Access-Control-Allow-Origin', request.headers.origin || '*');
  //   reply.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  //   reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  //   reply.header('Access-Control-Allow-Credentials', 'true');
  //   reply.header('Access-Control-Max-Age', '86400');
    
  //   return reply.send();
  // });

  fastify.post<{ Body: LoginInput }>(
    '/auth',
    {
      schema: {
        body: {
          type: 'object',
          required: ['userAddress', 'loginType', 'signature', 'signedData'],
          properties: {
            userAddress: { type: 'string' },
            loginType: { type: 'string' },
            signature: { type: 'object' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { userAddress, loginType, signature, signedData } = request.body;

        const sig = await signatureService.verifySignature({
          accountAddress: userAddress,
          signature: signature as any,
          signedData: JSON.parse(signedData),
        });

        if (!sig) {
          return reply.code(400).send({ message: 'Invalid Signature' });
        }

          // const result = await authService.loginOrCreateUser(userAddress, loginType);
        return { success: true, data: undefined };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );

  fastify.post<{ Body: RefreshTokenInput }>('/refresh-token', async (request, reply) => {
    try {
      const { refreshToken } = request.body;
      // Check if `refreshToken` exists and is not empty
      if (!refreshToken) {
        return reply.code(400).send({ message: 'Refresh Token is required' });
      }
      // const result = await authService.refreshAccessToken(refreshToken);
      return { success: true, data: undefined };
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(401).send({ message: error.message });
      }
      return reply.code(401).send({ message: 'Invalid refresh token' });
    }
  });

  fastify.post('/evm-login', async (request, reply) => {
    try {
      const { address, signature, message } = request.body as { address: string, signature: string, message: string };

      console.log("address", address);
      console.log("signature", signature);
      console.log("message", message);
      // 1. Verify signature
      const recovered = ethers.verifyMessage(message, signature);
      console.log("recovered", recovered);
      if (recovered.toLowerCase() !== address.toLowerCase()) {
        return reply.code(401).send({ error: 'Invalid signature' });
      }

      // 2. Upsert user
      const user = await fastify.prisma.user.upsert({
        where: { userAddress: address.toLowerCase() },
        update: { evmAddress: address.toLowerCase(), loginType: "ethereum" },
        create: {
          userAddress: address.toLowerCase(),
          evmAddress: address.toLowerCase(),
          loginType: "ethereum",
        },
      });
      console.log("user", user);

      try {
        const mentor = await fastify.prisma.mentor.findFirst({
          where: {
            userId: user.id,
            // accountEvmAddress: address.toLowerCase(),
          },
        });
        if (!mentor) {
          await fastify.prisma.mentor.create({
            data: {
              userId: user.id,
              // accountEvmAddress: address?.toLowerCase() || "" ,
              isActive: true,
              name: `Mentor ${address?.toLowerCase() || ""}`,
            },
          });
        }
        console.log("mentor", mentor);
      } catch (error) {
        console.log("error", error);
      }

      // 3. Create JWT
      const token = fastify.jwt.sign({ id: user.id, userAddress: user.userAddress });


      const sessionToken = await fastify.prisma.session.create({
        data: {
          userId: user.id,
          token: token,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
      });
      console.log("token", token);
      return reply.send({ success: true, user, token });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });


  fastify.post('/starknet-login', async (request, reply) => {
    try {
      const { address, signature, message } = request.body as { address: string, signature: string, message: string };

      console.log("address", address);
      console.log("signature", signature);
      console.log("message", message);
      // 1. Verify signature
      const isVerified =  ec.starkCurve.verify(message, signature, address);
      console.log("isVerified", isVerified);
      if (!isVerified) {
        return reply.code(401).send({ error: 'Invalid signature' });
      }

      // 2. Upsert user
      const user = await fastify.prisma.user.upsert({
        where: { userAddress: address.toLowerCase() },
        update: { starknetAddress: address.toLowerCase(), loginType: "starknet" },
        create: {
          userAddress: address.toLowerCase(),
          starknetAddress: address.toLowerCase(),
          loginType: "starknet",
        },
      });
      console.log("user", user);

      // Award daily connection badge
      badgeService.awardDailyConnectionBadge(user.id);

      // 3. Create JWT
      const token = fastify.jwt.sign({ id: user.id, userAddress: user.userAddress });

      console.log("token", token);
      return reply.send({ success: true, user, token });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get(
    '/me',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const user = await authService.getUserProfile(request.user.id);
        return { success: true, data: { user } };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Internal server error' });
      }
    },
  );
}
