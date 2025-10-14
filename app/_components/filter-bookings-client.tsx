"use client";

import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import BookingItem from "./booking-item";

interface Props {
    bookings: any[];
}

export default function FilterBookingsClient({ bookings }: Props) {
    const [filter, setFilter] = useState<"ativo" | "cancelado">("ativo");

    const filteredBookings = useMemo(() => {
        return bookings.filter((b) => {
            const allServicesCancelled = b.services.every((s: any) => s.status === 0);
            if (filter === "ativo") return !allServicesCancelled; // mostra se existe algum serviço ativo
            if (filter === "cancelado") return allServicesCancelled; // mostra se todos estão cancelados
            return true;
        });
    }, [filter, bookings]);


    return (
        <div>
            <div className="flex gap-2 mb-6">
                <Button
                    variant={filter === "ativo" ? "default" : "outline"}
                    onClick={() => setFilter("ativo")}
                >
                    Ativos
                </Button>
                <Button
                    variant={filter === "cancelado" ? "destructive" : "outline"}
                    onClick={() => setFilter("cancelado")}
                >
                    Cancelados
                </Button>
            </div>

            <div className="flex flex-wrap gap-3">
                {filteredBookings.length > 0 ? (
                    filteredBookings.map((group) => (
                        <BookingItem key={group.key} bookingGroup={group} isBarber />
                    ))
                ) : (
                    <p className="text-gray-500">
                        Nenhum agendamento encontrado para o filtro selecionado.
                    </p>
                )}
            </div>
        </div>
    );
}
