-- CreateTable
CREATE TABLE "MaintenanceMode" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "serviceId" TEXT,
    "postId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedBy" TEXT NOT NULL,

    CONSTRAINT "MaintenanceMode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceMode_serviceId_key" ON "MaintenanceMode"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceMode_postId_key" ON "MaintenanceMode"("postId");

-- CreateIndex
CREATE INDEX "MaintenanceMode_companyId_idx" ON "MaintenanceMode"("companyId");

-- CreateIndex
CREATE INDEX "MaintenanceMode_serviceId_idx" ON "MaintenanceMode"("serviceId");

-- CreateIndex
CREATE INDEX "MaintenanceMode_postId_idx" ON "MaintenanceMode"("postId");

-- AddForeignKey
ALTER TABLE "MaintenanceMode" ADD CONSTRAINT "MaintenanceMode_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceMode" ADD CONSTRAINT "MaintenanceMode_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceMode" ADD CONSTRAINT "MaintenanceMode_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
