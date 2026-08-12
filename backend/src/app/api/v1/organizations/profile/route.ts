import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

// GET /api/v1/organizations/profile
export async function GET(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    if (!authUser.organizationId) {
      return NextResponse.json({ error: 'No organization context.' }, { status: 400 })
    }

    const org = await prisma.organization.findUnique({
      where: { id: authUser.organizationId },
      select: { id: true, name: true, domain: true, logoUrl: true, theme: true, status: true, terminology: true },
    })

    if (!org) {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 })
    }

    return NextResponse.json({ organization: org })
  } catch (error) {
    console.error('[GET_ORG_PROFILE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/v1/organizations/profile
export async function PATCH(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    if (authUser.role !== 'ORG_ADMIN' && !authUser.isSuperAdmin) {
      return NextResponse.json({ error: 'Only Org Admins can update the organization profile.' }, { status: 403 })
    }

    if (!authUser.organizationId) {
      return NextResponse.json({ error: 'No organization context.' }, { status: 400 })
    }

    const body = await req.json()
    const { name, logoUrl, theme, terminology } = body

    const updated = await prisma.organization.update({
      where: { id: authUser.organizationId },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(theme !== undefined && { theme }),
        ...(terminology !== undefined && { terminology }),
      },
      select: { id: true, name: true, domain: true, logoUrl: true, theme: true, status: true, terminology: true },
    })

    return NextResponse.json({ organization: updated })
  } catch (error) {
    console.error('[PATCH_ORG_PROFILE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
