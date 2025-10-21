import { db } from "@/app/_lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: any) {
  try {
    const { id } = context.params as { id: string };

    if (!id) {
      return NextResponse.json(
        { error: "ID do profissional é obrigatório" },
        { status: 400 }
      );
    }

    const services = await db.barbershopService.findMany({
      where: {
        professionals: {
          some: { id },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        tempo: true,
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
