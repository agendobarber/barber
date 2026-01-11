
// app/api/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";

import { db } from "@/app/_lib/prisma";
import { authOptions } from "@/app/_lib/auth";
import { requireRole } from "@/app/_lib/requireRole";

export async function POST(req: Request) {
  try {
    // Garante que só admin pode criar
    await requireRole("admin");

    const session = await getServerSession(authOptions);
    const requesterId = (session?.user as any)?.id;

    const body = await req.json();
    const {
      name,
      email,
      password,
      role, // ignoraremos se vier diferente de "admin"
      status, // opcional: default 1
      barbershopId, // opcional: para vincular o admin a uma barbearia específica
    } = body ?? {};

    // Validações básicas
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { message: "Formato inválido de email/senha" },
        { status: 400 }
      );
    }

    // Checa duplicidade de email
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email já cadastrado" },
        { status: 400 }
      );
    }

    // Se for informado barbershopId, valide se o admin logado é admin dessa barbearia
    let resolvedBarbershopId: string | null = null;
    if (barbershopId) {
      const canManage = await db.barbershop.findFirst({
        where: {
          id: barbershopId,
          admins: {
            some: { id: requesterId },
          },
        },
        select: { id: true },
      });

      if (!canManage) {
        return NextResponse.json(
          { message: "Você não tem permissão para vincular a barbearia informada" },
          { status: 403 }
        );
      }
      resolvedBarbershopId = barbershopId;
    }

    // Hash de senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Role fixo "admin" e status default 1
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "admin", // fixo
        status: typeof status === "number" ? status : 1, // default 1
        barbershopId: resolvedBarbershopId ?? null,
      },
      select: { id: true },
    });

    return NextResponse.json(
      { message: "Usuário criado", userId: user.id },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/users error:", err);

    // Trata erro de unique constraint (Prisma)
    if (err?.code === "P2002") {
      return NextResponse.json(
        { message: "Email já cadastrado" },
        { status: 400 }
      );
    }

    // Caso o requireRole lance erro de autorização
    if (err?.status === 403) {
      return NextResponse.json(
        { message: err.message ?? "Acesso negado" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { message: "Erro interno" },
      { status: 500 }
    );
  }
}
