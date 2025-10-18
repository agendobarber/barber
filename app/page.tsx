import Header from "./_components/header";
import { db } from "./_lib/prisma";
import BarbershopItem from "./_components/barber-shop-item";
import BookingItem from "./_components/booking-item";
import Search from "./_components/search";
import { getServerSession } from "next-auth";
import { authOptions } from "./_lib/auth";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./_components/ui/button";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isMarketplace =
    (process.env.MARKETPLACE || "").toLowerCase() === "true";

  // Barbearias
  const barbershops = await db.barbershop.findMany({
    orderBy: { name: "asc" },
  });
  const singleBarbershop = barbershops[0];

  // Agendamentos
  const bookings = session?.user
    ? await db.booking.findMany({
      where: {
        userId: (session.user as any).id,
        date: { gte: new Date() },
      },
      include: {
        services: {
          include: {
            service: {
              include: { barbershop: true },
            },
          },
        },
        professional: true,
      },
      orderBy: { date: "asc" },
    })
    : [];

  const sanitizedBookings = bookings
    .map((b) => {
      const filteredServices = b.services
        .map((s) => ({
          name: s.service.name,
          price: Number(s.service.price),
          status: b.status,
        }))
        .filter((s) => s.status !== 0);

      if (filteredServices.length === 0) return null;

      return {
        id: b.id,
        date: b.date,
        barbershop: {
          id: b.services[0]?.service.barbershop?.id ?? "",
          name:
            b.services[0]?.service.barbershop?.name ?? "Barbearia desconhecida",
          imageUrl: b.services[0]?.service.barbershop?.imageUrl ?? "",
        },
        professional: b.professional
          ? { name: b.professional.name }
          : { name: "Profissional não definido" },
        services: filteredServices,
        status: b.status,
      };
    })
    .filter(Boolean) as {
      id: string;
      date: Date;
      barbershop: { id: string; name: string; imageUrl: string };
      professional: { name: string };
      services: { name: string; price: number; status: number }[];
      status: number;
    }[];

  const groupedBookings = sanitizedBookings.map((booking) => ({
    key: booking.id,
    ids: [booking.id],
    date: booking.date,
    barbershop: booking.barbershop,
    services: booking.services,
    professional: booking.professional,
    status: booking.status,
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="p-5 md:p-8 flex-1 max-w-5xl mx-auto w-full">
        <h2 className="text-xl font-bold mb-1">
          Olá, {session?.user?.name ?? "visitante"}
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </p>

        {/* Agendamentos */}
        <h3 className="uppercase text-xs font-semibold text-gray-400 mb-2">
          Meus agendamentos
        </h3>
        <div className="flex overflow-x-auto gap-2 pb-1 [&::-webkit-scrollbar]:hidden">
          {groupedBookings.length > 0 ? (
            groupedBookings.map((group) => (
              <BookingItem key={group.key} bookingGroup={group} />
            ))
          ) : (
            <p className="text-gray-500 text-sm">Nenhum agendamento ainda.</p>
          )}
        </div>

        {/* MARKETPLACE */}
        {isMarketplace ? (
          <>
            <div className="mt-6">
              <Search />
            </div>

            <h3 className="uppercase text-xs font-semibold text-gray-400 mt-6 mb-3">
              Barbearias disponíveis
            </h3>
            <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 lg:grid-cols-4">
              {barbershops.map((barbershop) => (
                <BarbershopItem key={barbershop.id} barbershop={barbershop} />
              ))}
            </div>
          </>
        ) : (
          /* EXCLUSIVO */
          singleBarbershop && (
            <div className="mt-6">
              <div className="relative rounded-2xl overflow-hidden shadow-md">
                <Image
                  src={singleBarbershop.imageUrl}
                  alt={singleBarbershop.name}
                  width={800}
                  height={400}
                  className="w-full h-52 object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4">
                  <h1 className="text-white text-2xl font-semibold">
                    {singleBarbershop.name}
                  </h1>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center gap-3">
                <Link
                  href={`/barbershops/${singleBarbershop.id}`}
                  className="w-full max-w-sm"
                >
                  <Button className="w-full text-lg py-6 font-semibold rounded-2xl">
                    Reservar horário
                  </Button>
                </Link>

                <p className="text-gray-400 text-sm">
                  Toque acima para escolher o melhor horário pra você ✂️
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
