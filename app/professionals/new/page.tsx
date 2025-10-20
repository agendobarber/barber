import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import ProfessionalFormComponent from "@/app/_components/professionalFormComponent";

const NewProfessionalPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) return notFound();

  const barbershop = await db.barbershop.findFirst({
    where: { admins: { some: { id: (session.user as any).id } } },
    include: { services: true },
  });

  if (!barbershop) return notFound();

  // 🔧 Converte Decimal → number para evitar erro de serialização
  const services = barbershop.services.map((s) => ({
    ...s,
    price: Number(s.price),
  }));

  return <ProfessionalFormComponent barbershopId={barbershop.id} services={services} />;
};

export default NewProfessionalPage;
