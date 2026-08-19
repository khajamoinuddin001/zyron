import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    if (!authUser.organizationId) {
      return NextResponse.json({ error: 'No organization context found.' }, { status: 400 })
    }

    const memberId = params.id

    const member = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId: authUser.organizationId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            mobile: true,
            createdAt: true,
          }
        },
        customRole: true,
        groups: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                type: true,
              }
            }
          }
        }
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
    }

    return NextResponse.json({ member })
  } catch (error) {
    console.error('[GET_MEMBER_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

export async function PATCH(
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
    const body = await req.json()
    const { biometricHardwareId } = body

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

    // Check if biometricHardwareId is already used by another member
    if (biometricHardwareId) {
      const existing = await prisma.organizationMember.findUnique({
        where: {
          organizationId_biometricHardwareId: {
            organizationId: authUser.organizationId,
            biometricHardwareId: biometricHardwareId
          }
        }
      })
      if (existing && existing.id !== memberId) {
        return NextResponse.json({ error: 'This Hardware ID is already assigned to another member.' }, { status: 400 })
      }
    }

    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data: {
        biometricHardwareId: biometricHardwareId || null
      }
    })

    return NextResponse.json({ message: 'Member updated successfully.', member: updated })
  } catch (error) {
    console.error('[PATCH_MEMBER_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
