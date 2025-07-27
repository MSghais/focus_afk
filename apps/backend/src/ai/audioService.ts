import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { MemoryManager } from './memory/memoryManager';
import { PrismaClient } from '@prisma/client';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import 'dotenv/config';
const elevenlabs = new ElevenLabsClient();

export enum AudioServiceModel {
  OPENAI_TTS = 'openai/tts',
  GOOGLE_TTS = 'google/tts',
  AZURE_TTS = 'azure/tts',
}

interface AudioServiceInputs {
  model: string;
  systemPrompt?: string;
  prompt: string;
  userId: string;
  mentorId?: string;
  sessionId?: string;
  enableMemory?: boolean;
  contextSources?: ('tasks' | 'goals' | 'sessions' | 'profile' | 'mentor' | 'badges' | 'quests' | 'settings')[];
  includeHistory?: boolean;
}


export class AudioService {
  private openRouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });

  private elevenlabs = new ElevenLabsClient();
  public memoryManager: MemoryManager;

  constructor(prisma: PrismaClient) {
    this.memoryManager = new MemoryManager(prisma, {
      maxMessages: 50,
      maxContextSize: 1024 * 1024, // 1MB
      retentionPeriod: 24, // 24 hours
      enableCompression: true,
      contextSources: ['tasks', 'goals', 'sessions', 'profile', 'mentor', 'badges', 'quests', 'settings'],
      maxItemsPerSource: 10
    });
  }

  async generateAudio(inputs: AudioServiceInputs): Promise<ReadableStream<Uint8Array> | undefined> {

    try {
      const { model, systemPrompt, prompt, userId, mentorId, sessionId, enableMemory, contextSources, includeHistory } = inputs;

      if (!prompt) {
        return undefined;
      }

      let promptGeneration = `
      Summarize under 100 words or 1000 characters it:  
      You are a helpful assistant that generates audio summaries of notes.
      ${prompt}
      `

      const audio = await elevenlabs.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
        text: promptGeneration,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
      });

      if (!audio) {
        return undefined;
      }

      return audio;
    } catch (error) {
      console.error('Error generating audio:', error);
      return undefined;
    }
  }


  async createAudioStreamFromText(text: string): Promise<Buffer | undefined> {
    try {
      const audioStream = await elevenlabs.textToSpeech.stream('JBFqnCBsd6RMkjVDRZzb', {
        modelId: 'eleven_multilingual_v2',
        text,
        outputFormat: 'mp3_44100_128',
        // Optional voice settings that allow you to customize the output
        voiceSettings: {
          stability: 0,
          similarityBoost: 1.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      });
      if (!audioStream) {
        return undefined;
      }
      const chunks: Buffer[] = [];
      const reader = audioStream.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          // value is Uint8Array, convert to Buffer
          chunks.push(Buffer.from(value));
        }
      }
      const content = Buffer.concat(chunks);
      return content;
    } catch (error) {
      console.error('Error creating audio stream:', error);
      return undefined;
    }
  };

}