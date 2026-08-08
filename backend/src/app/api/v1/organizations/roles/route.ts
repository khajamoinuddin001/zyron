import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

// GET /api/v1/organizations/roles — list all custom roles for the org
export async function GET(req: NextRequest) {
  const authUser = requireAuth(req)
  if (authUser instanceof NextResponse) return authUser

  if (!authUser.organizationId) {
    return NextResponse.json({ error: 'No organization context.' }, { status: 400 })
  }

  try {
    const roles = await prisma.organizationRole.findMany({
      where: { organizationId: authUser.organizationId },
      include: {
        _count: { select: { members: true } },
        allowedModules: { select: { id: true, key: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ roles })
  } catch (error) {
    console.error('[GET_ROLES_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/organizations/roles — create a new custom role with optional module access
export async function POST(req: NextRequest) {
  const authUser = requireAuth(req)
  if (authUser instanceof NextResponse) return authUser

  if (authUser.role !== 'ORG_ADMIN' && !authUser.isSuperAdmin) {
    return NextResponse.json({ error: 'Only Org Admins can manage roles.' }, { status: 403 })
  }

  if (!authUser.organizationId) {
    return NextResponse.json({ error: 'No organization context.' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { name, description, allowedModuleIds = [] } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Role name is required.' }, { status: 400 })
    }

    const role = await prisma.organizationRole.create({
      data: {
        organizationId: authUser.organizationId,
        name: name.trim(),
        description: description?.trim() || null,
        allowedModules: {
          connect: (allowedModuleIds as string[]).map((id: string) => ({ id })),
        },
      },
      include: {
        allowedModules: { select: { id: true, key: true, name: true } },
      },
    })

    return NextResponse.json({ role }, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'A role with this name already exists.' }, { status: 409 })
    }
    console.error('[CREATE_ROLE_ERROR]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
