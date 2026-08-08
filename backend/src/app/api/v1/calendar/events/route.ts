import { NextResponse } from 'next/server';
import prisma from '@/core/database/prisma';
import { requireAuth } from '@/core/auth/middleware';

// GET all events for the current organization
export async function GET(req: Request) {
  try {
    const user = requireAuth(req as any);
    if (user instanceof NextResponse) return user;

    if (!user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const whereClause: any = { organizationId: user.organizationId };

    if (start && end) {
      whereClause.startDate = { gte: new Date(start) };
      whereClause.endDate = { lte: new Date(end) };
    }

    const events = await prisma.organizationEvent.findMany({
      where: whereClause,
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Fetch Events Error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST a new event
export async function POST(req: Request) {
  try {
    const user = requireAuth(req as any);
    if (user instanceof NextResponse) return user;

    if (!user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ORG_ADMIN or SUPER_ADMIN can create events
    if (user.role !== 'ORG_ADMIN' && !user.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, startDate, endDate, type, location, color } = body;

    if (!title || !startDate || !endDate || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const event = await prisma.organizationEvent.create({
      data: {
        organizationId: user.organizationId,
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type,
        location,
        color,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error: any) {
    console.error('Create Event Error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
