import { NextRequest, NextResponse } from 'next/server';
import { PulseLeagueService } from '@/lib/services/pulse-league-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pulse/league/run
 * Protected endpoint for cron/scheduler to run league updates
 * Verifies secret token before processing
 * All activity is logged to the database instead of console
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let runLogId: string | null = null;

  try {
    // Verify secret token
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Check for secret in header or query param
    const headerSecret = req.headers.get('x-cron-secret');
    const querySecret = req.nextUrl.searchParams.get('secret');
    const providedSecret = headerSecret || querySecret;

    if (providedSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create main activity log entry
    const runLog = await prisma.pulseLeagueRunLog.create({
      data: {
        startedAt: new Date(startTime),
        status: 'running',
      },
    });
    runLogId = runLog.id;

    // Get all active tiers
    const activeTiers = await PulseLeagueService.getActiveTiers();

    if (activeTiers.length === 0) {
      await prisma.pulseLeagueRunLog.update({
        where: { id: runLog.id },
        data: {
          completedAt: new Date(),
          totalDurationMs: Date.now() - startTime,
          status: 'completed',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'No active tiers found',
        tiersProcessed: 0,
        entriesCreated: 0,
        totalDurationMs: Date.now() - startTime,
        logId: runLog.id,
      });
    }

    const results: Array<{
      tierCode: string;
      tierName: string;
      runId: string;
      entriesCreated: number;
      durationMs: number;
    }> = [];

    // Ensure tiers don't overlap: once an artist is selected for a higher tier,
    // exclude them from the tiers below for that run.
    const selectedArtistIds: string[] = [];
    let skippedCount = 0;
    let errorCount = 0;

    // Process each tier that needs refresh
    for (const tier of activeTiers) {
      const tierStartTime = Date.now();
      const shouldRefresh = await PulseLeagueService.shouldRefreshTier(tier);

      if (!shouldRefresh) {
        skippedCount++;
        continue;
      }

      try {
        const result = await PulseLeagueService.runLeagueForTier(
          tier,
          'SCHEDULED',
          { excludeArtistProfileIds: selectedArtistIds }
        );

        const tierDuration = Date.now() - tierStartTime;

        results.push({
          tierCode: tier.code,
          tierName: tier.name,
          runId: result.runId,
          entriesCreated: result.entriesCreated,
          durationMs: tierDuration,
        });

        // Collect the artist IDs selected in this run so lower tiers don't repeat them
        const entries = await PulseLeagueService.getCurrentLeagueEntries(
          tier.id
        );
        for (const e of entries) {
          selectedArtistIds.push(e.artistProfileId);
        }
      } catch (error: any) {
        errorCount++;
        // Continue with other tiers even if one fails
      }
    }

    // Process promotions/demotions if this is a daily run
    let promotionsProcessed = false;
    try {
      await PulseLeagueService.processPromotionsAndDemotions();
      promotionsProcessed = true;
    } catch (error: any) {
      // Don't fail the entire request if this fails
    }

    const totalEntries = results.reduce((sum, r) => sum + r.entriesCreated, 0);
    const totalDuration = Date.now() - startTime;

    // Update main log with completion
    await prisma.pulseLeagueRunLog.update({
      where: { id: runLog.id },
      data: {
        completedAt: new Date(),
        totalDurationMs: totalDuration,
        tiersProcessed: results.length,
        tiersSkipped: skippedCount,
        tiersErrored: errorCount,
        entriesCreated: totalEntries,
        promotionsProcessed,
        status: 'completed',
      },
    });

    const summary = {
      success: true,
      message: `Processed ${results.length} tier(s)`,
      tiersProcessed: results.length,
      tiersSkipped: skippedCount,
      tiersErrored: errorCount,
      entriesCreated: totalEntries,
      promotionsProcessed,
      totalDurationMs: totalDuration,
      results,
      logId: runLog.id,
    };

    return NextResponse.json(summary);
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;

    // Update log with failure if it exists
    if (runLogId) {
      try {
        await prisma.pulseLeagueRunLog.update({
          where: { id: runLogId },
          data: {
            completedAt: new Date(),
            totalDurationMs: totalDuration,
            status: 'failed',
            errorMessage: error?.message || String(error),
          },
        });
      } catch (logError) {
        // Ignore log update errors
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run league updates',
        message: error?.message || String(error),
        totalDurationMs: totalDuration,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pulse/league/run
 * Optional manual trigger (requires authentication in future)
 * For now, still requires CRON_SECRET
 */
export async function GET(req: NextRequest) {
  // For manual triggers, we can add auth later
  // For now, use same secret check
  return POST(req);
}
