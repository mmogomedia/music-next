import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncToolRegistry } from '@/lib/services/tool-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await syncToolRegistry();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error syncing tool registry:', error);
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
  }
}
