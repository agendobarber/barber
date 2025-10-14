"use client";

import { BarbershopService, Barbershop, Prisma } from "@prisma/client";
import { Card, CardContent } from "./ui/card";

interface ServiceItemProps {
  service: Omit<BarbershopService, "price"> & {
    price: number | Prisma.Decimal; // ✅ aceita ambos
  };
  barbershop: Pick<Barbershop, "name">;
}

const ServiceItem = ({ service }: ServiceItemProps) => {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">{service.name}</h3>
          <p className="text-sm text-gray-400">{service.description}</p>
          <p className="font-bold text-sm text-primary">
            {Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(Number(service.price))}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceItem;
