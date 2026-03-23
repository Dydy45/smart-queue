/*
  Warnings:

  - A unique constraint covering the columns `[trackingToken]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "proximityRadius" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "virtualQueueEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "arrivalNotified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "clientLat" DOUBLE PRECISION,
ADD COLUMN     "clientLng" DOUBLE PRECISION,
ADD COLUMN     "departureNotified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVirtual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locationUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "trackingToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_trackingToken_key" ON "Ticket"("trackingToken");
