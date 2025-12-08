import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { pathname } = new URL(req.url);
        const id = pathname.split("/").at(-2); // /barbershop/[id]/services

        if (!id) {
            return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
        }

        const services = await db.barbershopService.findMany({
            where: { barbershopId: id, status: 1 },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(services);
    } catch (err) {
        console.error("Erro ao buscar serviços:", err);
        return NextResponse.json(
            { error: "Erro ao buscar serviços" },
            { status: 500 }
        );
    }
}
