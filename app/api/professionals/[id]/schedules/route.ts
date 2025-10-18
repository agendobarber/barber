import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params; // ✅ compatível com dev e produção
    const professionalId = params.id;

    if (!professionalId) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    const schedules = await db.professionalSchedule.findMany({
      where: { professionalId },
      select: { dayOfWeek: true, startTime: true, endTime: true },
    });

    return NextResponse.json(schedules);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar horários" }, { status: 500 });
  }
}
