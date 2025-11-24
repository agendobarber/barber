import { getServerSession } from "next-auth";
import { authOptions } from "../_lib/auth";
import Header from "../_components/header";
import BookingItem from "../_components/booking-item";
import { db } from "../_lib/prisma";
import { requireRole } from "../_lib/requireRole";

export default async function MyBookingsPage() {
  await requireRole("user"); // bloqueia admin
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
    include: {
      professional: true,
      services: {
        include: { service: { include: { barbershop: true } } },
      },
    },
    orderBy: { date: "desc" },
  });

  const sanitizedBookings = bookings.map((b) => ({
    id: b.id,
    date: b.date,
    professional: b.professional
      ? { name: b.professional.name }
      : { name: "Profissional não definido" },
    barbershop: b.services[0]?.service.barbershop
      ? {
          id: b.services[0].service.barbershop.id,
          name: b.services[0].service.barbershop.name,
          imageUrl: b.services[0].service.barbershop.imageUrl,
        }
      : { id: "", name: "Barbearia desconhecida", imageUrl: "" },
    services: b.services.map((s) => ({
      name: s.service.name,
      price: Number(s.service.price),
      status: b.status, // agora compatível com BookingItem
    })),
    status: b.status, // adiciona status geral para BookingItem
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 p-5 md:p-10 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Olá, {session.user.name}</h2>
        <p className="text-gray-400 mb-6">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </p>

        <section>
          <h2 className="text-xl font-semibold mb-4">Meus Agendamentos</h2>

          {sanitizedBookings.length === 0 ? (
            <p className="text-gray-500">Nenhum agendamento encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {sanitizedBookings.map((booking) => (
                <BookingItem
                  key={booking.id}
                  bookingGroup={{
                    ids: [booking.id],
                    date: booking.date,
                    professional: booking.professional,
                    barbershop: booking.barbershop,
                    services: booking.services,
                    status: booking.status,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
