import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    // Allow ORG_ADMIN or users with 'attendance' module access
    const isOrgAdmin = authUser.role === 'ORG_ADMIN' || authUser.isSuperAdmin;
    const hasAttendance = authUser.activeModules?.includes('attendance');

    if (!isOrgAdmin && !hasAttendance) {
      return NextResponse.json({ error: 'Forbidden. Only Org Admins or authorized staff can manage members.' }, { status: 403 })
    }

    if (!authUser.organizationId) {
      return NextResponse.json({ error: 'No organization context found.' }, { status: 400 })
    }

    const memberId = params.id

    // Verify member belongs to this org
    const member = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId: authUser.organizationId
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found in this organization.' }, { status: 404 })
    }

    // Delete the member record.
    await prisma.organizationMember.delete({
      where: { id: memberId }
    })

    return NextResponse.json({ message: 'Member removed successfully.' })
  } catch (error) {
    console.error('[DELETE_MEMBER_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
