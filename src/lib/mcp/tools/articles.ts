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
  CreateArticleInputSchema,
  UpdateArticleInputSchema,
  DeleteArticleInputSchema,
  PublishArticleInputSchema,
  type ListArticlesInput,
  type GetArticleInput,
  type CreateArticleInput,
  type UpdateArticleInput,
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
        'List articles with optional status filter, pagination, and text search. Returns lightweight article summaries plus total/page counts.',
      inputSchema: ListArticlesInputSchema.shape,
    },
    wrapTool(
      { name: 'list_articles', scopes: ['articles:read'], ctx },
      async (args: ListArticlesInput) => listArticles(args)
    )
  );

  server.registerTool(
    'get_article',
    {
      description:
        'Fetch a single article by `id` or `slug` as the canonical article shape, including a per-field `hashes` map and `contentHash` for sync and optimistic concurrency.',
      inputSchema: GetArticleInputSchema.shape,
    },
    wrapTool(
      { name: 'get_article', scopes: ['articles:read'], ctx },
      async (args: GetArticleInput) => getArticle(args)
    )
  );

  server.registerTool(
    'create_article',
    {
      description:
        'Create a new article from canonical fields (slug auto-generated when omitted). Returns the new id and contentHash, and emits an article.created webhook.',
      inputSchema: CreateArticleInputSchema.shape,
    },
    wrapTool(
      { name: 'create_article', scopes: ['articles:write'], ctx },
      async (args: CreateArticleInput) => createArticle(args)
    )
  );

  server.registerTool(
    'update_article',
    {
      description:
        'Apply a partial canonical patch to an article. When `baseHash` is supplied and no longer matches the current contentHash, returns a 409 conflict carrying the current per-field hashes. Emits an article.updated webhook with changedFields.',
      inputSchema: UpdateArticleInputSchema.shape,
    },
    wrapTool(
      { name: 'update_article', scopes: ['articles:write'], ctx },
      async (args: UpdateArticleInput) =>
        updateArticle({
          id: args.id,
          patch: args.patch,
          baseHash: args.baseHash,
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
      async (args: DeleteArticleInput) =>
        deleteArticle({ id: args.id, hard: args.hard })
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
      async (args: PublishArticleInput) => publishArticleById(args.id)
    )
  );
};
