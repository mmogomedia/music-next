import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch all completion rules
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rules = await prisma.trackCompletionRule.findMany({
      orderBy: [{ order: 'asc' }, { field: 'asc' }],
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching completion rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch completion rules' },
      { status: 500 }
    );
  }
}

// POST - Create a new completion rule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      field,
      label,
      category,
      weight,
      description,
      group,
      isRequired,
      order,
    } = body;

    if (!field || !label || !category || weight === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: field, label, category, weight' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['required', 'high', 'medium', 'low'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate weight
    if (weight < 0 || weight > 100) {
      return NextResponse.json(
        { error: 'Weight must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Check if field already exists
    const existing = await prisma.trackCompletionRule.findUnique({
      where: { field },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Rule for field "${field}" already exists` },
        { status: 409 }
      );
    }

    const rule = await prisma.trackCompletionRule.create({
      data: {
        field,
        label,
        category,
        weight,
        description: description || null,
        group: group || null,
        isRequired: isRequired ?? false,
        order: order ?? 0,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('Error creating completion rule:', error);
    return NextResponse.json(
      { error: 'Failed to create completion rule' },
      { status: 500 }
    );
  }
}

// PUT - Update all rules (for bulk updates)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { rules } = body;

    if (!Array.isArray(rules)) {
      return NextResponse.json(
        { error: 'Expected array of rules' },
        { status: 400 }
      );
    }

    // Validate total weight
    const totalWeight = rules.reduce(
      (sum: number, r: any) => sum + (r.weight || 0),
      0
    );
    if (totalWeight !== 100) {
      return NextResponse.json(
        {
          error: `Total weight must equal 100. Current total: ${totalWeight}`,
          totalWeight,
        },
        { status: 400 }
      );
    }

    // Update or create each rule
    const results = await Promise.all(
      rules.map(async (rule: any) => {
        const {
          field,
          label,
          category,
          weight,
          description,
          group,
          isRequired,
          order,
          isActive,
        } = rule;

        return prisma.trackCompletionRule.upsert({
          where: { field },
          update: {
            label,
            category,
            weight,
            description: description || null,
            group: group || null,
            isRequired: isRequired ?? false,
            order: order ?? 0,
            isActive: isActive !== undefined ? isActive : true,
          },
          create: {
            field,
            label,
            category,
            weight,
            description: description || null,
            group: group || null,
            isRequired: isRequired ?? false,
            order: order ?? 0,
            isActive: isActive !== undefined ? isActive : true,
          },
        });
      })
    );

    return NextResponse.json({ rules: results });
  } catch (error) {
    console.error('Error updating completion rules:', error);
    return NextResponse.json(
      { error: 'Failed to update completion rules' },
      { status: 500 }
    );
  }
}
