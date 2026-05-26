/**
 * MCP article tools — `list_articles`, `get_article`, `create_article`,
 * `update_article`, `delete_article`, `publish_article`.
 *
 * Each tool is registered through `wrapTool` (rate limit → scope check →
 * handler → audit, with errors mapped to an isError CallToolResult) and
 * delegates ALL business logic to `@/lib/mcp/articles-service`, which in turn
 * reuses the existing `@/lib/services/article-service` helpers. I/O shapes come
 * from `@/lib/mcp/contract`; per-field hashing + optimistic concurrency live in
 * the service.
 *
 * Scopes: `articles:read` (list/get), `articles:write` (create/update/delete/
 * publish).
 */

import {
  ListArticlesInputSchema,
  GetArticleInputSchema,
  CreateArticleInputV2Schema,
  UpdateArticleInputV2Schema,
  DeleteArticleInputSchema,
  PublishArticleInputSchema,
  type ListArticlesInput,
  type GetArticleInput,
  type CreateArticleInputV2,
  type UpdateArticleInputV2,
  type DeleteArticleInput,
  type PublishArticleInput,
} from '../contract';
import { wrapTool, type ToolRegistrar } from './types';
import {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticleById,
} from '../articles-service';

export const registerArticleTools: ToolRegistrar = (server, ctx) => {
  server.registerTool(
    'list_articles',
    {
      description:
        'List articles with optional status filter, pagination, and text search. Returns lightweight article summaries (incl. clusterId/clusterRole/readTime under contract v2) plus total/page counts.',
      inputSchema: ListArticlesInputSchema.shape,
    },
    wrapTool(
      { name: 'list_articles', scopes: ['articles:read'], ctx },
      async (args: ListArticlesInput, c) =>
        listArticles(args, c.contractVersion)
    )
  );

  server.registerTool(
    'get_article',
    {
      description:
        'Fetch a single article by `id` or `slug` as the canonical article shape, including a per-field `hashes` map and `contentHash` for sync and optimistic concurrency. Under contract v2 the shape covers the full field set (primaryKeyword, internalLinks, toolSlugs, ctaText, ctaLink, clusterId, clusterRole, derived readTime) and hashes cover the extended set.',
      inputSchema: GetArticleInputSchema.shape,
    },
    wrapTool(
      { name: 'get_article', scopes: ['articles:read'], ctx },
      async (args: GetArticleInput, c) => getArticle(args, c.contractVersion)
    )
  );

  server.registerTool(
    'create_article',
    {
      description:
        'Create a new article from canonical fields (slug auto-generated when omitted). Under contract v2 accepts the full field set (primaryKeyword, internalLinks, toolSlugs, ctaText, ctaLink, clusterId, clusterRole); v1 clients simply omit them. Returns the new id and contentHash, and emits an article.created webhook.',
      inputSchema: CreateArticleInputV2Schema.shape,
    },
    wrapTool(
      { name: 'create_article', scopes: ['articles:write'], ctx },
      async (args: CreateArticleInputV2, c) =>
        createArticle(args, c.contractVersion, c.clientId)
    )
  );

  server.registerTool(
    'update_article',
    {
      description:
        'Apply a partial canonical patch to an article (full v2 field set under contract v2). When `baseHash` is supplied and no longer matches the current contentHash, returns a 409 conflict carrying the current per-field hashes. Emits an article.updated webhook with changedFields.',
      inputSchema: UpdateArticleInputV2Schema.shape,
    },
    wrapTool(
      { name: 'update_article', scopes: ['articles:write'], ctx },
      async (args: UpdateArticleInputV2, c) =>
        updateArticle({
          id: args.id,
          patch: args.patch,
          baseHash: args.baseHash,
          contractVersion: c.contractVersion,
          clientId: c.clientId,
        })
    )
  );

  server.registerTool(
    'delete_article',
    {
      description:
        'Delete an article. Soft-deletes (status → ARCHIVED) by default, or hard-deletes when `hard` is true. Emits an article.deleted webhook.',
      inputSchema: DeleteArticleInputSchema.shape,
    },
    wrapTool(
      { name: 'delete_article', scopes: ['articles:write'], ctx },
      async (args: DeleteArticleInput, c) =>
        deleteArticle({
          id: args.id,
          hard: args.hard,
          contractVersion: c.contractVersion,
        })
    )
  );

  server.registerTool(
    'publish_article',
    {
      description:
        'Publish an article: sets status PUBLISHED + publishedAt, creates the linked NEWS_ARTICLE timeline post, enqueues the embedding, and emits an article.published webhook.',
      inputSchema: PublishArticleInputSchema.shape,
    },
    wrapTool(
      { name: 'publish_article', scopes: ['articles:write'], ctx },
      async (args: PublishArticleInput, c) =>
        publishArticleById(args.id, c.contractVersion, c.clientId)
    )
  );
};
