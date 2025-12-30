
// app/page.tsx
import Header from "./_components/header";
import { db } from "./_lib/prisma";
import BarbershopItem from "./_components/barber-shop-item";
import BookingItem from "./_components/booking-item";
import Search from "./_components/search";
import { getServerSession } from "next-auth";
import { authOptions } from "./_lib/auth";
import { redirect } from "next/navigation";
import InstallPrompt from "./_components/InstallPrompt";
import HomeReserveSection from "./_components/home-reserve-section";

// 👇 imports usados nos cards de endereço/contato
import { MapPin, Phone } from "lucide-react";
import PhoneItem from "./_components/phone-item";

// 👇 imports para abrir o modal de cadastro diretamente na Home
import { Dialog, DialogContent, DialogTrigger } from "./_components/ui/dialog";
import SignInDialog from "./_components/sign-in-dialog";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role === "admin") redirect("/dashboard");

  const isMarketplace = (process.env.MARKETPLACE || "").toLowerCase() === "true";

  const barbershops = await db.barbershop.findMany({ orderBy: { name: "asc" } });
  const singleBarbershop = barbershops[0];
  const phones = singleBarbershop?.phones ?? [];

  const bookings = session?.user
    ? await db.booking.findMany({
      where: {
        userId: (session.user as any).id,
        date: { gte: new Date() },
      },
      include: {
        services: { include: { service: { include: { barbershop: true } } } },
        professional: true,
      },
      orderBy: { date: "asc" },
    })
    : [];

  const sanitizedBookings = bookings
    .map((b) => {
      const filteredServices = b.services
        .map((s) => ({ name: s.service.name, price: Number(s.service.price), status: b.status }))
        .filter((s) => s.status !== 0);

      if (filteredServices.length === 0) return null;

      return {
        id: b.id,
        date: b.date,
        barbershop: {
          id: b.services[0]?.service.barbershop?.id ?? "",
          name: b.services[0]?.service.barbershop?.name ?? "Barbearia desconhecida",
          imageUrl: b.services[0]?.service.barbershop?.imageUrl ?? "",
        },
        professional: b.professional ? { name: b.professional.name } : { name: "Profissional não definido" },
        services: filteredServices,
        status: b.status,
      };
    })
    .filter(Boolean) as any[];

  const groupedBookings = sanitizedBookings.map((booking) => ({
    key: booking.id,
    ids: [booking.id],
    date: booking.date,
    barbershop: booking.barbershop,
    services: booking.services,
    professional: booking.professional,
    status: booking.status,
  }));

  // pegar profissionais e serviços
  const professionals =
    singleBarbershop &&
    (await db.professional.findMany({
      where: { barbershopId: singleBarbershop.id, status: 1 },
      select: { id: true, name: true, status: true },
      orderBy: { name: "asc" },
    }));

  const rawServices =
    singleBarbershop &&
    (await db.barbershopService.findMany({
      where: { barbershopId: singleBarbershop.id, status: 1 },
      select: { id: true, name: true, price: true, tempo: true, status: true },
      orderBy: { name: "asc" },
    }));

  const services =
    rawServices?.map((s) => ({
      id: s.id,
      name: s.name,
      price: Number(s.price),
      tempo: s.tempo,
      status: s.status,
    })) ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <InstallPrompt />
      <Header />

      <div className="p-5 md:p-8 flex-1 max-w-4xl mx-auto w-full">
        {/* ===== CONDICIONAL ÚNICA ===== */}
        {session?.user ? (
          <div>
            {/* saudação */}
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

            {/* agendamentos */}
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

            {/* marketplace ou home exclusiva */}
            {isMarketplace ? (
              <>
                <Search />

                <h3 className="uppercase text-xs font-semibold text-gray-400 mt-6 mb-3">
                  Barbearias disponíveis
                </h3>

                <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 lg:grid-cols-4">
                  {barbershops.map((b) => (
                    <BarbershopItem key={b.id} barbershop={b} />
                  ))}
                </div>
              </>
            ) : (
              singleBarbershop && (
                <HomeReserveSection
                  barbershop={singleBarbershop}
                  professionals={professionals ?? []}
                  services={services}
                />
              )
            )}
          </div>
        ) : (
          < div className="mt-3 rounded-lg p-4
        border border-gray-200 bg-white
        shadow-sm
        transition-colors

        dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-md
        "
          >
            <h2
              className="
      text-lg font-semibold mb-1
      text-gray-900
      dark:text-gray-100
    "
            >
              Bem-vindo👋
            </h2>

            <p
              className="
      text-sm
      text-gray-700
      dark:text-gray-300
    "
            >
              Para reservar horários e ver seus agendamentos, faça login ou{" "}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className="
            text-primary underline underline-offset-4 hover:opacity-90
            dark:text-primary
          "
                  >
                    crie sua conta aqui
                  </button>
                </DialogTrigger>
                <DialogContent className="w-[90%] max-w-md">
                  {/* Abre o modal de cadastro/entrada como CLIENTE */}
                  <SignInDialog role="user" />
                </DialogContent>
              </Dialog>
              .
            </p>
          </div>

        )}

        <div className="h-4 md:h-6" />

        {/* ===== Grid apenas das informações (2 colunas no desktop) ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* ENDEREÇO */}
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-primary/80">
                <MapPin className="w-5 h-5" />
              </span>

              <div>
                <p className="text-xs font-medium text-muted-foreground">Endereço</p>
                <p className="text-sm md:text-base text-foreground mt-1 leading-tight">
                  {singleBarbershop?.address}
                </p>
              </div>
            </div>
          </div>

          {/* CONTATO */}
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-primary/80">
                <Phone className="w-5 h-5" />
              </span>

              <div className="w-full">
                <p className="text-xs font-medium text-muted-foreground">Contato</p>

                {/* Telefone principal */}
                {phones.length > 0 ? (
                  <div className="mt-1">
                    <PhoneItem phone={phones[0]} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Nenhum telefone cadastrado.</p>
                )}

                {/* Demais telefones (colapsados) */}
                {phones.length > 1 && (
                  <details className="mt-2 text-xs text-muted-foreground">
                    <summary className="cursor-pointer select-none">Ver mais números</summary>
                    <div className="mt-2 space-y-1">
                      {phones.slice(1).map((p) => (
                        <PhoneItem key={p} phone={p} />
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
