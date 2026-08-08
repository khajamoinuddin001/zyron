import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

export async function PATCH(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    const isOrgAdmin = authUser.role === 'ORG_ADMIN' || authUser.isSuperAdmin;
    const hasAttendance = authUser.activeModules?.includes('attendance');

    if (!isOrgAdmin && !hasAttendance) {
      return NextResponse.json({ error: 'Unauthorized to edit groups' }, { status: 403 })
    }

    const { name, type } = await req.json()

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
    }

    // Ensure group exists and belongs to org
    const group = await prisma.organizationGroup.findUnique({
      where: { id: params.groupId, organizationId: authUser.organizationId! }
    })
    
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const updated = await prisma.organizationGroup.update({
      where: { id: params.groupId },
      data: { name, type }
    })

    return NextResponse.json({ group: updated })
  } catch (error: any) {
    console.error('[GROUP_PATCH_ERROR]', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A group with this name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    const isOrgAdmin = authUser.role === 'ORG_ADMIN' || authUser.isSuperAdmin;
    const hasAttendance = authUser.activeModules?.includes('attendance');

    if (!isOrgAdmin && !hasAttendance) {
      return NextResponse.json({ error: 'Unauthorized to delete groups' }, { status: 403 })
    }

    // Ensure group exists and belongs to org
    const group = await prisma.organizationGroup.findUnique({
      where: { id: params.groupId, organizationId: authUser.organizationId! }
    })
    
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    await prisma.organizationGroup.delete({
      where: { id: params.groupId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[GROUP_DELETE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
