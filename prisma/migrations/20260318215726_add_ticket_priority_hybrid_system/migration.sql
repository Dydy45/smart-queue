/*
  Warnings:

  - A unique constraint covering the columns `[appointmentId]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('NORMAL', 'APPOINTMENT');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL';

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_appointmentId_key" ON "Ticket"("appointmentId");
