import type { FastifyInstance } from 'fastify';
import { ExaService } from '../../services/exa-js';

interface ScrapeWebsiteRequest {
  url: string;
  noteId?: string;
  maxCharacters?: number;
  highlightQuery?: string;
  numSentences?: number;
}

interface AnalyzeSourceRequest {
  sourceId: string;
  analysisType: 'summary' | 'key_points' | 'questions' | 'insights';
}

async function sourceAgentRoutes(fastify: FastifyInstance) {
  const exaService = new ExaService();

  // Scrape website content using exa-js
  fastify.post('/scrape-website', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', format: 'uri' },
          noteId: { type: 'string' },
          maxCharacters: { type: 'number', default: 2000 },
          highlightQuery: { type: 'string' },
          numSentences: { type: 'number', default: 3 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { url, noteId, maxCharacters, highlightQuery, numSentences } = request.body as ScrapeWebsiteRequest;

      // Scrape the website content
      const scrapedContent = await exaService.getContentsWithOptions([url], {
        maxCharacters: maxCharacters || 2000,
        highlightQuery: highlightQuery || 'AI, technology, productivity',
        numSentences: numSentences || 3
      });

      if (!scrapedContent || !scrapedContent.results || scrapedContent.results.length === 0) {
        return reply.code(404).send({ 
          success: false, 
          message: 'Could not scrape content from the provided URL' 
        });
      }

      const result = scrapedContent.results[0];
      
      // Create a structured source object
      const sourceData = {
        type: 'website' as const,
        title: result.title || 'Scraped Website',
        content: result.text || '',
        url: url,
        metadata: {
          scrapedAt: new Date().toISOString(),
          originalTitle: result.title,
          highlights: result.highlights || [],
          wordCount: result.text?.split(' ').length || 0,
          scrapedBy: 'exa-js'
        }
      };

      // If noteId is provided, save the source to the note
      if (noteId) {
        const note = await fastify.prisma.notes.findFirst({
          where: { id: noteId, userId }
        });

        if (!note) {
          return reply.code(404).send({ 
            success: false, 
            message: 'Note not found' 
          });
        }

        const savedSource = await fastify.prisma.noteSources.create({
          data: {
            noteId,
            ...sourceData
          }
        });

        return reply.code(200).send({
          success: true,
          data: {
            source: savedSource,
            scrapedContent: result
          }
        });
      }

      // Return just the scraped content if no noteId provided
      return reply.code(200).send({
        success: true,
        data: {
          source: sourceData,
          scrapedContent: result
        }
      });

    } catch (error) {
      fastify.log.error('Error scraping website:', error);
      return reply.code(500).send({ 
        success: false, 
        message: 'Failed to scrape website content',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Analyze a source using AI
  fastify.post('/analyze-source', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['sourceId', 'analysisType'],
        properties: {
          sourceId: { type: 'string' },
          analysisType: { 
            type: 'string', 
            enum: ['summary', 'key_points', 'questions', 'insights'] 
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { sourceId, analysisType } = request.body as AnalyzeSourceRequest;

      // Get the source
      const source = await fastify.prisma.noteSources.findFirst({
        where: {
          id: sourceId,
          note: {
            userId
          }
        },
        include: {
          note: {
            select: {
              id: true,
              title: true,
              text: true
            }
          }
        }
      });

      if (!source) {
        return reply.code(404).send({ 
          success: false, 
          message: 'Source not found' 
        });
      }

      // Prepare content for analysis
      const contentToAnalyze = source.content || source.url || source.title;
      
      // Create analysis prompt based on type
      let analysisPrompt = '';
      switch (analysisType) {
        case 'summary':
          analysisPrompt = `Please provide a concise summary of the following content:\n\n${contentToAnalyze}`;
          break;
        case 'key_points':
          analysisPrompt = `Extract the key points from the following content:\n\n${contentToAnalyze}`;
          break;
        case 'questions':
          analysisPrompt = `Generate 5-10 thoughtful questions based on the following content:\n\n${contentToAnalyze}`;
          break;
        case 'insights':
          analysisPrompt = `Provide insights and observations about the following content:\n\n${contentToAnalyze}`;
          break;
      }

      // Use exa-js answer function for AI analysis
      const analysis = await exaService.answer(analysisPrompt, {
        includeImages: false,
        includeDomains: [],
        useAutoprompt: true
      });

      return reply.code(200).send({
        success: true,
        data: {
          sourceId,
          analysisType,
          analysis: analysis.answer || 'Analysis not available',
          source: {
            id: source.id,
            title: source.title,
            type: source.type,
            url: source.url
          }
        }
      });

    } catch (error) {
      fastify.log.error('Error analyzing source:', error);
      return reply.code(500).send({ 
        success: false, 
        message: 'Failed to analyze source',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get source insights and suggestions
  fastify.get('/source-insights/:sourceId', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const sourceId = (request.params as { sourceId: string }).sourceId;

      const source = await fastify.prisma.noteSources.findFirst({
        where: {
          id: sourceId,
          note: {
            userId
          }
        },
        include: {
          note: {
            select: {
              id: true,
              title: true,
              text: true,
              topics: true
            }
          }
        }
      });

      if (!source) {
        return reply.code(404).send({ 
          success: false, 
          message: 'Source not found' 
        });
      }

      // Generate insights using exa-js
      const content = source.content || source.url || source.title;
      const noteTopics = source.note?.topics?.join(', ') || '';
      
      const insightsPrompt = `Based on this content: "${content}" and note topics: "${noteTopics}", provide:
1. Key insights and takeaways
2. Related topics to explore
3. Potential questions for further research
4. How this content relates to the note's context`;

      const insights = await exaService.answer(insightsPrompt, {
        includeImages: false,
        useAutoprompt: true
      });

      return reply.code(200).send({
        success: true,
        data: {
          sourceId,
          insights: insights.answer || 'Insights not available',
          source: {
            id: source.id,
            title: source.title,
            type: source.type,
            url: source.url
          }
        }
      });

    } catch (error) {
      fastify.log.error('Error getting source insights:', error);
      return reply.code(500).send({ 
        success: false, 
        message: 'Failed to get source insights',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Find similar sources
  fastify.get('/similar-sources/:sourceId', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const sourceId = (request.params as { sourceId: string }).sourceId;

      const source = await fastify.prisma.noteSources.findFirst({
        where: {
          id: sourceId,
          note: {
            userId
          }
        }
      });

      if (!source) {
        return reply.code(404).send({ 
          success: false, 
          message: 'Source not found' 
        });
      }

      // Find similar content using exa-js
      const similarResults = await exaService.findSimilar(source.url || source.content || source.title, {
        numResults: 5,
        includeImages: false
      });

      return reply.code(200).send({
        success: true,
        data: {
          sourceId,
          similarSources: similarResults.results || [],
          originalSource: {
            id: source.id,
            title: source.title,
            type: source.type,
            url: source.url
          }
        }
      });

    } catch (error) {
      fastify.log.error('Error finding similar sources:', error);
      return reply.code(500).send({ 
        success: false, 
        message: 'Failed to find similar sources',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Suggest sources based on input text
  fastify.post('/suggest-sources', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', minLength: 10 },
          maxResults: { type: 'number', default: 5 },
          includeContent: { type: 'boolean', default: false },
          searchType: { 
            type: 'string', 
            enum: ['articles', 'research', 'tutorials', 'documentation', 'all'],
            default: 'all'
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { text, maxResults = 5, includeContent = false, searchType = 'all' } = request.body as {
        text: string;
        maxResults?: number;
        includeContent?: boolean;
        searchType?: string;
      };

      // Extract key topics from the text for better search
      const topics = text.split(' ').filter(word => 
        word.length > 3 && 
        !['the', 'and', 'for', 'with', 'this', 'that', 'have', 'will', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'just', 'into', 'than', 'more', 'other', 'about', 'many', 'then', 'them', 'these', 'so', 'people', 'can', 'said', 'each', 'which', 'she', 'do', 'how', 'their', 'if', 'will', 'up', 'out', 'many', 'then', 'them', 'these', 'so', 'people', 'can', 'said', 'each', 'which', 'she', 'do', 'how', 'their', 'if', 'will', 'up', 'out', 'my', 'has', 'her', 'would', 'make', 'like', 'into', 'him', 'time', 'two', 'more', 'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call', 'who', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part'].includes(word.toLowerCase())
      ).slice(0, 5);

      // Create search query based on text and search type
      let searchQuery = text;
      if (searchType !== 'all') {
        const typeKeywords = {
          'articles': 'article research paper',
          'research': 'research study academic paper',
          'tutorials': 'tutorial guide how-to',
          'documentation': 'documentation reference manual'
        };
        searchQuery = `${text} ${typeKeywords[searchType as keyof typeof typeKeywords]}`;
      }

      // Search for relevant content using exa-js
      const searchResults = await exaService.searchAndContents(searchQuery, {
        numResults: maxResults,
        includeImages: false,
        includeDomains: [],
        excludeDomains: ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com'],
        useAutoprompt: true
      });

      if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
        return reply.code(200).send({
          success: true,
          data: {
            suggestions: [],
            query: searchQuery,
            message: 'No relevant sources found'
          }
        });
      }

      // Transform results into NoteSource format
      const suggestions = searchResults.results.map((result: any, index: number) => {
        const sourceData: any = {
          type: 'website' as const,
          title: result.title || `Suggested Source ${index + 1}`,
          url: result.url,
          content: includeContent ? (result.text || result.content || '') : '',
          metadata: {
            suggestedAt: new Date().toISOString(),
            relevanceScore: result.score || 0,
            searchQuery: searchQuery,
            topics: topics,
            searchType: searchType,
            suggestedBy: 'exa-js'
          }
        };

        // Add highlights if available
        if (result.highlights && result.highlights.length > 0) {
          sourceData.metadata.highlights = result.highlights;
        }

        // Add domain info
        if (result.url) {
          try {
            const url = new URL(result.url);
            sourceData.metadata.domain = url.hostname;
          } catch (e) {
            // Invalid URL, skip domain extraction
          }
        }

        return sourceData;
      });

      return reply.code(200).send({
        success: true,
        data: {
          suggestions,
          query: searchQuery,
          topics: topics,
          totalFound: suggestions.length,
          searchType: searchType
        }
      });

    } catch (error) {
      fastify.log.error('Error suggesting sources:', error);
      return reply.code(500).send({ 
        success: false, 
        message: 'Failed to suggest sources',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

export default sourceAgentRoutes; 