/**
 * POST /api/ai/artist-audit/stream
 *
 * SSE streaming endpoint for the career audit pipeline.
 * Emits events as each phase completes so the UI can show live progress.
 *
 * Event sequence:
 *   audit_start
 *   → phase_start × 4 (profile, platform, release, business)
 *     → check_result × N  (per phase)
 *   → phase_complete × 4
 *   → decision_start
 *   → thinking_token × N  (streamed LLM narrative)
 *   → audit_complete (final result payload)
 *   | error (if anything throws)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { streamCareerAudit } from '@/lib/ai/agents/streaming-audit-orchestrator';
import type { AuditSSEEvent } from '@/types/audit-stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Allow up to 5 minutes for a full audit stream
export const maxDuration = 300;

export async function POST(_request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve artist profile
  const artistProfile = await prisma.artistProfile.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!artistProfile) {
    return NextResponse.json(
      { error: 'Artist profile not found' },
      { status: 404 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      /** Send one SSE frame */
      function send(event: AuditSSEEvent) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // controller may already be closed if the client disconnected
        }
      }

      try {
        await streamCareerAudit(artistProfile.id, send);
      } catch (err) {
        console.error('[AuditStream] Fatal error:', err);
        send({
          type: 'error',
          error: {
            message: err instanceof Error ? err.message : 'Audit failed',
            code: 'AUDIT_ERROR',
          },
          timestamp: new Date().toISOString(),
        });
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },

    cancel() {
      // Client disconnected — nothing to clean up (streamCareerAudit will
      // finish in the background; next emit() call silently no-ops because
      // the try/catch in `send` swallows controller errors)
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Prevent Nginx / Vercel from buffering the stream
      'X-Accel-Buffering': 'no',
    },
  });
}
