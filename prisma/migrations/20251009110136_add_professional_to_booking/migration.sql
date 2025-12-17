-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "professionalId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
