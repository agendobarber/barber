// /api/bookings/by-user/route.ts
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const phone = searchParams.get("phone");

        if (!phone) {
            return NextResponse.json({ error: "Telefone obrigatório" }, { status: 400 });
        }

        // Normaliza o telefone igual ao create-user
        const normalized = phone.replace(/\D/g, "");
        const email = `phone_${normalized}@noauth.chat`;

        // Busca o usuário baseado no e-mail gerado
        const user = await db.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ bookings: [] });
        }

        // Busca APENAS agendamentos ativos
        const bookings = await db.booking.findMany({
            where: {
                userId: user.id,
                status: 1
            },
            orderBy: { date: "asc" },
            include: {
                professional: true,
                services: {
                    include : {
                        service : true
                    }
                }
            }
        });

        return NextResponse.json({ bookings });

    } catch (e) {
        console.log(e);
        return NextResponse.json(
            { error: "Erro ao buscar agendamentos" }, 
            { status: 500 }
        );
    }
}
