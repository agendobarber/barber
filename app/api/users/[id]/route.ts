
// app/api/users/[id]/route.ts
import { db } from "@/app/_lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

/**
 * GET /api/users/:id
 * Retorna dados básicos do usuário para edição.
 * Campos: id, name, email, role, status, createdAt
 */
export async function GET(
  _req: NextRequest,
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

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/:id
 * Atualiza campos enviados no body:
 * - name, email, role, barbershopId, status
 * - Se password vier não-vazio, faz hash e atualiza também.
 * Valida duplicidade de email e mantém email atual se não enviado.
 */
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
    const { name, email, role, status, barbershopId, password } = body ?? {};

    // Carrega o usuário atual para ter valores de fallback
    const current = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, barbershopId: true },
    });
    if (!current) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Validações
    if (email !== undefined && typeof email !== "string") {
      return NextResponse.json({ error: "email inválido" }, { status: 400 });
    }
    if (name !== undefined && typeof name !== "string") {
      return NextResponse.json({ error: "nome inválido" }, { status: 400 });
    }
    if (role !== undefined && typeof role !== "string") {
      return NextResponse.json({ error: "role inválida" }, { status: 400 });
    }
    if (status !== undefined && typeof status !== "number") {
      return NextResponse.json({ error: "status inválido" }, { status: 400 });
    }
    if (barbershopId !== undefined && barbershopId !== null && typeof barbershopId !== "string") {
      return NextResponse.json(
        { error: "barbershopId inválido" },
        { status: 400 }
      );
    }
    if (password !== undefined && password !== null) {
      if (typeof password !== "string") {
        return NextResponse.json({ error: "senha inválida" }, { status: 400 });
      }
      if (password.length > 0 && password.length < 8) {
        return NextResponse.json(
          { error: "A senha deve ter pelo menos 8 caracteres" },
          { status: 400 }
        );
      }
    }

    // Email: se não foi enviado, mantém o atual
    const nextEmail = email !== undefined ? email : current.email;

    // Duplicidade de email (excluindo o próprio)
    if (nextEmail !== current.email) {
      const existing = await db.user.findFirst({
        where: { email: nextEmail, NOT: { id: userId } },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Email já cadastrado" },
          { status: 400 }
        );
      }
    }

    // Role/barbershopId coerentes com seu schema
    const isAdmin = (role ?? current.role) === "admin";
    const nextBarbershopId =
      isAdmin ? (barbershopId ?? current.barbershopId ?? null) : null;

    // Monta payload dinâmico (só inclui campos enviados)
    const data: Record<string, any> = {
      email: nextEmail,
    };
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (status !== undefined) data.status = status;
    data.barbershopId = nextBarbershopId;

    // Se veio senha não vazia, faz hash e inclui
    if (password && password.length > 0) {
      const hashed = await bcrypt.hash(password, 12);
      data.password = hashed;
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        barbershopId: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}
