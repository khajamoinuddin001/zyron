import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/core/database/prisma';
import { requireAuth } from '@/core/auth/middleware';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = requireAuth(req);
    if (authUser instanceof NextResponse) return authUser;

    if (authUser.role !== 'ORG_ADMIN' && !authUser.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    await prisma.organizationHoliday.deleteMany({
      where: {
        id,
        organizationId: authUser.organizationId!
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[HOLIDAYS_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
