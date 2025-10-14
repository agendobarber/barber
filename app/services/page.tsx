import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "../_lib/auth";
import { db } from "../_lib/prisma";
import BarbershopServicesComponent from "../_components/barbershopServicesComponent";
import { requireRole } from "../_lib/requireRole";

const ServicesBarbershop = async () => {
  await requireRole("admin"); // bloqueia usuário comum
  const session = await getServerSession(authOptions);

  if (!session?.user) return notFound();

  const barbershop = await db.barbershop.findFirst({
    where: {
      admins: {
        some: { id: (session.user as any).id },
      },
    },
    include: {
      services: true,
    },
  });

  if (!barbershop) return notFound();

  // Converte Decimal para string
  const barbershopPlain = {
    ...barbershop,
    services: barbershop.services.map(service => ({
      ...service,
      price: service.price.toString(), // <- aqui
    })),
  };

  return <BarbershopServicesComponent barbershop={barbershopPlain} />;
};

export default ServicesBarbershop;
