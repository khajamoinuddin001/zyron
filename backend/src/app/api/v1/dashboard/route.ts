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
    const trendParam = url.searchParams.get('trend') || '7';
    const trendDays = parseInt(trendParam, 10);

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    const attWhere: any = { organizationId: orgId };
    
    // 1. Total Students & Group Member Filtering
    let totalStudents = 0;
    if (groupId) {
      const groupMembers = await prisma.organizationGroupMember.findMany({
        where: { groupId }
      });
      totalStudents = groupMembers.length;
      attWhere.memberId = { in: groupMembers.map(gm => gm.memberId) };
    } else {
      totalStudents = await prisma.organizationMember.count({
        where: { organizationId: orgId, role: 'STUDENT', status: 'ACTIVE' }
      });
    }

    // 2. Target Date Attendance
    const todayAttendance = await prisma.attendanceRecord.findMany({
      where: { ...attWhere, date: targetDate },
      select: { status: true }
    });

    let presentToday = 0;
    let absentToday = 0;
    todayAttendance.forEach(a => {
      if (a.status === 'PRESENT') presentToday++;
      else if (a.status === 'ABSENT') absentToday++;
    });

    const presentPercent = totalStudents > 0 ? (presentToday / totalStudents) * 100 : 0;
    const absentPercent = totalStudents > 0 ? (absentToday / totalStudents) * 100 : 0;

    // 3. Classes Today (Total Groups)
    let classesToday = 1;
    if (!groupId) {
      classesToday = await prisma.organizationGroup.count({
        where: { organizationId: orgId }
      });
    }

    // 4. Attendance Trend (dynamic based on trendDays)
    const trendStartDate = new Date(targetDate);
    trendStartDate.setUTCHours(0,0,0,0);
    trendStartDate.setDate(trendStartDate.getDate() - (trendDays - 1));

    const weekAttendance = await prisma.attendanceRecord.findMany({
      where: { ...attWhere, date: { gte: trendStartDate, lte: targetDate } },
      select: { date: true, status: true }
    });

    let attendanceTrend = [];

    if (trendDays === 365) {
      // Bucket by month
      const monthlyMap: Record<string, { total: number, present: number }> = {};
      
      // Initialize last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(targetDate);
        d.setMonth(d.getMonth() - i);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[mKey] = { total: 0, present: 0 };
      }

      weekAttendance.forEach(a => {
        const mKey = `${a.date.getFullYear()}-${String(a.date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[mKey]) {
          monthlyMap[mKey].total++;
          if (a.status === 'PRESENT') monthlyMap[mKey].present++;
        }
      });

      attendanceTrend = Object.keys(monthlyMap).map(mKey => {
        const { total, present } = monthlyMap[mKey];
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        const [year, month] = mKey.split('-');
        const dObj = new Date(parseInt(year), parseInt(month) - 1, 1);
        const label = dObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); // e.g. "Jan '25"
        return { label, value: percentage };
      });
    } else {
      // Bucket by day (for 7 or 30 days)
      const trendMap: Record<string, { total: number, present: number }> = {};
      for (let i = trendDays - 1; i >= 0; i--) {
        const d = new Date(targetDate);
        d.setUTCHours(0,0,0,0);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        trendMap[ds] = { total: 0, present: 0 };
      }

      weekAttendance.forEach(a => {
        const ds = a.date.toISOString().split('T')[0];
        if (trendMap[ds]) {
          trendMap[ds].total++;
          if (a.status === 'PRESENT') trendMap[ds].present++;
        }
      });

      attendanceTrend = Object.keys(trendMap).map(date => {
        const { total, present } = trendMap[date];
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        const dObj = new Date(date);
        const label = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return { label, value: percentage };
      });
    }

    // 5. Top Absent Students
    const monthStart = new Date(targetDate);
    monthStart.setUTCHours(0,0,0,0);
    monthStart.setDate(1);

    const absentRecords = await prisma.attendanceRecord.groupBy({
      by: ['memberId'],
      where: {
        ...attWhere,
        status: 'ABSENT',
        date: { gte: monthStart }
      },
      _count: { status: true },
      orderBy: { _count: { status: 'desc' } },
      take: 5
    });

    const topAbsentStudents = [];
    if (absentRecords.length > 0) {
      const memberIds = absentRecords.map(r => r.memberId);
      const members = await prisma.organizationMember.findMany({
        where: { id: { in: memberIds } },
        include: { user: { select: { firstName: true, lastName: true } } }
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
          topAbsentStudents.push({
            name: `${member.user.firstName} ${member.user.lastName || ''}`.trim(),
            group: 'Class',
            percentage: percentage > 100 ? 100 : percentage
          });
        }
      }
    }

    // 6. Recent Activity
    const recentActivity = [];
    if (!groupId) {
      const recentMembers = await prisma.organizationMember.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { firstName: true, lastName: true } } }
      });
      recentMembers.forEach(m => {
        recentActivity.push({
          time: m.createdAt,
          action: `New ${m.role.toLowerCase()} member added: ${m.user.firstName} ${m.user.lastName || ''}`
        });
      });
    }

    return NextResponse.json({
      totalStudents,
      presentToday,
      presentPercent: presentPercent.toFixed(1),
      absentToday,
      absentPercent: absentPercent.toFixed(1),
      classesToday,
      attendanceTrend,
      topAbsentStudents,
      recentActivity
    });
  } catch (error) {
    console.error('[DASHBOARD_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
