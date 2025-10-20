import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, barbershopId, schedules, serviceIds } = body;

    if (!barbershopId) return NextResponse.json({ error: "barbershopId é obrigatório" }, { status: 400 });
    if (!name) return NextResponse.json({ error: "name é obrigatório" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "email é obrigatório" }, { status: 400 });

    const existing = await db.professional.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });

    const professional = await db.professional.create({
      data: {
        name,
        email,
        phone,
        barbershop: { connect: { id: barbershopId } },
        services: serviceIds?.length ? { connect: serviceIds.map((id: string) => ({ id })) } : undefined,
      },
    });

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

export async function PATCH(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();
    const body = await req.json();
    const { name, email, phone, schedules, serviceIds } = body;

    if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

    const updated = await db.professional.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        services: {
          set: [],
          connect: serviceIds?.map((sid: string) => ({ id: sid })) || [],
        },
      },
    });

    if (Array.isArray(schedules)) {
      await db.professionalSchedule.deleteMany({ where: { professionalId: id } });
      await db.professionalSchedule.createMany({
        data: schedules.map((s: any) => ({
          professionalId: id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar profissional" }, { status: 500 });
  }
}
