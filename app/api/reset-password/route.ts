
// app/api/reset-password/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/app/_lib/prisma";

const MIN_PASSWORD_LEN = Number(process.env.MIN_PASSWORD_LENGTH || 8);

export async function POST(req: Request) {
  try {
    const { email, token, newPassword } = await req.json();

    // Valida entrada
    if (
      !email ||
      typeof email !== "string" ||
      !token ||
      typeof token !== "string" ||
      !newPassword ||
      typeof newPassword !== "string"
    ) {
      return NextResponse.json(
        { ok: false, message: "Dados inválidos." },
        { status: 400 }
      );
    }

    if (newPassword.length < MIN_PASSWORD_LEN) {
      return NextResponse.json(
        {
          ok: false,
          message: `A nova senha deve ter pelo menos ${MIN_PASSWORD_LEN} caracteres.`,
        },
        { status: 400 }
      );
    }

    // Busca token pelo e-mail (último criado)
    const prt = await db.passwordResetToken.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (!prt) {
      return NextResponse.json(
        { ok: false, message: "Token inválido ou expirado." },
        { status: 400 }
      );
    }

    // Verifica expiração
    const now = new Date();
    if (prt.expiresAt < now) {
      await db.passwordResetToken.deleteMany({ where: { email } });
      return NextResponse.json(
        { ok: false, message: "Token expirado. Solicite uma nova redefinição." },
        { status: 400 }
      );
    }

    // Compara hash do token
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    if (tokenHash !== prt.tokenHash) {
      return NextResponse.json(
        { ok: false, message: "Token inválido." },
        { status: 400 }
      );
    }

    // Verifica se usuário existe
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      await db.passwordResetToken.deleteMany({ where: { email } });
      return NextResponse.json(
        { ok: false, message: "Token inválido ou expirado." },
        { status: 400 }
      );
    }

    // Hash da nova senha (usei 10, você usa 12 no signup — pode alinhar)
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Atualiza a senha
    await db.user.update({
      where: { email },
      data: { password: passwordHash },
    });

    // Invalida (apaga) tokens após uso
    await db.passwordResetToken.deleteMany({ where: { email } });

    return NextResponse.json({
      ok: true,
      message: "Senha redefinida com sucesso.",
    });
  } catch (err: any) {
    console.error("POST /api/reset-password error:", err);
    return NextResponse.json(
      { ok: false, message: "Erro inesperado.", error: err?.message },
      { status: 500 }
    );
  }
}
