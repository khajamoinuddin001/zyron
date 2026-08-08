import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

// DELETE /api/v1/organizations/roles/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = requireAuth(req)
  if (authUser instanceof NextResponse) return authUser

  if (authUser.role !== 'ORG_ADMIN' && !authUser.isSuperAdmin) {
    return NextResponse.json({ error: 'Only Org Admins can delete roles.' }, { status: 403 })
  }

  if (!authUser.organizationId) {
    return NextResponse.json({ error: 'No organization context.' }, { status: 400 })
  }

  const role = await prisma.organizationRole.findFirst({
    where: { id: params.id, organizationId: authUser.organizationId },
  })

  if (!role) {
    return NextResponse.json({ error: 'Role not found.' }, { status: 404 })
  }

  await prisma.organizationRole.delete({ where: { id: params.id } })

  return NextResponse.json({ message: 'Role deleted successfully.' })
}

// PATCH /api/v1/organizations/roles/[id] — rename a role and update allowed modules
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = requireAuth(req)
  if (authUser instanceof NextResponse) return authUser

  if (authUser.role !== 'ORG_ADMIN' && !authUser.isSuperAdmin) {
    return NextResponse.json({ error: 'Only Org Admins can edit roles.' }, { status: 403 })
  }

  if (!authUser.organizationId) {
    return NextResponse.json({ error: 'No organization context.' }, { status: 400 })
  }

  const role = await prisma.organizationRole.findFirst({
    where: { id: params.id, organizationId: authUser.organizationId },
  })

  if (!role) {
    return NextResponse.json({ error: 'Role not found.' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const { name, description, allowedModuleIds, isActive } = body

    const updated = await prisma.organizationRole.update({
      where: { id: params.id },
      data: {
        name: name?.trim() || role.name,
        description: description?.trim() ?? role.description,
        ...(isActive !== undefined && { isActive }),
        ...(allowedModuleIds !== undefined && {
          allowedModules: {
            set: (allowedModuleIds as string[]).map((id: string) => ({ id })),
          },
        }),
      },
      include: {
        allowedModules: { select: { id: true, key: true, name: true } },
      },
    })

    return NextResponse.json({ role: updated })
  } catch (err) {
    console.error('[PATCH_ROLE_ERROR]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
