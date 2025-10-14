import { db } from "@/app/_lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    // Extrai o ID da URL
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // pega o último segmento
    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    const body = await req.json();
    const { name, email, phone, status } = body;

    // Se vier status, atualiza apenas o status
    if (status !== undefined) {
      if (typeof status !== "number") {
        return NextResponse.json({ error: "status deve ser um número" }, { status: 400 });
      }

      const updatedStatus = await db.professional.update({
        where: { id },
        data: { status },
      });

      return NextResponse.json(updatedStatus);
    }

    // Valida campos obrigatórios
    if (!name) return NextResponse.json({ error: "name é obrigatório" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "email é obrigatório" }, { status: 400 });

    // Verifica se o email já existe em outro profissional
    const existing = await db.professional.findFirst({
      where: { email, NOT: { id } },
    });

    if (existing) return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });

    // Atualiza os dados do profissional
    const updated = await db.professional.update({
      where: { id },
      data: { name, email, phone },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar profissional" }, { status: 500 });
  }
}
