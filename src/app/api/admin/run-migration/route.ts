import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { execSync } from 'child_process';

/**
 * Temporary API route to run database migrations in production
 * SECURITY: Only accessible by admins
 *
 * Usage: DELETE this route after running migrations
 */
export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    // Run migration
    // eslint-disable-next-line no-console
    console.log('Running database migrations...');
    const output = execSync('npx prisma migrate deploy', {
      encoding: 'utf-8',
      env: process.env,
    });

    return NextResponse.json({
      success: true,
      message: 'Migrations applied successfully',
      output: output.split('\n').slice(-20), // Last 20 lines
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        message: error.message,
        output: error.stdout?.toString() || error.stderr?.toString(),
      },
      { status: 500 }
    );
  }
}
