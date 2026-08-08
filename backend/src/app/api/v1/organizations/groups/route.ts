import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

export async function GET(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    const groups = await prisma.organizationGroup.findMany({
      where: { organizationId: authUser.organizationId! },
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ groups })
  } catch (error) {
    console.error('[GROUPS_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    const isOrgAdmin = authUser.role === 'ORG_ADMIN';
    const hasAttendance = authUser.activeModules?.includes('attendance');

    if (!isOrgAdmin && !hasAttendance) {
      return NextResponse.json({ error: 'Unauthorized to manage groups' }, { status: 403 })
    }

    const { name, type } = await req.json()

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
    }

    const group = await prisma.organizationGroup.create({
      data: {
        organizationId: authUser.organizationId!,
        name,
        type
      }
    })

    return NextResponse.json({ group })
  } catch (error: any) {
    console.error('[GROUPS_POST_ERROR]', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A group with this name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
