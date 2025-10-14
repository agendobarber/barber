import { SearchIcon } from "lucide-react";
import Header from "./_components/header";
import { Button } from "./_components/ui/button";
import { Input } from "./_components/ui/input";
import Image from "next/image";
import { Card, CardContent } from "./_components/ui/card";
import { db } from "./_lib/prisma";
import BarbershopItem from "./_components/barber-shop-item";
import { quickSearchOptions } from "./_constants/search";
import BookingItem from "./_components/booking-item";
import Search from "./_components/search";
import { getServerSession } from "next-auth";
import { authOptions } from "./_lib/auth";

export default async function Home() {

  const barbershops = await db.barbershop.findMany({});
  const popularBarbershops = await db.barbershop.findMany({
    orderBy: { name: "desc" },
  });

  const session = await getServerSession(authOptions);

  // Buscar agendamentos do usuário logado
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

  // Converter Decimal -> number e preparar dados serializáveis
  const sanitizedBookings = bookings
    .map((b) => {
      const filteredServices = b.services
        .map((s) => ({
          name: s.service.name,
          price: Number(s.service.price),
          status: b.status,
        }))
        .filter((s) => s.status !== 0); // remove status 0

      if (filteredServices.length === 0) return null; // descarta booking sem serviços válidos

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
        status: b.status, // adiciona status geral
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

  // Agrupar agendamentos (cada booking = 1 grupo)
  const groupedBookings = sanitizedBookings.map((booking) => ({
    key: booking.id,
    ids: [booking.id], // agora sempre string[]
    date: booking.date,
    barbershop: booking.barbershop,
    services: booking.services,
    professional: booking.professional,
    status: booking.status,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="p-5 md:p-10 max-w-7xl mx-auto">
        <h2 className="text-xl font-bold">
          Olá, {session?.user?.name ?? "visitante"}
        </h2>
        <p className="text-sm md:text-base text-gray-400">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </p>

        {/* AGENDAMENTOS */}
        <h2 className="uppercase text-xs md:text-sm font-bold text-gray-400 mt-6 mb-3">
          Agendamentos
        </h2>
        <div className="flex overflow-x-auto gap-1 [&::-webkit-scrollbar]:hidden">
          {groupedBookings.length > 0 ? (
            groupedBookings.map((group) => (
              <BookingItem key={group.key} bookingGroup={group} />
            ))
          ) : (
            <p className="text-gray-500">Nenhum agendamento encontrado.</p>
          )}
        </div>

        {/* BUSCA */}
        <div className="mt-6">
          <Search />
        </div>

        {/* POPULARES */}
        <h2 className="uppercase text-xs md:text-sm font-bold text-gray-400 mt-6 mb-3">
          Barbearias
        </h2>
        <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 lg:grid-cols-4">
          {popularBarbershops.map((popularBarbershop) => (
            <BarbershopItem
              key={popularBarbershop.id}
              barbershop={popularBarbershop}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
