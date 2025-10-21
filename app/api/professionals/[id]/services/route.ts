import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

interface Params {
    params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
    try {
        const professionalId = params.id;

        if (!professionalId) {
            return NextResponse.json({ error: "ID do profissional é obrigatório" }, { status: 400 });
        }

        const services = await db.barbershopService.findMany({
            where: {
                professionals: {
                    some: { id: professionalId },
                },
            },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                tempo: true,
            },
        });

        return NextResponse.json(services);
    } catch (error) {
        console.error("Erro ao buscar serviços:", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
