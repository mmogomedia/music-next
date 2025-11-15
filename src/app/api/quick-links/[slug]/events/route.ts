import { NextRequest, NextResponse } from 'next/server';
import { recordQuickLinkEvent } from '@/lib/services/quick-link-service';
import { ZodError } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const payload = await request.json();

    await recordQuickLinkEvent(slug, payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid event payload', details: error.flatten() },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Quick link not found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    console.error('Error recording quick link event:', error);
    return NextResponse.json(
      { error: 'Failed to record quick link event' },
      { status: 500 }
    );
  }
}
