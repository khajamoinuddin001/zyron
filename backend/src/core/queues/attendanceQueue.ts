import { Queue } from 'bullmq';
import { redis } from '../redis/client';

export const attendanceQueue = new Queue('hardware-attendance', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true, // Don't bloat Redis with old completed jobs
    removeOnFail: false, // Keep failed jobs for debugging
  },
});
