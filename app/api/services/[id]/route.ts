import { db } from "@/app/_lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// PUT → atualizar informações completas do serviço
export async function PUT(req: NextRequest) {
  try {
    // Extrai o ID da URL
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();
    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    const body = await req.json();
    const { name, description, price, tempo } = body ?? {};

    if (!name) return NextResponse.json({ error: "name é obrigatório" }, { status: 400 });
    if (!price) return NextResponse.json({ error: "price é obrigatório" }, { status: 400 });
    if (!tempo) return NextResponse.json({ error: "tempo é obrigatório" }, { status: 400 });

    // converte o preço para Decimal
    let prismaPrice;
    try {
      prismaPrice = new Prisma.Decimal(price);
    } catch {
      return NextResponse.json({ error: "price inválido" }, { status: 400 });
    }

    // converte o tempo para inteiro
    const parsedTempo = parseInt(tempo, 10);
    if (isNaN(parsedTempo) || parsedTempo <= 0) {
      return NextResponse.json({ error: "tempo deve ser um número válido (em minutos)" }, { status: 400 });
    }

    const updated = await db.barbershopService.update({
      where: { id },
      data: { name, description, price: prismaPrice, tempo: parsedTempo },
    });

    return NextResponse.json({
      ...updated,
      price: updated.price?.toString ? updated.price.toString() : updated.price,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar serviço" }, { status: 500 });
  }
}

// PATCH → atualizar apenas o status (Ativar/Inativar)
export async function PATCH(req: NextRequest) {
  try {
    // Extrai o ID da URL
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();
    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body;

    if (typeof status !== "number") {
      return NextResponse.json({ error: "status é obrigatório" }, { status: 400 });
    }

    const updated = await db.barbershopService.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      ...updated,
      price: updated.price?.toString ? updated.price.toString() : updated.price,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 });
  }
}
