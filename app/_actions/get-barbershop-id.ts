"use server";

import { db } from "@/app/_lib/prisma";

// 🔵 SERVER ACTION — roda no servidor, mesmo em arquivo client
export async function getBarbershopId() {
    "use server";

    const shop = await db.barbershop.findFirst();

    return shop?.id ?? null;
}
