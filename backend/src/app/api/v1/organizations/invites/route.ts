import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    // Allow ORG_ADMIN or users with 'attendance' module access
    const isOrgAdmin = authUser.role === 'ORG_ADMIN' || authUser.isSuperAdmin
    const hasAttendance = authUser.activeModules?.includes('attendance')

    if (!isOrgAdmin && !hasAttendance) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!authUser.organizationId) {
      return NextResponse.json({ error: 'No organization context found' }, { status: 400 })
    }

    const body = await req.json()
    const { groupId, expiresInHours } = body

    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
    }

    // Verify group belongs to this organization
    const group = await prisma.organizationGroup.findFirst({
      where: { id: groupId, organizationId: authUser.organizationId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex')

    // Calculate expiresAt if expiresInHours is provided
    let expiresAt: Date | null = null;
    if (expiresInHours) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresInHours, 10));
    }

    // Create the invite
    const invite = await prisma.organizationInvite.create({
      data: {
        organizationId: authUser.organizationId,
        token,
        role: 'STUDENT',
        groupId,
        expiresAt
      }
    })

    return NextResponse.json({ invite })
  } catch (error: any) {
    console.error('Create Invite Error:', error)
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    )
  }
}
