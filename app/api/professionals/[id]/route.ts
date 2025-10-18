import { db } from "@/app/_lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params; // 👈 aguarda o params (resolve erro em dev e funciona em prod)
    const professionalId = params.id;

    if (!professionalId) {
      return NextResponse.json({ error: "ID do profissional não fornecido" }, { status: 400 });
    }

    const body = await req.json();
    const { name, email, phone, status, schedules } = body;

    // Atualiza status apenas
    if (status !== undefined) {
      if (typeof status !== "number") {
        return NextResponse.json({ error: "status deve ser um número" }, { status: 400 });
      }
      const updatedStatus = await db.professional.update({
        where: { id: professionalId },
        data: { status },
      });
      return NextResponse.json(updatedStatus);
    }

    // Valida campos
    if (!name) return NextResponse.json({ error: "name é obrigatório" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "email é obrigatório" }, { status: 400 });

    // Checa email duplicado
    const existing = await db.professional.findFirst({
      where: { email, NOT: { id: professionalId } },
    });
    if (existing) return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });

    // Atualiza profissional
    const updatedProfessional = await db.professional.update({
      where: { id: professionalId },
      data: { name, email, phone },
    });

    // Atualiza horários se houver
    if (Array.isArray(schedules)) {
      await db.professionalSchedule.deleteMany({ where: { professionalId } });
      await db.professionalSchedule.createMany({
        data: schedules.map((s: any) => ({
          professionalId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
    }

    return NextResponse.json(updatedProfessional);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar profissional" }, { status: 500 });
  }
}
