/**
 * Article Tools
 *
 * LangChain tools for searching Flemoji's music education articles.
 *
 * @module article-tools
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { searchArticlesBySemantic } from '@/lib/services/article-service';

export const searchArticlesTool = new DynamicStructuredTool({
  name: 'search_articles',
  description: `Search Flemoji's music education articles by topic, question, or keyword.
Use this when users ask about: royalties, streaming income, CAPASSO, SAMRO, music rights,
music distribution, how to get paid as an artist, metadata, ISRC codes, or any music
business/industry knowledge question.
Returns article titles, excerpts, read time, and links.`,
  schema: z.object({
    query: z.string().describe('The topic or question to search for'),
    limit: z.number().optional().default(5),
  }),
  func: async ({ query, limit = 5 }) => {
    try {
      const articles = await searchArticlesBySemantic(query, {
        limit,
        minSimilarity: 0.25,
      });

      if (articles.length === 0) {
        return JSON.stringify({ articles: [], count: 0 });
      }

      return JSON.stringify({
        articles: articles.map((a: any) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt ?? '',
          readTime: a.readTime,
          url: `/learn/${a.slug}`,
          cluster: a.cluster?.name ?? null,
        })),
        count: articles.length,
      });
    } catch (err) {
      return JSON.stringify({ articles: [], count: 0, error: 'Search failed' });
    }
  },
});

export const articleTools = [searchArticlesTool];
