import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireSuperAdmin } from '@/core/auth/middleware'

// GET /api/v1/platform/organizations – list all orgs for super admin
export async function GET(req: NextRequest) {
  try {
    const authUser = requireSuperAdmin(req)
    if (authUser instanceof NextResponse) return authUser

    const organizations = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            members: true,
            modules: true,
          }
        },
        modules: {
          where: { status: 'ACTIVE' },
          include: { module: true }
        }
      }
    })

    return NextResponse.json({ organizations })
  } catch (error) {
    console.error('[PLATFORM_ORGS_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/v1/platform/organizations – update an org's status
export async function PUT(req: NextRequest) {
  return updateStatus(req)
}

// PATCH also supported
export async function PATCH(req: NextRequest) {
  return updateStatus(req)
}

async function updateStatus(req: NextRequest) {
  try {
    const authUser = requireSuperAdmin(req)
    if (authUser instanceof NextResponse) return authUser

    const body = await req.json()
    const { organizationId, status, domain } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    const updateData: Record<string, any> = {}

    if (status) {
      const validStatuses = ['ACTIVE', 'SUSPENDED', 'PENDING']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
      }
      updateData.status = status
    }

    if (domain !== undefined) {
      // Allow setting domain to null (clear it) or a string
      updateData.domain = domain || null
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData
    })

    return NextResponse.json({ organization: updated })
  } catch (error) {
    console.error('[PLATFORM_ORGS_PUT_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/platform/organizations – super admin grants or revokes a module for an org
export async function POST(req: NextRequest) {
  try {
    const authUser = requireSuperAdmin(req)
    if (authUser instanceof NextResponse) return authUser

    const body = await req.json()
    const { organizationId, moduleKey, action } = body // action: 'grant' | 'revoke'

    if (!organizationId || !moduleKey || !['grant', 'revoke'].includes(action)) {
      return NextResponse.json({ error: 'organizationId, moduleKey, and action (grant|revoke) are required' }, { status: 400 })
    }

    const platformModule = await prisma.platformModule.findUnique({ where: { key: moduleKey } })
    if (!platformModule) {
      return NextResponse.json({ error: `Module "${moduleKey}" not found` }, { status: 404 })
    }

    if (action === 'grant') {
      await prisma.organizationModule.upsert({
        where: {
          organizationId_moduleId: { organizationId, moduleId: platformModule.id }
        },
        update: {
          status: 'ACTIVE',
          billingStatus: 'ACTIVE',
        },
        create: {
          organizationId,
          moduleId: platformModule.id,
          status: 'ACTIVE',
          billingStatus: 'ACTIVE',
          // Super admin grants bypass billing — no card required
          nextBillAt: null,
        }
      })
    } else {
      // Revoke — suspend the module (keep record for audit trail)
      await prisma.organizationModule.updateMany({
        where: { organizationId, moduleId: platformModule.id },
        data: { status: 'SUSPENDED', billingStatus: 'SUSPENDED' }
      })
    }

    return NextResponse.json({ success: true, action, moduleKey, organizationId })
  } catch (error) {
    console.error('[PLATFORM_ORGS_MODULE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/v1/platform/organizations?organizationId=... - delete an org and its related data
export async function DELETE(req: NextRequest) {
  try {
    const authUser = requireSuperAdmin(req)
    if (authUser instanceof NextResponse) return authUser

    const organizationId = req.nextUrl.searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    // Since some relations like OrganizationMember and OrganizationModule
    // don't have onDelete: Cascade, we need to delete them manually in a transaction.
    await prisma.$transaction([
      prisma.organizationMember.deleteMany({ where: { organizationId } }),
      prisma.organizationModule.deleteMany({ where: { organizationId } }),
      prisma.organization.delete({ where: { id: organizationId } })
    ])

    return NextResponse.json({ success: true, organizationId })
  } catch (error: any) {
    console.error('[PLATFORM_ORGS_DELETE_ERROR]', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
