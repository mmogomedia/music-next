/**
 * MCP scheduling tool — `set_schedule`.
 *
 * Flemoji owns scheduling: this tool writes `Article.scheduledAt` (the ISO
 * datetime at which the article should auto-publish, or `null` to clear it).
 * The actual auto-publish is performed by the cron route
 * `src/app/api/cron/publish-scheduled/route.ts`.
 *
 * Uses `SetScheduleInputSchema` / `SetScheduleOutputSchema` from
 * `@/lib/mcp/contract` and `wrapTool` from `@/lib/mcp/tools/types`.
 * Required scope: `articles:write`.
 */

import { prisma } from '@/lib/db';
import { McpError } from '../auth';
import { SetScheduleInputSchema, type SetScheduleOutput } from '../contract';
import { wrapTool, type ToolRegistrar } from './types';

/**
 * Registrar for the `set_schedule` tool (scope `articles:write`).
 */
export const registerScheduleTools: ToolRegistrar = (server, ctx) => {
  server.registerTool(
    'set_schedule',
    {
      description:
        'Set or clear an article’s scheduled auto-publish time. Pass an ' +
        'ISO-8601 datetime to schedule, or null to clear the schedule.',
      inputSchema: SetScheduleInputSchema.shape,
    },
    wrapTool(
      { name: 'set_schedule', scopes: ['articles:write'], ctx },
      async (rawArgs): Promise<SetScheduleOutput> => {
        const parsed = SetScheduleInputSchema.safeParse(rawArgs);
        if (!parsed.success) {
          throw new McpError(
            'bad_request',
            parsed.error.issues[0]?.message ?? 'Invalid set_schedule input',
            400
          );
        }
        const { id, scheduledAt } = parsed.data;

        const existing = await prisma.article.findUnique({
          where: { id },
          select: { id: true },
        });
        if (!existing) {
          throw new McpError('not_found', `Article not found: ${id}`, 404);
        }

        const updated = await prisma.article.update({
          where: { id },
          data: { scheduledAt: scheduledAt ? new Date(scheduledAt) : null },
          select: { id: true, scheduledAt: true },
        });

        return {
          id: updated.id,
          scheduledAt: updated.scheduledAt
            ? updated.scheduledAt.toISOString()
            : null,
        };
      }
    )
  );
};
