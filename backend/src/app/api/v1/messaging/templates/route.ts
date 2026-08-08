import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

export async function GET(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    const templates = await prisma.messageTemplate.findMany({
      where: {
        organizationId: authUser.organizationId
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('[TEMPLATES_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    const body = await req.json()
    const { name, content, channel } = body
    
    if (!name || !content || !channel) {
      return NextResponse.json({ error: 'Name, content, and channel are required' }, { status: 400 })
    }

    const template = await prisma.messageTemplate.create({
      data: {
        organizationId: authUser.organizationId!,
        name,
        content,
        channel
      }
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('[TEMPLATES_POST_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
