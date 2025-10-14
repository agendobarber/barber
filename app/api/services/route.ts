import { db } from "@/app/_lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, description, price, tempo, barbershopId } = body ?? {};

        // validações básicas
        if (!barbershopId) {
            return NextResponse.json({ error: "barbershopId é obrigatório" }, { status: 400 });
        }
        if (!name) {
            return NextResponse.json({ error: "name é obrigatório" }, { status: 400 });
        }
        if (!price) {
            return NextResponse.json({ error: "price é obrigatório" }, { status: 400 });
        }
        if (!tempo) {
            return NextResponse.json({ error: "tempo é obrigatório" }, { status: 400 });
        }

        // valida e converte o preço para Decimal (Prisma)
        let prismaPrice;
        try {
            prismaPrice = new Prisma.Decimal(price);
        } catch (e) {
            return NextResponse.json({ error: "price inválido" }, { status: 400 });
        }

        // valida e converte tempo para número
        const parsedTempo = parseInt(tempo, 10);
        if (isNaN(parsedTempo) || parsedTempo <= 0) {
            return NextResponse.json({ error: "tempo deve ser um número válido (em minutos)" }, { status: 400 });
        }

        // cria o serviço
        const created = await db.barbershopService.create({
            data: {
                name,
                description,
                price: prismaPrice,
                tempo: parsedTempo,
                barbershop: {
                    connect: { id: barbershopId },
                },
            },
        });

        // serializa o price para string
        const result = {
            ...created,
            price: created.price?.toString ? created.price.toString() : created.price,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erro ao cadastrar serviço" }, { status: 500 });
    }
}
