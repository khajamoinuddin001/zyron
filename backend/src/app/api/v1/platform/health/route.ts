import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/core/database/prisma';
import { requireSuperAdmin } from '@/core/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    const authUser = requireSuperAdmin(req);
    if (authUser instanceof NextResponse) return authUser;

    const logs = await prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const totalErrorsToday = await prisma.systemLog.count({
      where: {
        statusCode: { gte: 500 },
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    });

    const slowRequestsToday = await prisma.systemLog.count({
      where: {
        durationMs: { gte: 1000 },
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    });

    return NextResponse.json({
      logs,
      metrics: {
        totalErrorsToday,
        slowRequestsToday
      }
    });
  } catch (error) {
    console.error('[HEALTH_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
