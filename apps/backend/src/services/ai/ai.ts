import ApifyService from "../apify/apifiy";
import { generateObject, generateText } from 'ai';
import { object, z, ZodSchema } from 'zod';
import { createOpenRouter, openrouter } from '@openrouter/ai-sdk-provider';
import { ChatOllama } from "@langchain/ollama";
import { OpenAI } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";

interface LlmInputsGeneration {
    model: string;
    systemPrompt: string;
    prompt: string;
}

interface LlmInputsGenerationObject {
    model: string;
    systemPrompt: string;
    prompt: string;
    schema: z.ZodSchema;
}

export class AiService {
    private openRouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY!,
    });;


    private apifyService: ApifyService;
    public actorsApify: {
        [key: string]: string;
    } = {
            "twitter": "apidojo/tweet-scraper",
            "reddit-scraper": "afk-agent/reddit-scraper",
            "youtube-scraper": "afk-agent/youtube-scraper",
            "x-kaito": "kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest"
        }

    constructor() {
        this.apifyService = new ApifyService();
    }

    private initLocalLLM = (model?: string) => {
        const llm = new ChatOllama({
            baseUrl: "http://localhost:11434", // Ollama local server
            model: model || "llama3.2:1b", // or "mistral","llama3", etc.
            temperature: 0.3,
        });
        return llm;
    };

    private initPinecone = async () => {
        const pinecone = new Pinecone();
        return pinecone.index("test");
    }
    
    private initOpenAILangchain = async () => {
        const llm = new OpenAI({
            model: "gpt-3.5-turbo",
            apiKey: process.env.OPENAI_API_KEY,
            temperature: 0,
            
        });
        return llm;
    }
    private initLLMChatOpenAI = async () => {
        const llm = new ChatOpenAI({
            model: "gpt-4o-mini",
            temperature: 0,
            apiKey: process.env.OPENAI_API_KEY!,
            // reasoningEffort: "medium"
        });
        return llm;
    }

    // async generateObject(inputs: LlmInputsGenerationObject): Promise<{
    //     object: any,
    //     usage: any,
    // } | null | undefined> {
    //     try {
    //         const { object, usage } = await generateObject({
    //             model: openrouter(inputs.model),
    //             system: inputs.systemPrompt,
    //             schema: inputs?.schema as ZodSchema,
    //             mode: "json",
    //             prompt: inputs.prompt,
    //         });
    //         return {
    //             object: object,
    //             usage: usage,
    //         };
    //     } catch (error) {
    //         console.error(error);
    //         return null;
    //     }

    // }

    async generateTextLlm(inputs: LlmInputsGeneration): Promise<{ text: string, sources: any, usage: any } | null | undefined> {
        try {
            const { text, sources, usage } = await generateText({
                model: openrouter(inputs.model),
                system: inputs.systemPrompt,
                prompt: inputs.prompt,
            });
            return {
                text: text,
                sources: sources,
                usage: usage,
            };
        } catch (error) {
            console.error(error);
            return null;
        }
    }



}