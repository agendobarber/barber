import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma"; // caminho do seu client Prisma

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, barbershopId } = body ?? {};

    // validações básicas
    if (!barbershopId) {
      return NextResponse.json({ error: "barbershopId é obrigatório" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "name é obrigatório" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "email é obrigatório" }, { status: 400 });
    }

    // verifica se o email já existe
    const existing = await db.professional.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
    }

    // cria o profissional
    const professional = await db.professional.create({
      data: {
        name,
        email,
        barbershop: { connect: { id: barbershopId } },
      },
    });

    return NextResponse.json(professional);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao cadastrar profissional" }, { status: 500 });
  }
}
