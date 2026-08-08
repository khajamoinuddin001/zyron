import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

export async function GET(req: NextRequest) {
  const authUser = requireAuth(req)
  if (authUser instanceof NextResponse) return authUser

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
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
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const activeMembership = user.memberships.find((m) => m.status === 'ACTIVE')

  if (!user.isSuperAdmin && activeMembership?.organization?.status === 'SUSPENDED') {
    return NextResponse.json({ error: 'Your organization account has been suspended. Please contact support.' }, { status: 403 })
  }

  if (activeMembership?.role === 'STAFF' && activeMembership?.customRole && !activeMembership.customRole.isActive) {
    return NextResponse.json({ error: 'Your role has been disabled by the organization administrator.' }, { status: 403 })
  }

  // Compute active modules: ORG_ADMIN gets all, STAFF gets intersection with role's allowedModules
  const orgModuleKeys = activeMembership?.organization?.modules
    ?.map(m => m.module.key) || []

  let activeModules: string[]
  if (activeMembership?.role === 'ORG_ADMIN' || user.isSuperAdmin) {
    activeModules = orgModuleKeys
  } else if (activeMembership?.customRole?.isActive && activeMembership?.customRole?.allowedModules?.length) {
    const roleAllowedKeys = activeMembership.customRole.allowedModules.map(m => m.key)
    activeModules = orgModuleKeys.filter(k => roleAllowedKeys.includes(k))
  } else {
    activeModules = []
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isSuperAdmin: user.isSuperAdmin,
    theme: user.theme,
    organization: activeMembership?.organization ?? null,
    role: activeMembership?.role ?? null,
    activeModules,
  })
}
