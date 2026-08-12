const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Migrating existing roles in DB...');
  
  // Update OrganizationMember
  await prisma.$executeRawUnsafe(`UPDATE "OrganizationMember" SET role = 'CLIENT'::"Role" WHERE role = 'STUDENT'::"Role"`);
  await prisma.$executeRawUnsafe(`UPDATE "OrganizationMember" SET role = 'STAFF'::"Role" WHERE role = 'TEACHER'::"Role"`);
  await prisma.$executeRawUnsafe(`UPDATE "OrganizationMember" SET role = 'CLIENT'::"Role" WHERE role = 'PARENT'::"Role"`);

  // Update OrganizationInvite
  await prisma.$executeRawUnsafe(`UPDATE "OrganizationInvite" SET role = 'CLIENT'::"Role" WHERE role = 'STUDENT'::"Role"`);
  await prisma.$executeRawUnsafe(`UPDATE "OrganizationInvite" SET role = 'STAFF'::"Role" WHERE role = 'TEACHER'::"Role"`);
  await prisma.$executeRawUnsafe(`UPDATE "OrganizationInvite" SET role = 'CLIENT'::"Role" WHERE role = 'PARENT'::"Role"`);
  
  console.log('Roles migrated successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
