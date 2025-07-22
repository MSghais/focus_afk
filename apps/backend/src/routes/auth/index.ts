import { FastifyInstance } from 'fastify';
import { LoginInput, RefreshTokenInput } from '../../validations/auth.validation';
import { SignatureService } from '../../services/auth/signature.service';
import { AuthService } from '../../services/auth/auth.service';
import { ethers } from "ethers";

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(fastify.prisma);
  const signatureService = new SignatureService();

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
