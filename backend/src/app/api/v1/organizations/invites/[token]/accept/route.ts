import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { hashPassword, validatePassword } from '@/core/auth/password'
import { signToken } from '@/core/auth/jwt'

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const body = await req.json()
    const { firstName, lastName, email, mobile, password } = body

    if (!firstName || (!email && !mobile) || !password) {
      return NextResponse.json({ error: 'firstName, email or mobile, and password are required.' }, { status: 400 })
    }

    // Bypassed password validation to allow organization name as default password

    // Verify token
    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: { organization: true }
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
    }

    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 400 })
    }

    const orgNameSanitized = invite.organization.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'organization';
    const finalEmail = email ? email.toLowerCase().trim() : `${mobile}@${orgNameSanitized}.com`;

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

    // Create user, membership, assign group, and invalidate token in a transaction
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
          organizationId: invite.organizationId,
          role: invite.role,
        },
      })

      if (invite.groupId) {
        await tx.organizationGroupMember.create({
          data: {
            groupId: invite.groupId,
            memberId: membership.id,
          }
        })
      }

      // Invite is multi-use, so we do not mark it as used.

      return user
    })

    // Auto-login the newly created user
    // Include user details needed for the frontend
    const userWithDetails = await prisma.user.findUnique({
      where: { id: result.id },
      include: {
        memberships: {
          include: {
            organization: {
              include: {
                modules: {
                  where: { status: 'ACTIVE' },
                  include: { module: true },
                },
              },
            },
            customRole: true,
          },
        },
      },
    })

    if (!userWithDetails) {
      throw new Error('Failed to fetch newly created user context')
    }

    const authToken = signToken({
      userId: userWithDetails.id,
      email: userWithDetails.email,
      role: userWithDetails.role,
      isSuperAdmin: userWithDetails.isSuperAdmin,
    })

    // Set the JWT token in an HTTP-only cookie
    const response = NextResponse.json({
      message: 'Account created successfully',
      user: {
        id: userWithDetails.id,
        email: userWithDetails.email,
        mobile: userWithDetails.mobile,
        firstName: userWithDetails.firstName,
        lastName: userWithDetails.lastName,
        isSuperAdmin: userWithDetails.isSuperAdmin,
        organization: userWithDetails.memberships[0]?.organization || null,
        role: userWithDetails.memberships[0]?.customRole?.name || userWithDetails.memberships[0]?.role,
      },
      token: authToken,
    })

    response.cookies.set({
      name: 'auth_token',
      value: authToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: 'lax',
    })

    return response

  } catch (error: any) {
    console.error('Accept Invite Error:', error)
    return NextResponse.json(
      { error: 'Failed to process invite' },
      { status: 500 }
    )
  }
}
