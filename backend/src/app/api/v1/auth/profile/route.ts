import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

export async function PATCH(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    const { theme, firstName, lastName } = await req.json()

    const updatedUser = await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        ...(theme !== undefined && { theme }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
      }
    })

    return NextResponse.json({ user: { id: updatedUser.id, theme: updatedUser.theme, firstName: updatedUser.firstName, lastName: updatedUser.lastName } })
  } catch (error) {
    console.error('[PROFILE_UPDATE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
