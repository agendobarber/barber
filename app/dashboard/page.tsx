import Header from "../_components/header";
import { db } from "../_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../_lib/auth";
import BarberCalendar from "../_components/BarberCalendar";
import { requireRole } from "../_lib/requireRole";

export default async function DashboardPage() {
  await requireRole("admin"); // bloqueia usuário comum
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-10 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold">Acesso necessário</h2>
          <p className="text-gray-500 mt-2">
            Você precisa estar logado para ver seus agendamentos.
          </p>
        </div>
      </div>
    );
  }

  const userId = (session.user as any).id;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { barbershop: true },
  });

  if (!user?.barbershopId) {
    return (
      <div className="min-h-screen bg-background p-10">
        <Header />
        <h2 className="text-2xl font-bold">Nenhuma barbearia vinculada</h2>
        <p className="text-gray-500 mt-2">
          Você precisa estar vinculado a uma barbearia para ver os agendamentos.
        </p>
      </div>
    );
  }

  const bookingsRaw = await db.booking.findMany({
    where: {
      services: { some: { service: { barbershopId: user.barbershopId } } },
      date: { gte: new Date() },
    },
    include: {
      user: true,
      professional: true,
      services: { include: { service: { include: { barbershop: true } } } },
    },
    orderBy: { date: "asc" },
  });

  const sanitizedBookings = bookingsRaw.map((b) => {
    const firstService = b.services[0]?.service;
    return {
      id: b.id,
      date: b.date,
      user: { name: b.user.name },
      professional: b.professional
        ? { id: b.professional.id, name: b.professional.name }
        : null,
      barbershop: firstService
        ? {
          id: firstService.barbershop.id,
          name: firstService.barbershop.name,
          imageUrl: firstService.barbershop.imageUrl,
        }
        : { id: "", name: "Sem barbearia", imageUrl: "" },
      services: b.services.map((s) => ({
        name: s.service.name,
        price: Number(s.service.price),
        status: b.status, // 🔥 usa o status do booking, não do pivot
      })),

      status: b.status,
      key: b.id,
      ids: [b.id],
    };
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col p-5 md:p-10">
        <BarberCalendar bookings={sanitizedBookings} />
      </main>
    </div>
  );
}
