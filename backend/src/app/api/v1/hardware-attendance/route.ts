import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { attendanceQueue } from '@/core/queues/attendanceQueue'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
    }

    // Expecting "Bearer <webhookSecret>" or just the secret
    const secret = authHeader.replace('Bearer ', '').trim()

    // 1. Verify organization by webhook secret
    const org = await prisma.organization.findUnique({
      where: { webhookSecret: secret },
    })

    if (!org) {
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
    }

    // 2. Parse payload from hardware machine
    const body = await req.json()
    const { hardwareId, timestamp, verifyMethod } = body

    if (!hardwareId) {
      return NextResponse.json({ error: 'Missing hardwareId' }, { status: 400 })
    }

    // Push to Redis Queue for async processing
    await attendanceQueue.add('process-attendance', {
      orgId: org.id,
      hardwareId: hardwareId.toString(),
      timestamp,
      verifyMethod,
    });

    return NextResponse.json({ success: true, message: 'Attendance payload queued successfully' })

  } catch (error) {
    console.error('[HARDWARE_WEBHOOK_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
