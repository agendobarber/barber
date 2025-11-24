// app/reports/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "../_lib/auth";
import Header from "../_components/header";
import { requireRole } from "../_lib/requireRole";
import Link from "next/link";
import { FaFilePdf, FaCalendarAlt, FaUserTie, FaMoneyBillWave } from "react-icons/fa";

export default async function ReportsPage() {
  // Apenas ADMIN pode ver
  await requireRole("admin");

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-10 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold">Acesso negado</h2>
          <p className="text-gray-500 mt-2">
            Você precisa estar logado como administrador para acessar os relatórios.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 p-5 md:p-10 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
        <p className="text-gray-400 mb-8">
          Gere relatórios operacionais e administrativos da sua barbearia.
        </p>

        {/* GRID DE RELATÓRIOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* RELATÓRIO 1 - Agendamentos por Barbeiro */}
          <div className="bg-white shadow-md rounded-lg p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <FaUserTie className="text-2xl text-purple-600" />
              <h3 className="text-xl font-semibold text-gray-800">
                Agendamentos por Barbeiro
              </h3>
            </div>
            <p className="text-gray-500 mb-4">
              Lista todos os barbeiros com seus agendamentos no período selecionado.
            </p>

            <Link
              href="/reports/barbers-bookings"
              className="mt-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
            >
              Ver relatório
              <FaCalendarAlt />
            </Link>
          </div>

          {/* RELATÓRIO 2 - Receita do Mês 
          <div className="bg-white shadow-md rounded-lg p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <FaMoneyBillWave className="text-2xl text-green-600" />
              <h3 className="text-xl font-semibold text-gray-800">
                Receita do Mês
              </h3>
            </div>
            <p className="text-gray-500 mb-4">
              Mostra a receita total gerada por serviços concluídos.
            </p>

            <Link
              href="/reports/month-revenue"
              className="mt-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
            >
              Ver relatório
              <FaFilePdf />
            </Link>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <FaCalendarAlt className="text-2xl text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-800">
                Agendamentos por Período
              </h3>
            </div>
            <p className="text-gray-500 mb-4">
              Filtre agendamentos por data inicial e final.
            </p>

            <Link
              href="/reports/bookings-range"
              className="mt-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
            >
              Ver relatório
              <FaCalendarAlt />
            </Link>
          </div>
         */}
          {/* Adicione mais cartões aqui conforme precisar */}

        </div>
      </main>
    </div>
  );
}
