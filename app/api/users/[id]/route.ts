
import { db } from "@/app/_lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/users/:id
// - Se body incluir { status }, atualiza só o status (0|1) e retorna.
// - Caso contrário, atualiza dados básicos (name, email, role, barbershopId).
// - Valida email obrigatório quando não for atualização apenas de status.
// - Checa duplicidade de email (excluindo o próprio id).
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // mantém igual ao seu exemplo
) {
  try {
    const params = await context.params;
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário não fornecido" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, email, role, status, barbershopId } = body ?? {};

    // ──────────────────────────────────────────────────────────────────────
    // Atualização apenas do status (ativar/inativar)
    // ──────────────────────────────────────────────────────────────────────
    if (status !== undefined) {
      if (typeof status !== "number") {
        return NextResponse.json(
          { error: "status deve ser um número" },
          { status: 400 }
        );
      }
      if (status !== 0 && status !== 1) {
        return NextResponse.json(
          { error: "status deve ser 0 (inativo) ou 1 (ativo)" },
          { status: 400 }
        );
      }

      const updatedStatus = await db.user.update({
        where: { id: userId },
        data: { status },
      });

      return NextResponse.json(updatedStatus);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Atualização de dados básicos (sem status)
    // ──────────────────────────────────────────────────────────────────────
    // Validações mínimas (ajuste conforme sua regra)
    if (!email) {
      return NextResponse.json(
        { error: "email é obrigatório" },
        { status: 400 }
      );
    }

    // Checa duplicidade de e-mail (excluindo o próprio usuário)
    const existing = await db.user.findFirst({
      where: { email, NOT: { id: userId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    // Se não veio name, vamos permitir null (coerente com seu schema)
    // Role: por padrão é "user"; se vier algo diferente, aceite conforme sua necessidade
    // barbershopId: só faz sentido para admins (pelo seu comentário no schema)
    //   - Se role !== "admin", vamos limpar barbershopId para evitar vínculo indevido
    const isAdmin = role === "admin";
    const nextBarbershopId =
      isAdmin ? (barbershopId ?? null) : null;

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        // atualiza apenas os campos que vierem (sem undefined)
        ...(name !== undefined ? { name } : {}),
        email,
        ...(role !== undefined ? { role } : {}),
        barbershopId: nextBarbershopId,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}
