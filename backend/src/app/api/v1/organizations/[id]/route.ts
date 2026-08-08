import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireSuperAdmin } from '@/core/auth/middleware'

interface Params {
  params: { id: string }
}

// GET /api/v1/organizations/:id
export async function GET(req: NextRequest, { params }: Params) {
  const authUser = requireSuperAdmin(req)
  if (authUser instanceof NextResponse) return authUser

  const org = await prisma.organization.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: true } },
      modules: { include: { module: true } },
    },
  })

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  return NextResponse.json({ organization: org })
}

// PATCH /api/v1/organizations/:id — update status/name
export async function PATCH(req: NextRequest, { params }: Params) {
  const authUser = requireSuperAdmin(req)
  if (authUser instanceof NextResponse) return authUser

  const body = await req.json()
  const { name, status } = body

  const org = await prisma.organization.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      ...(status && { status }),
    },
  })

  return NextResponse.json({ organization: org })
}

// DELETE /api/v1/organizations/:id
export async function DELETE(req: NextRequest, { params }: Params) {
  const authUser = requireSuperAdmin(req)
  if (authUser instanceof NextResponse) return authUser

  await prisma.organization.delete({ where: { id: params.id } })

  return NextResponse.json({ message: 'Organization deleted' })
}
