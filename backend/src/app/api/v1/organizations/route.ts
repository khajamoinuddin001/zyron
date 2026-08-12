import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireSuperAdmin, requireAuth } from '@/core/auth/middleware'

// GET /api/v1/organizations
// Super admin gets all orgs; org admin gets their own
export async function GET(req: NextRequest) {
  try {
    console.log("ACTUAL DB URL FROM NEXTJS:", process.env.DATABASE_URL);
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    if (authUser.isSuperAdmin) {
      const organizations = await prisma.organization.findMany({
        include: {
          members: { include: { user: true } },
          modules: { include: { module: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ organizations })
    }

    // Org admin — return only their organization
    if (!authUser.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: authUser.organizationId },
      include: {
        members: { include: { user: true } },
        modules: { include: { module: true } },
      },
    })

    return NextResponse.json({ organizations: organization ? [{ ...organization, terminology: organization.terminology }] : [] })
  } catch (error) {
    console.error('[ORGS_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/organizations  — Super admin only
export async function POST(req: NextRequest) {
  const authUser = requireSuperAdmin(req)
  if (authUser instanceof NextResponse) return authUser

  const body = await req.json()
  const { name, domain, terminology } = body

  if (!name) {
    return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
  }

  const organization = await prisma.organization.create({
    data: {
      name,
      domain: domain ?? null,
      status: 'ACTIVE',
    },
  })

  return NextResponse.json({ organization }, { status: 201 })
}
