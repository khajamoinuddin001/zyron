import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

// GET /api/v1/organizations/modules – list installed modules with billing info
export async function GET(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    const installedModules = await prisma.organizationModule.findMany({
      where: {
        organizationId: authUser.organizationId!,
        status: 'ACTIVE'
      },
      include: {
        module: true
      },
      orderBy: { installedAt: 'asc' }
    })

    return NextResponse.json({ modules: installedModules })
  } catch (error) {
    console.error('[MODULES_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/organizations/modules – install/uninstall a module
export async function POST(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    if (authUser.role !== 'ORG_ADMIN' && !authUser.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { moduleKey, action, cardLast4, cardExpiry, cardHolder } = await req.json()

    if (!moduleKey || !['install', 'uninstall'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const platformModule = await prisma.platformModule.findUnique({
      where: { key: moduleKey }
    })

    if (!platformModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    if (action === 'install') {
      // Calculate first billing date = today (first charge on install)
      const now = new Date()
      const nextMonth = new Date(now)
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      await prisma.organizationModule.upsert({
        where: {
          organizationId_moduleId: {
            organizationId: authUser.organizationId!,
            moduleId: platformModule.id
          }
        },
        update: {
          status: 'ACTIVE',
          billingStatus: 'ACTIVE',
          lastBilledAt: now,
          nextBillAt: nextMonth,
          graceEndsAt: null,
          // Update card info if provided
          ...(cardLast4 ? { cardLast4, cardExpiry, cardHolder } : {})
        },
        create: {
          organizationId: authUser.organizationId!,
          moduleId: platformModule.id,
          status: 'ACTIVE',
          billingStatus: 'ACTIVE',
          lastBilledAt: now,
          nextBillAt: nextMonth,
          cardLast4: cardLast4 || null,
          cardExpiry: cardExpiry || null,
          cardHolder: cardHolder || null,
        }
      })
    } else {
      // Uninstall - fully delete the record
      await prisma.organizationModule.delete({
        where: {
          organizationId_moduleId: {
            organizationId: authUser.organizationId!,
            moduleId: platformModule.id
          }
        }
      }).catch(() => {}) // Ignore if not installed
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[MODULE_ACTION_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
