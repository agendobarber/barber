-- CreateEnum
CREATE TYPE "public"."ThemeMode" AS ENUM ('light', 'dark', 'system');

-- CreateTable
CREATE TABLE "public"."ThemeSetting" (
    "id" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "mode" "public"."ThemeMode" NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThemeSetting_barbershopId_key" ON "public"."ThemeSetting"("barbershopId");

-- AddForeignKey
ALTER TABLE "public"."ThemeSetting" ADD CONSTRAINT "ThemeSetting_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "public"."Barbershop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
