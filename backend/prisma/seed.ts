import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── 1. Platform Modules ─────────────────────────────────────────────────
  const modulesData = [
    {
      key: 'attendance',
      name: 'Attendance Management',
      description: 'Track student/staff attendance with daily reports and analytics',
      monthlyPrice: 999,
    },
    {
      key: 'accounts',
      name: 'Accounts & Finance',
      description: 'Fee collection, expense tracking, payroll and financial reports',
      monthlyPrice: 1499,
    },
    {
      key: 'inventory',
      name: 'Book & Inventory',
      description: 'Manage books, stationery and supplies inventory',
      monthlyPrice: 799,
    },
    {
      key: 'transport',
      name: 'Transport & Fleet',
      description: 'Track buses, routes, driver logs and student transport',
      monthlyPrice: 1299,
    },
    {
      key: 'messaging',
      name: 'Messaging & Notifications',
      description: 'SMS/email notifications to parents, students and staff',
      monthlyPrice: 599,
    },
    {
      key: 'examinations',
      name: 'Examinations & Results',
      description: 'Create exams, manage hall tickets, publish results',
      monthlyPrice: 1099,
    },
    {
      key: 'library',
      name: 'Library Management',
      description: 'Issue and return books, manage catalogue and fines',
      monthlyPrice: 699,
    },
    {
      key: 'hostel',
      name: 'Hostel Management',
      description: 'Room allocation, mess billing and hostel records',
      monthlyPrice: 899,
    },
    {
      key: 'calendar',
      name: 'Calendar & Events',
      description: 'Manage organizational events, holidays, and schedules',
      monthlyPrice: 299,
    },
  ]

  console.log('📦 Creating platform modules...')
  for (const mod of modulesData) {
    await prisma.platformModule.upsert({
      where: { key: mod.key },
      update: mod,
      create: mod,
    })
  }

  // ─── 2. Super Admin ───────────────────────────────────────────────────────
  const superAdminEmail = 'moiinuddinkhajamd@gmail.com'
  const superAdminPassword = await bcrypt.hash('99892@Kha', 12)

  console.log('👑 Creating super admin...')
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      passwordHash: superAdminPassword,
      firstName: 'Moinuddin',
      lastName: 'Khaja',
      isSuperAdmin: true,
    },
  })
  console.log(`  ✅ Super Admin: ${superAdmin.email}`)

  // ─── 3. Demo Organization ─────────────────────────────────────────────────
  console.log('🏫 Creating demo organization...')
  const demoOrg = await prisma.organization.upsert({
    where: { domain: 'demo-school.zyron.app' },
    update: {},
    create: {
      name: 'Demo School',
      domain: 'demo-school.zyron.app',
      status: 'ACTIVE',
    },
  })

  // ─── 4. Org Admin ─────────────────────────────────────────────────────────
  const orgAdminEmail = 'moinuddinkhajamd01@gmail.com'
  const orgAdminPassword = await bcrypt.hash('99892@Kha', 12)

  console.log('👤 Creating org admin...')
  const orgAdmin = await prisma.user.upsert({
    where: { email: orgAdminEmail },
    update: {},
    create: {
      email: orgAdminEmail,
      passwordHash: orgAdminPassword,
      firstName: 'Demo',
      lastName: 'Admin',
      isSuperAdmin: false,
    },
  })

  // Link org admin to the demo org
  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: orgAdmin.id,
        organizationId: demoOrg.id,
      },
    },
    update: {},
    create: {
      userId: orgAdmin.id,
      organizationId: demoOrg.id,
      role: 'ORG_ADMIN',
      status: 'ACTIVE',
    },
  })
  console.log(`  ✅ Org Admin: ${orgAdmin.email}`)

  // ─── 5. Enable default modules for demo org ───────────────────────────────
  const defaultModuleKeys = ['attendance', 'accounts', 'messaging']
  const platformModules = await prisma.platformModule.findMany({
    where: { key: { in: defaultModuleKeys } },
  })

  for (const mod of platformModules) {
    await prisma.organizationModule.upsert({
      where: {
        organizationId_moduleId: {
          organizationId: demoOrg.id,
          moduleId: mod.id,
        },
      },
      update: {},
      create: {
        organizationId: demoOrg.id,
        moduleId: mod.id,
        status: 'ACTIVE',
      },
    })
  }

  console.log('✅ Seed complete!')
  console.log('')
  console.log('─────────────────────────────────────────')
  console.log('  CREDENTIALS')
  console.log('─────────────────────────────────────────')
  console.log('  Super Admin:')
  console.log('    Email   : moiinuddinkhajamd@gmail.com')
  console.log('    Password: 99892@Kha')
  console.log('')
  console.log('  Org Admin (Demo School):')
  console.log('    Email   : moinuddinkhajamd01@gmail.com')
  console.log('    Password: 99892@Kha')
  console.log('─────────────────────────────────────────')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
