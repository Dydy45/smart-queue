-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "whatsappConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappMessageId" TEXT,
ADD COLUMN     "whatsappNotified" BOOLEAN NOT NULL DEFAULT false;
