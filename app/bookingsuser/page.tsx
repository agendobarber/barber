
// app/agendamentos/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "../_lib/auth";
import Header from "../_components/header";
import { db } from "../_lib/prisma";
import { requireRole } from "../_lib/requireRole";
import SimpleBookingRow from "../_components/simple-booking-row";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function MyBookingsPage() {
  await requireRole("user");
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

  const bookings = await db.booking.findMany({
    where: { userId },
    include: {
      professional: true,
      services: {
        include: { service: { include: { barbershop: true } } },
      },
    },
    orderBy: { date: "desc" },
  });

  const sanitizedBookings = bookings.map((b) => {
    const services = b.services.map((s) => ({
      name: s.service.name,
      price: Number(s.service.price),
      barbershop: s.service.barbershop,
    }));

    const barbershop =
      services[0]?.barbershop
        ? {
          id: services[0].barbershop.id,
          name: services[0].barbershop.name,
          imageUrl: services[0].barbershop.imageUrl,
        }
        : { id: "", name: "Barbearia desconhecida", imageUrl: "" };

    const total = services.reduce((acc, s) => acc + (s.price || 0), 0);

    return {
      id: b.id,
      date: b.date,
      status: b.status,
      professional: b.professional
        ? { name: b.professional.name }
        : { name: "Profissional não definido" },
      barbershop,
      services: services.map((s) => ({ name: s.name, price: s.price })), // info mínima
      total,
    };
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 p-5 md:p-10 max-w-3xl mx-auto">
        <section>
          <h2 className="text-xl font-semibold mb-4">Meus Agendamentos</h2>

          {sanitizedBookings.length === 0 ? (
            <p className="text-gray-500">Nenhum agendamento encontrado.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {sanitizedBookings.map((booking) => (
                <SimpleBookingRow key={booking.id} booking={booking} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
