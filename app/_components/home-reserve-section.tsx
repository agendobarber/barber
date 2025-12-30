
// app/_components/home-reserve-section.tsx
"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import BarbershopReserveSheet from "./barbershop-reserve-sheet";

type Professional = { id: string; name: string; status: number };
type Service = { id: string; name: string; price: number; tempo: number; status?: number };

export default function HomeReserveSection({
  barbershop,
  professionals,
  services,
}: {
  barbershop: { id: string; name: string; imageUrl: string; address?: string; phones?: string[] };
  professionals: Professional[];
  services: Service[];
}) {
  const [open, setOpen] = useState(false);
  const phones = barbershop.phones ?? [];

  return (
    <section aria-label="Reserva e informações" className="mt-8 w-full">
      {/* ===== Bloco do botão - isolado do grid ===== */}
      <div className="block w-full">
        <div className="flex justify-center">
          <Button
            className="text-lg py-4 font-semibold rounded-2xl px-8"
            onClick={() => setOpen(true)}
          >
            Reservar horário
          </Button>
        </div>

        {/* Sheet de reserva (multi-serviços) controlado por este botão */}
        <BarbershopReserveSheet
          barbershop={{ ...barbershop, professionals, services }}
          open={open}
          onOpenChange={setOpen}
          showTrigger={false}
        />
      </div>
    </section>
  );
}
