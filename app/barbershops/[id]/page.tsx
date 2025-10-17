import BookingButton from "@/app/_components/bookingButton";
import PhoneItem from "@/app/_components/phone-item";
import ServiceItem from "@/app/_components/service-item";
import SidebarSheet from "@/app/_components/sidebar-sheets";
import { Button } from "@/app/_components/ui/button";
import { Sheet, SheetTrigger } from "@/app/_components/ui/sheet";
import { db } from "@/app/_lib/prisma";
import { ChevronLeftIcon, MapPinIcon, MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// 🔹 Tipo de serviço limpo (sem Prisma.Decimal)
interface SanitizedService {
  id: string;
  name: string;
  description: string;
  price: number;
  tempo: number;
  barbershopId: string;
  status: number;
}

const BarbershopPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  // ✅ Corrige o uso assíncrono de params
  const { id } = await params;

  // ✅ Busca barbearia e serviços
  const barbershop = await db.barbershop.findUnique({
    where: { id },
    include: {
      services: true,
      professionals: true,
    },
  });

  if (!barbershop) return notFound();

  // ✅ Converte Decimal -> number e tipa corretamente
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
    <div>
      {/* BANNER */}
      <div className="relative w-full h-[250px] md:h-[400px] lg:h-[500px]">
        <Image
          src={sanitizedBarbershop.imageUrl}
          fill
          className="object-cover"
          alt="Imagem da barbearia"
          quality={100}
        />

        <Button
          size="icon"
          variant="secondary"
          className="absolute left-4 top-4"
          asChild
        >
          <Link href="/">
            <ChevronLeftIcon />
          </Link>
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="absolute right-4 top-4">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SidebarSheet />
        </Sheet>
      </div>

      {/* INFO PRINCIPAL */}
      <div className="p-5 border-b border-solid">
        <h1 className="mb-3 font-bold text-xl">{sanitizedBarbershop.name}</h1>
        <div className="mb-2 flex items-center gap-2">
          <MapPinIcon className="text-primary" size={18} />
          <p className="text-sm">{sanitizedBarbershop.address}</p>
        </div>
      </div>

      {/* SOBRE NÓS */}
      <div className="p-5 border-b border-solid space-y-2">
        <h2 className="text-xs font-bold uppercase text-gray-400">Sobre nós</h2>
        <p className="text-sm text-justify">{sanitizedBarbershop.description}</p>
      </div>

      {/* SERVIÇOS */}
      <div className="space-y-3 p-5">
        {/*<h2 className="text-xs font-bold uppercase text-gray-400 mb-3">
          Serviços
        </h2>

         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sanitizedBarbershop.services.map((service) => (
            <ServiceItem
              key={service.id}
              service={service}
              barbershop={{ name: sanitizedBarbershop.name }}
            />
          ))}
        </div>
           */}
        {/* Botão de reserva */}
        <div className="mt-6">
          <BookingButton barbershop={sanitizedBarbershop as any} />
        </div>
      </div>

      {/* TELEFONES */}
      {sanitizedBarbershop.phones && sanitizedBarbershop.phones.length > 0 && (
        <div className="p-5 space-y-3">
          {sanitizedBarbershop.phones.map((phone) => (
            <PhoneItem key={phone} phone={phone} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BarbershopPage;
