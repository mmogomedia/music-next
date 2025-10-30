import { NextRequest, NextResponse } from 'next/server';
import { statsAggregator } from '@/lib/aggregation-jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Daily aggregation cron job
 * Should be called daily to aggregate stats for the previous day
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (in production, add proper auth)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the date to aggregate (default to yesterday)
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    let targetDate: Date;
    if (dateParam) {
      targetDate = new Date(dateParam);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
    } else {
      // Default to yesterday
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - 1);
    }

    console.log(`Starting daily aggregation for ${targetDate.toISOString()}`);

    // Run daily aggregation
    await statsAggregator.aggregateDaily(targetDate);

    console.log(`Daily aggregation completed for ${targetDate.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Daily aggregation completed for ${targetDate.toISOString()}`,
      date: targetDate.toISOString(),
    });
  } catch (error) {
    console.error('Error in daily aggregation cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Daily aggregation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger for daily aggregation (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body;

    let targetDate: Date;
    if (date) {
      targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
    } else {
      // Default to yesterday
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - 1);
    }

    console.log(
      `Manual daily aggregation triggered for ${targetDate.toISOString()}`
    );

    await statsAggregator.aggregateDaily(targetDate);

    return NextResponse.json({
      success: true,
      message: `Daily aggregation completed for ${targetDate.toISOString()}`,
      date: targetDate.toISOString(),
    });
  } catch (error) {
    console.error('Error in manual daily aggregation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Daily aggregation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
