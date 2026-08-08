import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/core/database/prisma';
import { requireAuth } from '@/core/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    const authUser = requireAuth(req);
    if (authUser instanceof NextResponse) return authUser;

    const org = await prisma.organization.findUnique({
      where: { id: authUser.organizationId! },
      select: { workingDays: true, absentTemplateId: true }
    });

    return NextResponse.json({ settings: org });
  } catch (error) {
    console.error('[ATTENDANCE_SETTINGS_GET]', error);
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

    const { workingDays, absentTemplateId } = await req.json();

    const org = await prisma.organization.update({
      where: { id: authUser.organizationId! },
      data: {
        workingDays: workingDays ? JSON.stringify(workingDays) : undefined,
        absentTemplateId
      }
    });

    return NextResponse.json({ settings: { workingDays: org.workingDays, absentTemplateId: org.absentTemplateId } });
  } catch (error) {
    console.error('[ATTENDANCE_SETTINGS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
