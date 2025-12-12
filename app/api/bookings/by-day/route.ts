// app/api/bookings/by-day/route.ts
import { getBookings } from "@/app/_actions/get-bookings";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Extrai os parâmetros de data e professionalId da query
    const { searchParams } = new URL(req.url);
    const date = new Date(searchParams.get("date") || ""); // Data pode ser passada na query string
    const professionalId = searchParams.get("professionalId") || "";

    if (!date || !professionalId) {
      return NextResponse.json({ error: "Faltando parâmetros." }, { status: 400 });
    }

    // Chama a função getBookings, passando os parâmetros necessários
    const bookings = await getBookings({ date, professionalId });

    // Retorna os agendamentos
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter agendamentos.' }, { status: 500 });
  }
}
