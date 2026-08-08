import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

export async function GET(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    if (!authUser.organizationId) {
      return NextResponse.json({ error: 'No organization context found.' }, { status: 400 })
    }

    const orgId = authUser.organizationId;
    const url = new URL(req.url);
    const groupId = url.searchParams.get('groupId');
    const dateParam = url.searchParams.get('date');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    const attWhere: any = { organizationId: orgId };
    
    if (groupId) {
      const groupMembers = await prisma.organizationGroupMember.findMany({
        where: { groupId }
      });
      attWhere.memberId = { in: groupMembers.map(gm => gm.memberId) };
    }

    const monthStart = new Date(targetDate);
    monthStart.setUTCHours(0,0,0,0);
    monthStart.setDate(1);

    // Pagination variables
    const skip = (page - 1) * limit;

    const [absentRecords, totalGrouped] = await Promise.all([
      prisma.attendanceRecord.groupBy({
        by: ['memberId'],
        where: {
          ...attWhere,
          status: 'ABSENT',
          date: { gte: monthStart, lte: targetDate }
        },
        _count: { status: true },
        orderBy: { _count: { status: 'desc' } },
        skip,
        take: limit
      }),
      prisma.attendanceRecord.groupBy({
        by: ['memberId'],
        where: {
          ...attWhere,
          status: 'ABSENT',
          date: { gte: monthStart, lte: targetDate }
        }
      })
    ]);
    
    const totalRecords = totalGrouped.length;
    const totalPages = Math.ceil(totalRecords / limit);

    const topAbsentStudents = [];
    if (absentRecords.length > 0) {
      const memberIds = absentRecords.map(r => r.memberId);
      const members = await prisma.organizationMember.findMany({
        where: { id: { in: memberIds } },
        include: { 
          user: { select: { firstName: true, lastName: true, email: true } },
          groups: { include: { group: true } }
        }
      });

      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { workingDays: true }
      });
      const orgWorkingDays = org?.workingDays ? JSON.parse(org.workingDays) : [1,2,3,4,5,6];

      const holidays = await prisma.organizationHoliday.findMany({
        where: {
          organizationId: orgId,
          date: { gte: monthStart, lte: targetDate }
        }
      });
      const holidayDates = holidays.map(h => h.date.toISOString().split('T')[0]);

      const todayDateNum = targetDate.getDate();
      let workingDays = 0;
      for (let i = 1; i <= todayDateNum; i++) {
        const d = new Date(targetDate.getFullYear(), targetDate.getMonth(), i);
        const dateString = d.toISOString().split('T')[0];
        if (orgWorkingDays.includes(d.getDay()) && !holidayDates.includes(dateString)) {
          workingDays++;
        }
      }
      if (workingDays === 0) workingDays = 1;

      for (const record of absentRecords) {
        const member = members.find(m => m.id === record.memberId);
        if (member) {
          const absentCount = record._count.status;
          const percentage = Math.round((absentCount / workingDays) * 100);
          
          let groupName = 'Unassigned';
          if (member.groups && member.groups.length > 0) {
            groupName = member.groups[0].group.name;
          }

          topAbsentStudents.push({
            id: member.id,
            name: `${member.user.firstName} ${member.user.lastName || ''}`.trim(),
            email: member.user.email,
            group: groupName,
            absentCount: absentCount,
            workingDays: workingDays,
            percentage: percentage > 100 ? 100 : percentage
          });
        }
      }
    }

    return NextResponse.json({
      students: topAbsentStudents,
      pagination: {
        page,
        limit,
        total: totalRecords,
        totalPages
      }
    });
  } catch (error) {
    console.error('[TOP_ABSENT_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
