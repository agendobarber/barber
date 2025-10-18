// app/barbershops/[id]/page.tsx

import BookingButton from "@/app/_components/bookingButton";
import PhoneItem from "@/app/_components/phone-item";
import SidebarSheet from "@/app/_components/sidebar-sheets";
import { Button } from "@/app/_components/ui/button";
import { Sheet, SheetTrigger } from "@/app/_components/ui/sheet";
import { db } from "@/app/_lib/prisma";
import { ChevronLeftIcon, MapPinIcon, MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// 🔹 Tipo limpo para serviços (Prisma.Decimal convertido para number)
interface SanitizedService {
  id: string;
  name: string;
  description: string;
  price: number;
  tempo: number;
  barbershopId: string;
  status: number;
}

// 🔹 Força esta página a ser dynamic (SSR)
export const dynamic = "force-dynamic";

const BarbershopPage = async ({
  params,
}: {
  params: Promise<{ id: string }>; // 🔹 Next 15 params é Promise
}) => {
  // 🔹 Espera a Promise resolver antes de usar
  const { id } = await params;

  // Buscar barbearia + serviços + profissionais
  const barbershop = await db.barbershop.findUnique({
    where: { id },
    include: { services: true, professionals: true },
  });

  if (!barbershop) return notFound();

  // Sanitizar serviços (Decimal -> number)
  const sanitizedBarbershop = {
    ...barbershop,
    services: barbershop.services.map(
      (s) =>
        ({
          ...s,
          price: Number(s.price),
        } as SanitizedService)
    ),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* BANNER */}
      <div className="relative w-full h-[220px] md:h-[350px] lg:h-[450px]">
        <Image
          src={sanitizedBarbershop.imageUrl}
          fill
          alt={sanitizedBarbershop.name}
          className="object-cover"
          priority
          sizes="100vw"
        />

        {/* Voltar */}
        <Button size="icon" variant="secondary" className="absolute left-4 top-4" asChild>
          <Link href="/">
            <ChevronLeftIcon />
          </Link>
        </Button>

        {/* Menu lateral */}
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="absolute right-4 top-4">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SidebarSheet />
        </Sheet>
      </div>

      {/* INFORMAÇÕES PRINCIPAIS */}
      <div className="p-5 flex flex-col gap-1 border-b border-solid">
        <h1 className="text-2xl font-bold">{sanitizedBarbershop.name}</h1>
        <div className="flex items-center gap-2">
          <MapPinIcon className="text-primary" size={18} />
          <p className="text-sm truncate">{sanitizedBarbershop.address}</p>
        </div>
      </div>

      {/* DESCRIÇÃO */}
      {sanitizedBarbershop.description && (
        <div className="p-5 border-b border-solid">
          <p className="text-sm text-gray-500 text-justify line-clamp-3">
            {sanitizedBarbershop.description}
          </p>
        </div>
      )}

      {/* BOTÃO DE RESERVA */}
      <div className="p-5">
        <BookingButton barbershop={sanitizedBarbershop as any} />
      </div>

      {/* TELEFONES */}
      {sanitizedBarbershop.phones?.length > 0 && (
        <div className="p-5 space-y-2">
          {sanitizedBarbershop.phones.map((phone) => (
            <PhoneItem key={phone} phone={phone} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BarbershopPage;
