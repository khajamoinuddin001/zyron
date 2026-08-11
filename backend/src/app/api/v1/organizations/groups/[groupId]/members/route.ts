import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    const groupId = params.groupId

    const members = await prisma.organizationGroupMember.findMany({
      where: { 
        groupId,
        group: { organizationId: authUser.organizationId! }
      },
      include: {
        member: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            customRole: true
          }
        }
      }
    })

    return NextResponse.json({ members: members.map(m => m.member) })
  } catch (error) {
    console.error('[GROUP_MEMBERS_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    const isOrgAdmin = authUser.role === 'ORG_ADMIN';
    const hasAttendance = authUser.activeModules?.includes('attendance');

    if (!isOrgAdmin && !hasAttendance) {
      return NextResponse.json({ error: 'Unauthorized to manage group members' }, { status: 403 })
    }

    const groupId = params.groupId
    const { memberIds } = await req.json() // Array of member IDs to sync

    if (!Array.isArray(memberIds)) {
      return NextResponse.json({ error: 'memberIds must be an array' }, { status: 400 })
    }

    // Verify group belongs to org
    const group = await prisma.organizationGroup.findUnique({
      where: { id: groupId, organizationId: authUser.organizationId! }
    })
    
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    // Find which members are students
    const membersData = await prisma.organizationMember.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, role: true }
    })
    
    const studentIds = membersData.filter(m => m.role === 'STUDENT').map(m => m.id)

    const transactionTasks: any[] = [
      prisma.organizationGroupMember.deleteMany({
        where: { groupId }
      })
    ]

    // If this group is a CLASS, remove the selected students from any other CLASS
    if (group.type === 'CLASS' && studentIds.length > 0) {
      transactionTasks.push(
        prisma.organizationGroupMember.deleteMany({
          where: {
            memberId: { in: studentIds },
            group: { type: 'CLASS' }
          }
        })
      )
    }

    if (memberIds.length > 0) {
      transactionTasks.push(
        prisma.organizationGroupMember.createMany({
          data: memberIds.map(id => ({
            groupId,
            memberId: id
          }))
        })
      )
    }

    await prisma.$transaction(transactionTasks)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[GROUP_MEMBERS_POST_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
