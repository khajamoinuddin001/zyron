import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.platformModule.upsert({
    where: { key: 'contacts' },
    update: {},
    create: {
      key: 'contacts',
      name: 'Contacts',
      description: 'Manage staff, student, and parent contact information.',
      monthlyPrice: 0.0
    }
  })
  console.log("Added contacts module")
}
main()
