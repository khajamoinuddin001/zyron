import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { verifyPassword } from '@/core/auth/password'
import { signToken } from '@/core/auth/jwt'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email or Mobile Number and password are required' },
        { status: 400 }
      )
    }

    const isEmail = email.includes('@')

    // Find user by email or mobile, include memberships with org modules and custom role's allowed modules
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: email.toLowerCase().trim() } : { mobile: email.trim() },
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
            customRole: {
              include: {
                allowedModules: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Determine org context (first active membership)
    const activeMembership = user.memberships.find(
      (m) => m.status === 'ACTIVE'
    )

    if (!user.isSuperAdmin && activeMembership?.organization?.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Your organization account has been suspended. Please contact support.' }, { status: 403 })
    }

    if (activeMembership?.role === 'STAFF' && activeMembership?.customRole && !activeMembership.customRole.isActive) {
      return NextResponse.json({ error: 'Your role has been disabled by the organization administrator.' }, { status: 403 })
    }

    // Compute active modules:
    // - ORG_ADMIN gets all org-installed active modules
    // - STAFF gets intersection: org modules ∩ role's allowedModules
    const orgModuleKeys = activeMembership?.organization?.modules
      ?.map(m => m.module.key) || []

    let activeModules: string[]
    if (activeMembership?.role === 'ORG_ADMIN' || user.isSuperAdmin) {
      activeModules = orgModuleKeys
    } else if (activeMembership?.customRole?.isActive && activeMembership?.customRole?.allowedModules?.length) {
      const roleAllowedKeys = activeMembership.customRole.allowedModules.map(m => m.key)
      activeModules = orgModuleKeys.filter(k => roleAllowedKeys.includes(k))
    } else {
      // Role is disabled or has no modules configured — show nothing
      activeModules = []
    }

    // Sign JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      organizationId: activeMembership?.organizationId,
      role: activeMembership?.role,
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isSuperAdmin: user.isSuperAdmin,
        theme: user.theme,
        organization: activeMembership?.organization ?? null,
        role: activeMembership?.role ?? null,
        activeModules,
      },
    })
  } catch (error) {
    console.error('[LOGIN_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
