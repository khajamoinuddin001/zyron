import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

// GET /api/v1/platform/modules — all available modules
export async function GET(req: NextRequest) {
  const authUser = requireAuth(req)
  if (authUser instanceof NextResponse) return authUser

  const modules = await prisma.platformModule.findMany({
    include: {
      organizations: true,
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ modules })
}
