import { attendanceWorker } from './src/core/workers/attendanceWorker';

console.log('Worker started. Listening for hardware attendance jobs...');

// Keep process alive
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await attendanceWorker.close();
  process.exit(0);
});
