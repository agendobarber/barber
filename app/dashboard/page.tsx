import Header from "../_components/header";
import { db } from "../_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../_lib/auth";
import BarberCalendar from "../_components/BarberCalendar";
import { requireRole } from "../_lib/requireRole";
import { FaCalendarAlt, FaUsers, FaChartLine, FaMoneyBillWave } from 'react-icons/fa';  // Ícones

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

  const barbershopId = user.barbershopId;

  // Cálculo do total de agendamentos, clientes e agendamentos do mês
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999); // Até o final do dia de hoje

  const bookingsRaw = await db.booking.findMany({
    where: {
      services: { some: { service: { barbershopId } } },
      date: { gte: startOfMonth, lte: endOfToday },  // Filtrando agendamentos dentro do mês atual até hoje
    },
    include: {
      user: true,
      professional: true,
      services: { include: { service: { include: { barbershop: true } } } },
    },
    orderBy: { date: "asc" },
  });

  const totalBookings = bookingsRaw.length;

  // **Contagem de Clientes com Role 'user'**:
  const uniqueClients = await db.user.count({
    where: {
      role: "user",  // Somente usuários com a role 'user'
    },
  });

  // Cálculo do valor total de agendamentos DO MÊS até a data atual (somente confirmados)
  const totalRevenueThisMonth = bookingsRaw
    .filter((booking) => booking.status === 1)  // Filtra apenas agendamentos confirmados
    .reduce((acc, booking) => {
      // Calcula o total do valor dos serviços de cada agendamento (sem duplicação)
      const totalBookingPrice = booking.services.reduce((serviceAcc, service) => {
        return serviceAcc + parseFloat(service.service.price.toString());
      }, 0);

      // Somamos o valor total de cada agendamento ao total geral
      return acc + totalBookingPrice;
    }, 0);

  // Calcular Taxa de Ocupação (exemplo com número fixo de horários disponíveis)
  const totalAvailableSlots = 120; // Exemplo de número de horários totais disponíveis no mês (pode ser ajustado dinamicamente com base nos horários de funcionamento)
  const occupancyRate = ((totalBookings / totalAvailableSlots) * 100).toFixed(2);

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
        {/* Segunda Linha com 2 indicadores */}
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quantidade de Clientes */}
          <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center">
            <FaUsers className="text-3xl text-yellow-600 mb-2" />
            <h3 className="text-lg font-semibold text-gray-800">Clientes</h3>
            <p className="text-3xl font-bold text-gray-700">{uniqueClients}</p>
          </div>

          {/* Valor Total de Agendamentos no Mês */}
          <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center">
            <FaMoneyBillWave className="text-3xl text-purple-600 mb-2" />
            <h3 className="text-lg font-semibold text-gray-800">Receita do Mês</h3>
            <p className="text-3xl font-bold text-gray-700">
              R$ {totalRevenueThisMonth.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Calendário de Agendamentos */}
        <BarberCalendar bookings={sanitizedBookings} />
      </main>
    </div>
  );
}
