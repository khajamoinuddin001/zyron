import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

export async function GET(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get('date')
    const groupId = searchParams.get('groupId')
    
    if (!dateStr) {
      return NextResponse.json({ error: 'Date is required (YYYY-MM-DD)' }, { status: 400 })
    }

    const date = new Date(dateStr)
    date.setUTCHours(0, 0, 0, 0)

    const whereClause: any = {
      organizationId: authUser.organizationId,
      date: date
    }
    
    if (groupId) {
      whereClause.groupId = groupId
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error('[ATTENDANCE_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    const body = await req.json()
    const { date: dateStr, groupId, records, notifyAbsent } = body // records: { memberId, status }[]
    
    if (!dateStr || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const date = new Date(dateStr)
    date.setUTCHours(0, 0, 0, 0)

    const isOrgAdmin = authUser.role === 'ORG_ADMIN' || authUser.isSuperAdmin;

    if (!isOrgAdmin && groupId) {
      // Check if attendance was already submitted for this group today
      const existingRecord = await prisma.attendanceRecord.findFirst({
        where: {
          organizationId: authUser.organizationId!,
          groupId: groupId,
          date: date
        }
      });
      
      if (existingRecord) {
        return NextResponse.json({ error: 'Attendance for this group has already been submitted today. Only an administrator can modify it.' }, { status: 403 });
      }
    }

    // Check if date is a holiday
    const holiday = await prisma.organizationHoliday.findFirst({
      where: {
        organizationId: authUser.organizationId!,
        date: date
      }
    });
    
    if (holiday && !isOrgAdmin) {
       return NextResponse.json({ error: `Cannot submit attendance. ${dateStr} is a declared holiday: ${holiday.name}` }, { status: 403 });
    }

    // Upsert each record in batches of 100 to prevent large transaction lockups
    const chunkSize = 100;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      
      const upserts = chunk.map((record: any) => 
        prisma.attendanceRecord.upsert({
        where: {
          organizationId_memberId_date: {
            organizationId: authUser.organizationId!,
            memberId: record.memberId,
            date: date
          }
        },
        update: {
          status: record.status,
          groupId: groupId || null,
          markedById: authUser.userId
        },
        create: {
          organizationId: authUser.organizationId!,
          memberId: record.memberId,
          groupId: groupId || null,
          date: date,
          status: record.status,
          markedById: authUser.userId
        }
      })
    )

      await prisma.$transaction(upserts)
    }

    if (notifyAbsent) {
      const absentRecords = records.filter((r: any) => r.status === 'ABSENT')
      if (absentRecords.length > 0) {
        
        // Fetch Org settings for absent template
        const org = await prisma.organization.findUnique({
          where: { id: authUser.organizationId! },
          select: { absentTemplateId: true }
        });
        
        let templateContent = `Automated Notification: {name} was marked ABSENT on {date}`;
        let templateChannel = 'SYSTEM';
        
        if (org?.absentTemplateId) {
          const tpl = await prisma.messageTemplate.findUnique({
            where: { id: org.absentTemplateId }
          });
          if (tpl) {
            templateContent = tpl.content;
            templateChannel = tpl.channel;
          }
        }

        // Fetch members to get their emails/phones
        const members = await prisma.organizationMember.findMany({
          where: {
            id: { in: absentRecords.map((r: any) => r.memberId) }
          },
          include: { user: true }
        })

        const logsToCreate = members.map(m => {
          const content = templateContent
            .replace(/{name}/g, m.user.firstName)
            .replace(/{first_name}/g, m.user.firstName)
            .replace(/{last_name}/g, m.user.lastName || '')
            .replace(/{date}/g, dateStr);

          return {
            organizationId: authUser.organizationId!,
            recipient: m.user.email,
            channel: templateChannel,
            content,
            status: 'SENT'
          };
        });

        if (logsToCreate.length > 0) {
          await prisma.messageLog.createMany({ data: logsToCreate })
        }
      }
    }

    return NextResponse.json({ message: 'Attendance updated successfully' })
  } catch (error) {
    console.error('[ATTENDANCE_POST_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
