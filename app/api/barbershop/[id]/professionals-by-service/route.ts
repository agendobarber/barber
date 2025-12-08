import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, context: any) {
    try {
        const { params } = await context; // ⬅️ AGORA FUNCIONA  
        
        const { servicesIds } = await req.json();

        console.log("servicesIds:", servicesIds);
        console.log("barbershopId:", params.id);

        const professionals = await db.professional.findMany({
            where: {
                barbershopId: params.id,
                services: {
                    some: {        // ⬅️ AGORA LISTA SE FAZ PELO MENOS 1 SERVIÇO
                        id: { in: servicesIds }
                    }
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true
            }
        });

        return NextResponse.json(professionals);

    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Erro ao buscar profissionais" },
            { status: 500 }
        );
    }
}
