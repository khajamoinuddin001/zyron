import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/core/database/prisma';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const domain = url.searchParams.get('domain');

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { domain },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        theme: true,
        publicWebsite: true
      }
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: org.id,
      name: org.name,
      logoUrl: org.logoUrl,
      theme: org.theme,
      publicWebsite: org.publicWebsite
    });

  } catch (error) {
    console.error('[BRANDING_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
