/**
 * MCP v2 cluster tools — list/get/create/update/delete clusters.
 *
 * Registered ONLY when the client negotiates `x-contract-version: 2`. Tool
 * names + I/O are contractual (see contract.ts cluster schemas + the v2 plan).
 * Every tool is registered through `wrapTool` for uniform rate-limit / scope /
 * audit enforcement, and uses the `clusters:read` / `clusters:write` scopes.
 *
 * All business logic (canonical mapping, hashing, optimistic concurrency,
 * member resolution, cluster webhooks) lives in `@/lib/mcp/cluster-service`,
 * which reuses the existing `@/lib/services/article-service` cluster helpers.
 */

import {
  ListClustersInputSchema,
  GetClusterInputSchema,
  CreateClusterInputSchema,
  UpdateClusterInputSchema,
  DeleteClusterInputSchema,
  type ListClustersInput,
  type GetClusterInput,
  type CreateClusterInput,
  type UpdateClusterInput,
  type DeleteClusterInput,
} from '../contract';
import { wrapTool, type ToolRegistrar } from './types';
import {
  listClusters,
  getCluster,
  createCluster,
  updateCluster,
  deleteCluster,
} from '../cluster-service';

/**
 * Attach the v2 cluster tools to the server.
 *
 * Tools (scopes in parentheses):
 *   - list_clusters    (clusters:read)
 *   - get_cluster      (clusters:read)
 *   - create_cluster   (clusters:write)
 *   - update_cluster   (clusters:write)
 *   - delete_cluster   (clusters:write)
 */
export const registerClusterTools: ToolRegistrar = (server, ctx) => {
  server.registerTool(
    'list_clusters',
    {
      description:
        'List content clusters with an optional status filter and text query (matches name/slug/description). Returns lightweight cluster summaries including the derived combined keyword set and article count.',
      inputSchema: ListClustersInputSchema.shape,
    },
    wrapTool(
      { name: 'list_clusters', scopes: ['clusters:read'], ctx },
      async (args: ListClustersInput) => listClusters(args)
    )
  );

  server.registerTool(
    'get_cluster',
    {
      description:
        'Fetch a single cluster by `id` or `slug` as the canonical cluster shape, including its member articles, the derived combined `targetKeywords`, a per-field `hashes` map, and `contentHash` for sync and optimistic concurrency.',
      inputSchema: GetClusterInputSchema.shape,
    },
    wrapTool(
      { name: 'get_cluster', scopes: ['clusters:read'], ctx },
      async (args: GetClusterInput) => getCluster(args)
    )
  );

  server.registerTool(
    'create_cluster',
    {
      description:
        'Create a new content cluster from canonical fields (slug auto-generated when omitted; status defaults to DRAFT). Returns the new id and contentHash, and emits a cluster.created webhook.',
      inputSchema: CreateClusterInputSchema.shape,
    },
    wrapTool(
      { name: 'create_cluster', scopes: ['clusters:write'], ctx },
      async (args: CreateClusterInput) => createCluster(args)
    )
  );

  server.registerTool(
    'update_cluster',
    {
      description:
        'Apply a partial canonical patch to a cluster. When `baseHash` is supplied and no longer matches the current contentHash, returns a 409 conflict carrying the current per-field hashes. Emits a cluster.updated webhook with changedFields.',
      inputSchema: UpdateClusterInputSchema.shape,
    },
    wrapTool(
      { name: 'update_cluster', scopes: ['clusters:write'], ctx },
      async (args: UpdateClusterInput) =>
        updateCluster({
          id: args.id,
          patch: args.patch,
          baseHash: args.baseHash,
        })
    )
  );

  server.registerTool(
    'delete_cluster',
    {
      description:
        'Delete a cluster. Unassigns its member articles first (never hard-deletes articles), then removes the cluster. Emits a cluster.deleted webhook.',
      inputSchema: DeleteClusterInputSchema.shape,
    },
    wrapTool(
      { name: 'delete_cluster', scopes: ['clusters:write'], ctx },
      async (args: DeleteClusterInput) => deleteCluster({ id: args.id })
    )
  );
};
