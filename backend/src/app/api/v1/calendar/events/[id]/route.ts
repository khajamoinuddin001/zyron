import { NextResponse } from 'next/server';
import prisma from '@/core/database/prisma';
import { requireAuth } from '@/core/auth/middleware';

// PUT update an event
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(req as any);
    if (user instanceof NextResponse) return user;

    if (!user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ORG_ADMIN' && !user.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { title, description, startDate, endDate, type, location, color } = body;

    // Verify ownership
    const existing = await prisma.organizationEvent.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const updated = await prisma.organizationEvent.update({
      where: { id },
      data: {
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        type,
        location,
        color,
      },
    });

    return NextResponse.json({ event: updated });
  } catch (error: any) {
    console.error('Update Event Error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// DELETE an event
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(req as any);
    if (user instanceof NextResponse) return user;

    if (!user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ORG_ADMIN' && !user.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    // Verify ownership
    const existing = await prisma.organizationEvent.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await prisma.organizationEvent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Event Error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
