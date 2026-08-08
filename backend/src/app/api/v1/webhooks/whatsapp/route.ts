import { NextRequest, NextResponse } from 'next/server';

const VERIFY_TOKEN = 'ZYRON_SECURE_TOKEN_2026';

// Handles WhatsApp webhook verification challenge
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[WHATSAPP_WEBHOOK] Verification successful');
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    console.warn('[WHATSAPP_WEBHOOK] Verification failed. Invalid token.');
    return new NextResponse('Forbidden', { status: 403 });
  } catch (error) {
    console.error('[WHATSAPP_WEBHOOK_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handles incoming WhatsApp messages and status updates
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Log incoming payload for testing purposes
    console.log('[WHATSAPP_WEBHOOK_POST] Received payload:', JSON.stringify(body, null, 2));

    // WhatsApp requires a 200 OK response to acknowledge receipt
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  } catch (error) {
    console.error('[WHATSAPP_WEBHOOK_POST_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
