import type { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { pinata } from '../../services/pinata'; // Ensure this path is correct
import { DEFAULT_MODEL, LLM_FREE_MODELS_NAME, LLM_MODELS_NAME } from '../../config/models';
import { AiService } from '../../services/ai/ai';
dotenv.config();

async function mentorRoutes(fastify: FastifyInstance) {
  const aiService = new AiService();

  // Check if the plugin is already registered
  if (!fastify.hasContentTypeParser('multipart/form-data')) {
    fastify.register(fastifyMultipart);
  }


  // TODO: Add a middleware to check if the user is logged in
  // TODO check subscription of the user and credits
  // TODO use corressponding model for the user. Free model or paid model.
  // TODO stream text
  fastify.post('/chat', async (request, reply) => {
    try {
      const { prompt, model } = request.body as { prompt: string, model: string };


      console.log('prompt', prompt);
      console.log('model', model);

      if(!prompt) {
        return reply.code(400).send({ message: 'Prompt and model are required' });
      }

      const modelName = DEFAULT_MODEL;
      // const modelName = LLM_FREE_MODELS_NAME[model as keyof typeof LLM_FREE_MODELS_NAME] || LLM_MODELS_NAME[model as keyof typeof LLM_MODELS_NAME] || LLM_FREE_MODELS_NAME["GEMMA_3N_E2B_IT"];
      const response = await aiService.generateTextLlm({
        // systemPrompt: "You are a mentor that helps users with their goals and tasks. You are a helpful assistant.",
        model: modelName,
        prompt: prompt,
      });

      console.log('response', response);

      return reply.code(200).send({
        response,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });

  fastify.post('/my-mentor-file', async (request, reply) => {
    try {
      const data = await request.file();
      const fileBuffer = await data?.toBuffer();
      const fileName = data?.filename ?? '';
      const fileType = data?.mimetype ?? "jpg"

      if( !fileBuffer ) {
        return reply.code(400).send({ message: 'No file uploaded' });
      }

      const { IpfsHash } = await pinata.pinFileToIPFS(fileBuffer, {
        pinataMetadata: {
          name: fileName,
          type: fileType,
        },
      });

      return reply.code(200).send({
        hash: IpfsHash,
        url: `${process.env.IPFS_GATEWAY}/ipfs/${IpfsHash}`,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Internal Server Error' });
    }
  });
}

export default mentorRoutes;
