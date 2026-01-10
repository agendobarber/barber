
// app/api/forgot-password/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import { db } from "@/app/_lib/prisma"; // usa seu singleton
// Se preferir, pode usar `import { PrismaClient } from "@prisma/client"; const db = new PrismaClient();`

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const EMAIL_FROM = process.env.EMAIL_FROM || "Barbearia <onboarding@resend.dev>";
const EXP_MIN = Number(process.env.RESET_TOKEN_EXPIRATION_MINUTES || 60);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, message: "E-mail inválido." },
        { status: 400 }
      );
    }

    // Gera token e hash (salvar hash, não o token puro)
    const token = crypto.randomUUID();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + EXP_MIN * 60_000);

    // Remove tokens antigos para este e-mail e cria um novo
    await db.passwordResetToken.deleteMany({ where: { email } });
    await db.passwordResetToken.create({
      data: { email, tokenHash, expiresAt },
    });

    // Link para página de redefinição
    const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(
      token
    )}&email=${encodeURIComponent(email)}`;

    // IMPORTANTE (modo local/sandbox Resend): enviar para seu e-mail de conta
    const toAddress =
      process.env.NODE_ENV === "production" ? email : "osvaldobnu@gmail.com";

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: toAddress,
      subject: "Redefinição de senha",
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; line-height:1.6; color:#111; max-width:520px; margin:0 auto; padding:20px; background:#fafafa; border-radius:8px;">
          <h2 style="margin-bottom:8px;">Redefinição de senha</h2>
          <p>Olá!</p>
          <p>Recebemos um pedido para redefinir a sua senha. Clique no botão abaixo para criar uma nova senha:</p>

          <a href="${resetUrl}"
             style="display:inline-block; margin:16p>Se o botão não funcionar, copie e cole este link no navegador:</p>
          <p style="word-break: break-all; color:#555;">${resetUrl}</p>

          <p style="margin-top:24px;">Este link expira em ${EXP_MIN} minutos.</p>

          <hr style="border:none; border-top:1px solid #ddd; margin:24px 0;" />
          <p style="font-size:12px; color:#888;">Enviado automaticamente — ${new Date().toLocaleString("pt-BR")}</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { ok: false, message: "Falha ao enviar e-mail." },
        { status: 500 }
      );
    }

    // Mensagem genérica por segurança (não revelar existência de e-mail)
    return NextResponse.json({
      ok: true,
      message:
        "Se o e-mail existir no sistema, você receberá instruções para redefinir sua senha.",
    });
  } catch (err: any) {
    console.error("POST /api/forgot-password error:", err);
    return NextResponse.json(
      { ok: false, message: "Erro inesperado.", error: err?.message },
      { status: 500 }
    );
  }
}
