"use client";

import { useState, useEffect } from "react";
import Header from "@/app/_components/header";
import { FaFilter } from "react-icons/fa";

export default function BarbersBookingsReport() {
    const MIN_DATE = "2025-11-01";

    // Ajusta hoje para garantir que nunca fique antes do mínimo
    const todayRaw = new Date().toISOString().slice(0, 10);
    const today = todayRaw < MIN_DATE ? MIN_DATE : todayRaw;

    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    async function fetchData() {
        setLoading(true);

        const res = await fetch(
            `/api/reports/barbers-bookings?start=${startDate}&end=${endDate}`
        );
        const data = await res.json();

        setReportData(data);
        setLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, []);


    return (
        <div className="min-h-screen bg-gray-100 dark:bg-background flex flex-col text-gray-900 dark:text-white">
            <Header />

            <main className="flex-1 p-5 md:p-10 max-w-6xl mx-auto">

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Agendamentos por Barbeiro
                </h1>

                <p className="text-gray-600 dark:text-gray-400 mt-1 mb-8">
                    Filtre e visualize o desempenho dos barbeiros por período.
                </p>

                {/* ================== FILTROS ================== */}
                <div className="
        bg-white dark:bg-white/10
        border border-gray-200 dark:border-white/10
        rounded-lg p-6 mb-8 shadow-sm
      ">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

                        {/* Data inicial */}
                        <div>
                            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                                Data inicial
                            </label>

                            <input
                                type="date"
                                value={startDate}
                                min={MIN_DATE}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value >= MIN_DATE) setStartDate(value);
                                }}
                                className="
                w-full rounded-md border 
                border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-white 
                p-2
              "
                            />
                        </div>

                        {/* Data final */}
                        <div>
                            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                                Data final
                            </label>

                            <input
                                type="date"
                                value={endDate}
                                min={MIN_DATE}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value >= MIN_DATE) setEndDate(value);
                                }}
                                className="
                w-full rounded-md border 
                border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-white 
                p-2
              "
                            />
                        </div>

                        {/* Botão */}
                        <div className="flex items-end gap-3">
                            <button
                                onClick={fetchData}
                                className="
                flex-1 flex items-center gap-2 justify-center
                bg-blue-600 hover:bg-blue-700 text-white
                dark:bg-blue-500 dark:hover:bg-blue-600
                transition px-4 py-2 rounded-md font-semibold
              "
                            >
                                <FaFilter /> Filtrar
                            </button>
                        </div>
                    </div>
                </div>

                {/* ================== TABELA ================== */}
                <div className="
        bg-white dark:bg-white/10
        border border-gray-200 dark:border-white/10
        rounded-lg shadow-sm overflow-hidden
      ">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-white/10 border-b border-gray-200 dark:border-white/10">
                            <tr>
                                <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">Barbeiro</th>
                                <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">Agendamentos</th>
                                <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">Receita</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-6 text-gray-600 dark:text-gray-400">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : reportData.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-6 text-gray-600 dark:text-gray-400">
                                        Nenhum dado encontrado para o período selecionado.
                                    </td>
                                </tr>
                            ) : (
                                reportData.map((item) => (
                                    <tr key={item.professionalId} className="hover:bg-gray-100 dark:hover:bg-white/5 transition">
                                        <td className="py-3 px-4">{item.professionalName}</td>
                                        <td className="py-3 px-4">{item.bookings}</td>
                                        <td className="py-3 px-4">R$ {item.revenue.toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );

}
