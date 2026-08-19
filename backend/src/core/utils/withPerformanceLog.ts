import { NextRequest, NextResponse } from 'next/server';
import prisma from '../database/prisma';
import { getAuthUser } from '../auth/middleware';

type Handler = (req: NextRequest, params?: any) => Promise<NextResponse>;

export function withPerformanceLog(handler: Handler, endpointName: string): Handler {
  return async (req: NextRequest, params?: any) => {
    const start = Date.now();
    let statusCode = 500;
    let errorMessage: string | null = null;
    let response: NextResponse;

    try {
      response = await handler(req, params);
      statusCode = response.status;
    } catch (error: any) {
      errorMessage = error.message || String(error);
      response = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const durationMs = Date.now() - start;

    // Log if slow (>= 1000ms) or if it's an error (>= 400)
    if (durationMs >= 1000 || statusCode >= 400) {
      // Extract user info if possible (non-blocking)
      const user = getAuthUser(req);
      
      // Fire-and-forget save to DB
      Promise.resolve().then(() => {
        prisma.systemLog.create({
          data: {
            endpoint: endpointName,
            method: req.method,
            durationMs,
            statusCode,
            errorMessage,
            organizationId: user?.organizationId || null,
            userId: user?.userId || null,
          }
        }).catch(err => {
          console.error('[SYSTEM_LOG_ERROR] Failed to save log:', err);
        });
      });
    }

    return response;
  };
}
