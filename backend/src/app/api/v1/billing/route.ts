import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/core/database/prisma'
import { requireSuperAdmin } from '@/core/auth/middleware'

const GRACE_DAYS = 3

/**
 * POST /api/v1/billing/process
 *
 * The billing engine. In production this would be called by a cron job
 * (e.g. daily at midnight). For the MVP a super admin can trigger it manually,
 * and the frontend simulates it running automatically.
 *
 * Rules:
 *  1. Any module where nextBillAt <= now AND billingStatus === 'ACTIVE':
 *     → Mock-charge the card (always succeeds in mock mode unless `simulateFail` is passed).
 *     → On SUCCESS: advance nextBillAt by 1 month, set lastBilledAt = now.
 *     → On FAILURE: set billingStatus = 'GRACE', set graceEndsAt = now + 3 days,
 *                   log a reminder notification.
 *
 *  2. Any module where graceEndsAt <= now AND billingStatus === 'GRACE':
 *     → billingStatus = 'SUSPENDED', status = 'SUSPENDED'
 *     → Log a suspension notification.
 *
 *  3. Modules in 'GRACE' within the window: send daily reminders (log to MessageLog).
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = requireSuperAdmin(req)
    if (authUser instanceof NextResponse) return authUser

    const body = await req.json().catch(() => ({}))
    const simulateFail: string[] = body.simulateFail || [] // module keys that should "fail"

    const now = new Date()
    const results = { charged: 0, failed: 0, suspended: 0, reminders: 0 }

    // ── Step 1: Process modules that are due for billing ──────────────────────
    const dueModules = await prisma.organizationModule.findMany({
      where: {
        billingStatus: 'ACTIVE',
        nextBillAt: { lte: now }
      },
      include: {
        module: true,
        organization: true
      }
    })

    for (const m of dueModules) {
      const paymentSuccess = !simulateFail.includes(m.module.key)

      if (paymentSuccess) {
        // Advance billing by one month, keeping the same day-of-month
        const next = new Date(m.nextBillAt!)
        next.setMonth(next.getMonth() + 1)

        await prisma.organizationModule.update({
          where: { id: m.id },
          data: {
            billingStatus: 'ACTIVE',
            lastBilledAt: now,
            nextBillAt: next,
            graceEndsAt: null
          }
        })

        // Log the successful charge
        await prisma.messageLog.create({
          data: {
            organizationId: m.organizationId,
            recipient: m.organization.name,
            channel: 'BILLING',
            content: `✅ Auto-charge successful: $${m.module.monthlyPrice} for ${m.module.name}. Next billing: ${next.toISOString().split('T')[0]}.`,
            status: 'SENT'
          }
        })
        results.charged++
      } else {
        // Payment failed → move to GRACE period
        const graceEnds = new Date(now)
        graceEnds.setDate(graceEnds.getDate() + GRACE_DAYS)

        await prisma.organizationModule.update({
          where: { id: m.id },
          data: {
            billingStatus: 'GRACE',
            graceEndsAt: graceEnds
          }
        })

        // Log a reminder
        await prisma.messageLog.create({
          data: {
            organizationId: m.organizationId,
            recipient: m.organization.name,
            channel: 'BILLING',
            content: `⚠️ Payment failed for ${m.module.name}. You have a ${GRACE_DAYS}-day grace period until ${graceEnds.toISOString().split('T')[0]}. Please update your payment method to avoid suspension.`,
            status: 'SENT'
          }
        })
        results.failed++
        results.reminders++
      }
    }

    // ── Step 2: Send daily reminders to modules in grace period ───────────────
    const inGrace = await prisma.organizationModule.findMany({
      where: {
        billingStatus: 'GRACE',
        graceEndsAt: { gt: now }
      },
      include: { module: true, organization: true }
    })

    for (const m of inGrace) {
      const daysLeft = Math.ceil((m.graceEndsAt!.getTime() - now.getTime()) / 86_400_000)
      await prisma.messageLog.create({
        data: {
          organizationId: m.organizationId,
          recipient: m.organization.name,
          channel: 'BILLING_REMINDER',
          content: `🔔 Reminder: ${m.module.name} payment is overdue. ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left before suspension. Update your payment method now.`,
          status: 'SENT'
        }
      })
      results.reminders++
    }

    // ── Step 3: Suspend expired grace period modules ───────────────────────────
    const expiredGrace = await prisma.organizationModule.findMany({
      where: {
        billingStatus: 'GRACE',
        graceEndsAt: { lte: now }
      },
      include: { module: true, organization: true }
    })

    for (const m of expiredGrace) {
      await prisma.organizationModule.update({
        where: { id: m.id },
        data: {
          billingStatus: 'SUSPENDED',
          status: 'SUSPENDED'
        }
      })

      await prisma.messageLog.create({
        data: {
          organizationId: m.organizationId,
          recipient: m.organization.name,
          channel: 'BILLING',
          content: `🚫 ${m.module.name} has been suspended due to non-payment. Please update your payment method and contact support to reactivate.`,
          status: 'SENT'
        }
      })
      results.suspended++
    }

    return NextResponse.json({
      message: 'Billing cycle processed',
      results,
      processedAt: now.toISOString()
    })
  } catch (error) {
    console.error('[BILLING_PROCESS_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/v1/billing/process
 * Returns a summary of all modules across all orgs and their billing status.
 * Used by the super admin dashboard.
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = requireSuperAdmin(req)
    if (authUser instanceof NextResponse) return authUser

    const now = new Date()

    const summary = await prisma.organizationModule.groupBy({
      by: ['billingStatus'],
      _count: { billingStatus: true }
    })

    const overdueSoon = await prisma.organizationModule.findMany({
      where: {
        billingStatus: 'ACTIVE',
        nextBillAt: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 86_400_000)
        }
      },
      include: { module: true, organization: { select: { name: true } } },
      orderBy: { nextBillAt: 'asc' },
      take: 20
    })

    return NextResponse.json({ summary, overdueSoon })
  } catch (error) {
    console.error('[BILLING_STATUS_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
