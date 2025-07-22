import { Signature, TypedData } from 'starknet';
import "fastify";
import { PrismaClient } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    jwt: {
      sign: (payload: object, options?: any) => string;
      verify: (token: string) => any;
    };
    authenticate: any;
  }
  interface FastifyRequest {
    user?: any;
  }
}

export interface UserJwtPayload {
  id: string;
  userAddress: string;
  iat?: number;
  exp?: number;
}

export interface SignatureVerificationRequest {
  accountAddress: string;
  signature: {
    r: string;
    s: string;
  };
  typedData?: any;
  message?: string;
}

/**
 * Twitter Types
 */
export enum SocialPlatform {
  TWITTER = 'TWITTER',
  NOSTR = 'NOSTR',
  // Add other platforms as needed
  // GITHUB = "GITHUB",
  // GOOGLE = "GOOGLE",
}
export interface TwitterUserDetails {
  id: string;
  username: string;
  name: string;
  picture?: string;
}

export interface ConnectTwitterParams {
  userId: string;
  code: string;
  codeVerifier: string;
}
