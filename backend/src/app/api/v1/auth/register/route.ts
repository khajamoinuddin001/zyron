import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { hashPassword, validatePassword } from '@/core/auth/password'
import { signToken } from '@/core/auth/jwt'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { organizationName, domain, firstName, lastName, email, password } = body

    if (!organizationName || !firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.message },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Check if domain is already taken
    if (domain) {
      const existingOrg = await prisma.organization.findUnique({
        where: { domain: domain.trim().toLowerCase() },
      })

      if (existingOrg) {
        return NextResponse.json(
          { error: 'This domain is already in use' },
          { status: 409 }
        )
      }
    }

    // Create the organization, user, and link them, and add default modules
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          name: organizationName,
          domain: domain ? domain.trim().toLowerCase() : null,
          status: 'ACTIVE',
        },
      })

      // 2. Create User
      const passwordHash = await hashPassword(password)
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          firstName,
          lastName,
          isSuperAdmin: false,
        },
      })

      // 3. Link User to Org as ORG_ADMIN
      const membership = await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: 'ORG_ADMIN',
          status: 'ACTIVE',
        },
      })

      // 4. Get default modules
      const defaultModuleKeys = ['attendance', 'accounts', 'messaging']
      const platformModules = await tx.platformModule.findMany({
        where: { key: { in: defaultModuleKeys } },
      })

      // 5. Add default modules to org
      for (const mod of platformModules) {
        await tx.organizationModule.create({
          data: {
            organizationId: org.id,
            moduleId: mod.id,
            status: 'ACTIVE',
          },
        })
      }

      return { user, org, membership }
    })

    // Sign JWT
    const token = signToken({
      userId: result.user.id,
      email: result.user.email,
      isSuperAdmin: result.user.isSuperAdmin,
      organizationId: result.org.id,
      role: result.membership.role,
    })

    return NextResponse.json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        isSuperAdmin: result.user.isSuperAdmin,
        organization: result.org,
        role: result.membership.role,
        activeModules: defaultModuleKeys,
      },
    })
  } catch (error) {
    console.error('[REGISTER_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
