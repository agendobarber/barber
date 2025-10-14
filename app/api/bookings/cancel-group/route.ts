import { db } from "@/app/_lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(req: Request) {
  try {
    const { ids } = await req.json()

    console.log("IDs recebidos do front:", ids)

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Nenhum ID de agendamento fornecido" },
        { status: 400 }
      )
    }

    console.log("Iniciando cancelamento em grupo...")

    // Atualiza todos os agendamentos para status 0 (cancelado)
    const updated = await db.booking.updateMany({
      where: { id: { in: ids } },
      data: { status: 0 },
    })

    return NextResponse.json({
      success: true,
      message: `Cancelado(s) ${updated.count} agendamento(s).`,
    })
  } catch (error) {
    console.error("Erro ao cancelar agendamentos:", error)
    return NextResponse.json(
      { error: "Não foi possível cancelar os agendamentos" },
      { status: 500 }
    )
  }
}
