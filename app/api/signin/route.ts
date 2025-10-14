import { compare } from "bcryptjs";
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return NextResponse.json({ message: "Usuário ou senha incorretos" }, { status: 401 });
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ message: "Usuário ou senha incorretos" }, { status: 401 });
    }

    // Login bem-sucedido, aqui você poderia criar sessão JWT manualmente
    // ou usar NextAuth Credentials para autenticar de fato

    return NextResponse.json({ message: "Login bem-sucedido", userId: user.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}
