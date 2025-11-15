import { NextRequest, NextResponse } from 'next/server';
import { getQuickLinkLandingData } from '@/lib/services/quick-link-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data = await getQuickLinkLandingData(slug);

    if (!data) {
      return NextResponse.json(
        { error: 'Quick link not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching quick link data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quick link data' },
      { status: 500 }
    );
  }
}
