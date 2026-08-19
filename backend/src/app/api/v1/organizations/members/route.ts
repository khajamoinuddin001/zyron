import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { hashPassword, validatePassword } from '@/core/auth/password'
import { requireAuth } from '@/core/auth/middleware'

// POST /api/v1/organizations/members — add a staff member to the caller's organization
export async function POST(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    // Allow ORG_ADMIN or users with 'attendance' module access
    const isOrgAdmin = authUser.role === 'ORG_ADMIN' || authUser.isSuperAdmin;
    const hasAttendance = authUser.activeModules?.includes('attendance');

    if (!isOrgAdmin && !hasAttendance) {
      return NextResponse.json({ error: 'Forbidden. Only Org Admins or authorized staff can add members.' }, { status: 403 })
    }

    if (!authUser.organizationId) {
      return NextResponse.json({ error: 'No organization context found.' }, { status: 400 })
    }

    const body = await req.json()
    const { firstName, lastName, email, mobile, password, customRoleId, role = 'STAFF', groupId } = body

    // If not admin, restrict them to only creating CLIENTs
    if (!isOrgAdmin && role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden. You are only authorized to add clients.' }, { status: 403 })
    }

    if (!firstName || (!email && !mobile) || !password) {
      return NextResponse.json({ error: 'firstName, email or mobile, and password are required.' }, { status: 400 })
    }

    const finalEmail = email ? email.toLowerCase().trim() : `${mobile}@edminz.local`;

    const passwordCheck = validatePassword(password, role !== 'CLIENT')
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.message }, { status: 400 })
    }

    // If customRoleId provided, verify it belongs to this org
    if (customRoleId) {
      const orgRole = await prisma.organizationRole.findFirst({
        where: { id: customRoleId, organizationId: authUser.organizationId },
      })
      if (!orgRole) {
        return NextResponse.json({ error: 'Invalid role for this organization.' }, { status: 400 })
      }
    }

    // Check if email or mobile is already registered
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: finalEmail },
          ...(mobile ? [{ mobile: mobile.trim() }] : [])
        ]
      },
    })

    if (existingUser) {
      if (existingUser.email === finalEmail) {
        return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'A user with this mobile number already exists.' }, { status: 409 })
    }

    // Create user and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const passwordHash = await hashPassword(password)

      const user = await tx.user.create({
        data: {
          email: finalEmail,
          mobile: mobile ? mobile.trim() : null,
          passwordHash,
          firstName,
          lastName,
          isSuperAdmin: false,
        },
      })

      const membership = await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: authUser.organizationId!,
          role: role,
          customRoleId: customRoleId || null,
          status: 'ACTIVE',
        },
        include: { customRole: true },
      })

      if (groupId) {
        await tx.organizationGroupMember.create({
          data: {
            groupId,
            memberId: membership.id
          }
        })
      }

      return { user, membership }
    })

    return NextResponse.json({
      message: 'Staff member added successfully.',
      member: {
        id: result.membership.id,
        userId: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.membership.customRole?.name || result.membership.role,
      },
    })
  } catch (error) {
    console.error('[ADD_MEMBER_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/v1/organizations/members — list all members for caller's organization
export async function GET(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    if (!authUser.organizationId) {
      return NextResponse.json({ error: 'No organization context found.' }, { status: 400 })
    }

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: authUser.organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            mobile: true,
          },
        },
        customRole: true,
        groups: {
          include: {
            group: {
              select: {
                name: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('[GET_MEMBERS_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
