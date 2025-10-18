import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, barbershopId, schedules } = body;

    if (!barbershopId) return NextResponse.json({ error: "barbershopId é obrigatório" }, { status: 400 });
    if (!name) return NextResponse.json({ error: "name é obrigatório" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "email é obrigatório" }, { status: 400 });

    const existing = await db.professional.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });

    const professional = await db.professional.create({
      data: { name, email, phone, barbershop: { connect: { id: barbershopId } } },
    });


    // Cria horários se existirem
    if (Array.isArray(schedules)) {
      await db.professionalSchedule.createMany({
        data: schedules.map((s: any) => ({
          professionalId: professional.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
    }

    return NextResponse.json(professional);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao cadastrar profissional" }, { status: 500 });
  }
}
