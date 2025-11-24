import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "Parâmetros inválidos." },
        { status: 400 }
      );
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999); // Definindo a data final corretamente

    // Buscar todos os barbeiros da barbearia (segundo o barbershopId)
    const professionals = await db.professional.findMany();

    // Buscar agendamentos no período, usando a data de agendamento do cliente (não a data de criação)
    const bookings = await db.booking.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 1, // apenas agendamentos concluídos
      },
      include: {
        professional: true,
        services: {
          include: { service: true },
        },
      },
    });

    // Agrupamento de dados por barbeiro
    const result = professionals.map((p) => {
      // Filtrando os agendamentos do barbeiro
      const bookingsOfPro = bookings.filter(
        (b) => b.professionalId === p.id
      );

      // Calculando a receita total do barbeiro no período
      const revenue = bookingsOfPro.reduce((acc, b) => {
        const total = b.services.reduce(
          (sum, s) => sum + Number(s.service.price),
          0
        );
        return acc + total;
      }, 0);

      return {
        professionalId: p.id,
        professionalName: p.name,
        bookings: bookingsOfPro.length,
        revenue,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Erro no relatório:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
