import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireAuth } from '@/core/auth/middleware'

export async function POST(req: NextRequest) {
  try {
    const authUser = requireAuth(req)
    if (authUser instanceof NextResponse) return authUser

    const body = await req.json()
    const { templateId, recipientIds, customContent, channel: customChannel } = body
    
    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json({ error: 'Recipients are required' }, { status: 400 })
    }

    let content = customContent
    let channel = customChannel || 'SYSTEM'

    if (templateId) {
      const template = await prisma.messageTemplate.findUnique({
        where: { id: templateId, organizationId: authUser.organizationId }
      })
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      content = template.content
      channel = template.channel
    }

    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Fetch members to get contact info
    const members = await prisma.organizationMember.findMany({
      where: {
        id: { in: recipientIds },
        organizationId: authUser.organizationId
      },
      include: { user: true }
    })

    const logsToCreate = members.map(m => {
      // Basic variable replacement
      const personalizedContent = content
        .replace(/{name}/g, m.user.firstName)
        .replace(/{first_name}/g, m.user.firstName)
        .replace(/{last_name}/g, m.user.lastName || '')
        .replace(/{date}/g, new Date().toISOString().split('T')[0])

      return {
        organizationId: authUser.organizationId!,
        recipient: m.user.email, // using email as contact for now
        channel: channel,
        content: personalizedContent,
        status: 'SENT' // Mock sending
      }
    })

    if (logsToCreate.length > 0) {
      await prisma.messageLog.createMany({ data: logsToCreate })
    }

    return NextResponse.json({ message: `Successfully sent ${logsToCreate.length} messages` }, { status: 200 })
  } catch (error) {
    console.error('[MESSAGING_SEND_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
