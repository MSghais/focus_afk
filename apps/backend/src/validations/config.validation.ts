import { z } from 'zod';
// Define the schema for the configuration
export const ConfigSchema = z.object({
  jwt: z.object({
    secret: z.string().min(1, 'JWT secret is required'),
    accessTokenExpiry: z.string(),
    refreshTokenExpiry: z.string(),
  }),
  server: z.object({
    port: z.number().int().positive(),
    host: z.string(),
  }),

  rpc: z.object({
    starknetRpcUrl: z.string().min(1, 'RPC url required'),
    starknetNetwork: z.string().min(1, 'StarknetNetwork required'),
    api_key: z.string().min(1, 'Rpc apikey required'),
    network: z.string().min(1, 'Rpc network required'),
  }),
  
  // pinata: z.object({
  //   jwt: z.string(),
  //   ipfsGateway: z.string(),
  //   uploadGatewayUrl: z.string(),
  //   pinataSignUrl: z.string(),
  //   uploadUrl: z.string(),
  //   apiKey: z.string(),
  //   apiSecret: z.string(),
  //   apiUrl: z.string(),
  //   apiVersion: z.string(),
  //   apiTimeout: z.string(),
  // }),
});
