import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
    }

    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 400 })
    }

    if (invite.isUsed) {
      return NextResponse.json({ error: 'This invite link has already been used' }, { status: 400 })
    }

    return NextResponse.json({ invite })
  } catch (error: any) {
    console.error('Get Invite Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invite details' },
      { status: 500 }
    )
  }
}
