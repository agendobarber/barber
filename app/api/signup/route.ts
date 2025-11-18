// app/api/signup/route.ts
import { db } from "@/app/_lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email já cadastrado" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    // Se for admin, cria barbearia automaticamente
    /*if (role === "admin") {
      const barbershop = await db.barbershop.create({
        data: {
          name: `${name}'s Barbearia`,
          address: "Endereço padrão",
          phones: [],
          description: "Barbearia criada automaticamente",
          imageUrl: "/default-barbershop.png",
        },
      });

      await db.user.update({
        where: { id: user.id },
        data: { barbershopId: barbershop.id },
      });
    }*/

    return NextResponse.json({ message: "Usuário criado", userId: user.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}
