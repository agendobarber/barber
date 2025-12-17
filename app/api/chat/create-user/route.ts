// /api/chat/create-user/route.ts
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { name, phone } = await request.json();

    if (!phone) {
        return NextResponse.json(
            { error: "Telefone é obrigatório" },
            { status: 400 }
        );
    }

    const normalized = phone.replace(/\D/g, "");
    const email = `phone_${normalized}@noauth.chat`;

    // verifica se já existe
    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
        user = await db.user.create({
            data: {
                name,
                email,
                password: null,
                role: "user",
                status: 1,
            },
        });
    }

    return NextResponse.json({ user });
}
