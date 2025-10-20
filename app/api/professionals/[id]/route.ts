import { db } from "@/app/_lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const professionalId = params.id;

    if (!professionalId)
      return NextResponse.json({ error: "ID do profissional não fornecido" }, { status: 400 });

    const body = await req.json();
    const { name, email, phone, status, schedules, serviceIds } = body;

    // Atualiza apenas o status (ativar/inativar)
    if (status !== undefined) {
      if (typeof status !== "number")
        return NextResponse.json({ error: "status deve ser um número" }, { status: 400 });

      const updatedStatus = await db.professional.update({
        where: { id: professionalId },
        data: { status },
      });
      return NextResponse.json(updatedStatus);
    }

    // Validação
    if (!name) return NextResponse.json({ error: "name é obrigatório" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "email é obrigatório" }, { status: 400 });

    // Checa duplicado
    const existing = await db.professional.findFirst({
      where: { email, NOT: { id: professionalId } },
    });
    if (existing)
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });

    // Atualiza dados básicos
    const updatedProfessional = await db.professional.update({
      where: { id: professionalId },
      data: { name, email, phone },
    });

    // Atualiza horários
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

    // Atualiza serviços vinculados (relação N:N implícita via @relation)
    if (Array.isArray(serviceIds)) {
      await db.professional.update({
        where: { id: professionalId },
        data: {
          services: {
            set: [], // limpa vínculos atuais
          },
        },
      });

      if (serviceIds.length > 0) {
        await db.professional.update({
          where: { id: professionalId },
          data: {
            services: {
              connect: serviceIds.map((serviceId: string) => ({ id: serviceId })),
            },
          },
        });
      }
    }

    return NextResponse.json(updatedProfessional);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar profissional" }, { status: 500 });
  }
}
