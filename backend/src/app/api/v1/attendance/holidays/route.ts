import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/core/database/prisma';
import { requireAuth } from '@/core/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    const authUser = requireAuth(req);
    if (authUser instanceof NextResponse) return authUser;

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // YYYY-MM
    
    let whereClause: any = { organizationId: authUser.organizationId! };

    if (month) {
      const start = new Date(`${month}-01T00:00:00Z`);
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);
      whereClause.date = { gte: start, lt: end };
    }

    const holidays = await prisma.organizationHoliday.findMany({
      where: whereClause,
      orderBy: { date: 'asc' }
    });

    return NextResponse.json({ holidays });
  } catch (error) {
    console.error('[HOLIDAYS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = requireAuth(req);
    if (authUser instanceof NextResponse) return authUser;

    if (authUser.role !== 'ORG_ADMIN' && !authUser.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { date, name } = await req.json();
    if (!date || !name) {
      return NextResponse.json({ error: 'Missing date or name' }, { status: 400 });
    }

    const parsedDate = new Date(date);
    parsedDate.setUTCHours(0,0,0,0);

    const holiday = await prisma.organizationHoliday.create({
      data: {
        organizationId: authUser.organizationId!,
        date: parsedDate,
        name
      }
    });

    return NextResponse.json({ holiday }, { status: 201 });
  } catch (error: any) {
    console.error('[HOLIDAYS_POST]', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A holiday already exists on this date.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
