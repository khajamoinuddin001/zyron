-- CreateTable
CREATE TABLE "_OrganizationRoleToPlatformModule" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_OrganizationRoleToPlatformModule_AB_unique" ON "_OrganizationRoleToPlatformModule"("A", "B");

-- CreateIndex
CREATE INDEX "_OrganizationRoleToPlatformModule_B_index" ON "_OrganizationRoleToPlatformModule"("B");

-- AddForeignKey
ALTER TABLE "_OrganizationRoleToPlatformModule" ADD CONSTRAINT "_OrganizationRoleToPlatformModule_A_fkey" FOREIGN KEY ("A") REFERENCES "OrganizationRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrganizationRoleToPlatformModule" ADD CONSTRAINT "_OrganizationRoleToPlatformModule_B_fkey" FOREIGN KEY ("B") REFERENCES "PlatformModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
