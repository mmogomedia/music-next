/**
 * Scheduled-publish cron (MCP integration, Plan B → B4).
 *
 * Publishes articles whose `scheduledAt` has come due. Runs on the cadence
 * configured in `vercel.json`. Auth mirrors the existing cron routes (e.g.
 * `aggregate-daily`): a `Bearer ${CRON_SECRET}` Authorization header.
 *
 * Each due article is published via the canonical publish path
 * (`publishArticleById` from `@/lib/mcp/articles-service`), which flips status
 * to PUBLISHED, sets `publishedAt`, creates the linked TimelinePost, enqueues
 * the embedding, and fires the change webhook. Individual failures are skipped
 * so one bad article never aborts the whole batch.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { publishArticleById } from '@/lib/mcp/articles-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Same auth pattern as the other cron routes (Bearer CRON_SECRET).
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Articles that are due (scheduledAt <= now) and not yet published.
    const dueArticles = await prisma.article.findMany({
      where: {
        scheduledAt: { not: null, lte: now },
        status: { not: 'PUBLISHED' },
      },
      select: { id: true },
    });

    const published: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const { id } of dueArticles) {
      try {
        await publishArticleById(id);
        published.push(id);
      } catch (error) {
        // Skip individual failures without aborting the batch.
        failed.push({
          id,
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(
          `[cron/publish-scheduled] Failed to publish article ${id}:`,
          error
        );
      }
    }

    return NextResponse.json({
      published,
      count: published.length,
      ...(failed.length > 0 ? { failed } : {}),
    });
  } catch (error) {
    console.error('[cron/publish-scheduled] cron job error:', error);
    return NextResponse.json(
      {
        error: 'Scheduled publish failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
