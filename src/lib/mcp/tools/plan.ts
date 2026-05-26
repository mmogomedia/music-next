/**
 * MCP v2 content-planning tools — validate + transactionally apply a whole
 * topic cluster (pillar + spokes) in one call.
 *
 * Registered ONLY when the client negotiates `x-contract-version: 2`. Tool
 * names + I/O are contractual (see contract.ts plan schemas + the v2 plan).
 * Every tool is registered through `wrapTool` for uniform enforcement
 * (rate-limit → scope check → handler → audit). All business logic lives in
 * `@/lib/mcp/plan-service`.
 *
 * Scopes:
 *   - validate_content_plan : articles:read (pure dry-run, no writes)
 *   - apply_content_plan    : articles:write + clusters:write (atomic apply)
 */

import {
  ValidateContentPlanInputSchema,
  ApplyContentPlanInputSchema,
  type ValidateContentPlanInput,
  type ApplyContentPlanInput,
} from '../contract';
import { wrapTool, type ToolRegistrar } from './types';
import { validateContentPlan, applyContentPlan } from '../plan-service';

/**
 * Attach the v2 planning tools to the server.
 */
export const registerPlanTools: ToolRegistrar = (server, ctx) => {
  server.registerTool(
    'validate_content_plan',
    {
      description:
        'Dry-run validate a content plan (cluster + pillar/spoke articles + links) WITHOUT writing anything. Checks slug collisions, internal-link resolution, exactly one PILLAR per cluster with spokes linking up to it, required fields, embeddable toolSlugs, and scheduledAt sanity. Returns { ok, issues[], normalized? }.',
      inputSchema: ValidateContentPlanInputSchema.shape,
    },
    wrapTool(
      { name: 'validate_content_plan', scopes: ['articles:read'], ctx },
      async (args: ValidateContentPlanInput) => validateContentPlan(args)
    )
  );

  server.registerTool(
    'apply_content_plan',
    {
      description:
        'Create/update a whole topic cluster (pillar + spokes) with internal links and schedules in one call. Idempotent by slug (create if new, update if it exists). Runs the same validation as validate_content_plan first and writes NOTHING on any error-level issue (422). Returns { clusterId?, articles[], created[], updated[] } and emits the per-entity webhooks.',
      inputSchema: ApplyContentPlanInputSchema.shape,
    },
    wrapTool(
      {
        name: 'apply_content_plan',
        scopes: ['articles:write', 'clusters:write'],
        ctx,
      },
      async (args: ApplyContentPlanInput) =>
        applyContentPlan(args, ctx.contractVersion)
    )
  );
};
