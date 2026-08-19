import { Worker } from 'bullmq';
import { redis } from '../redis/client';
import prisma from '../database/prisma';

export const attendanceWorker = new Worker(
  'hardware-attendance',
  async (job) => {
    const { orgId, hardwareId, timestamp, verifyMethod } = job.data;

    // 1. Find the member by hardwareId
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_biometricHardwareId: {
          organizationId: orgId,
          biometricHardwareId: hardwareId,
        },
      },
    });

    if (!member) {
      throw new Error(`User not mapped to hardware ID ${hardwareId} in org ${orgId}`);
    }

    // 2. Mark attendance
    const pushDate = timestamp ? new Date(timestamp) : new Date();
    
    // Set time to midnight UTC for the attendance date record
    const dateOnly = new Date(pushDate);
    dateOnly.setUTCHours(0, 0, 0, 0);

    // Check if attendance is already marked for today
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        memberId_date: {
          memberId: member.id,
          date: dateOnly,
        },
      },
    });

    if (existing) {
      return { success: true, message: 'Already marked present today' };
    }

    await prisma.attendanceRecord.create({
      data: {
        memberId: member.id,
        organizationId: orgId,
        date: dateOnly,
        status: 'PRESENT',
        notes: `Marked via Hardware (${verifyMethod || 'Unknown'}) at ${pushDate.toISOString()}`,
      },
    });

    return { success: true, memberId: member.id };
  },
  {
    connection: redis,
    concurrency: 50, // Process 50 jobs concurrently
  }
);

attendanceWorker.on('completed', (job) => {
  console.log(`[ATTENDANCE_WORKER] Job ${job.id} completed successfully.`);
});

attendanceWorker.on('failed', (job, err) => {
  console.error(`[ATTENDANCE_WORKER] Job ${job?.id} failed:`, err.message);
});
