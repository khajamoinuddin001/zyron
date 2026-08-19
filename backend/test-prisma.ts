import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  try {
    const logs = await prisma.systemLog.findMany()
    console.log("Success:", logs.length)
  } catch (e) {
    console.error("Prisma Error:", e)
  }
}
main()
