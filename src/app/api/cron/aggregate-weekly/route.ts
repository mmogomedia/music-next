import { NextRequest, NextResponse } from 'next/server';
import { statsAggregator } from '@/lib/aggregation-jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Weekly aggregation cron job
 * Should be called weekly to aggregate stats for the previous week
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (in production, add proper auth)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the week start date to aggregate (default to last week)
    const { searchParams } = new URL(request.url);
    const weekParam = searchParams.get('week');

    let weekStart: Date;
    if (weekParam) {
      weekStart = new Date(weekParam);
      if (isNaN(weekStart.getTime())) {
        return NextResponse.json(
          { error: 'Invalid week date format' },
          { status: 400 }
        );
      }
    } else {
      // Default to last week
      const now = new Date();
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);
      weekStart = statsAggregator.getWeekStart(lastWeek);
    }

    // Run weekly aggregation
    await statsAggregator.aggregateWeekly(weekStart);

    return NextResponse.json({
      success: true,
      message: `Weekly aggregation completed for week starting ${weekStart.toISOString()}`,
      weekStart: weekStart.toISOString(),
    });
  } catch (error) {
    console.error('Error in weekly aggregation cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Weekly aggregation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger for weekly aggregation (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { week } = body;

    let weekStart: Date;
    if (week) {
      weekStart = new Date(week);
      if (isNaN(weekStart.getTime())) {
        return NextResponse.json(
          { error: 'Invalid week date format' },
          { status: 400 }
        );
      }
    } else {
      // Default to last week
      const now = new Date();
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);
      weekStart = statsAggregator.getWeekStart(lastWeek);
    }

    await statsAggregator.aggregateWeekly(weekStart);

    return NextResponse.json({
      success: true,
      message: `Weekly aggregation completed for week starting ${weekStart.toISOString()}`,
      weekStart: weekStart.toISOString(),
    });
  } catch (error) {
    console.error('Error in manual weekly aggregation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Weekly aggregation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
