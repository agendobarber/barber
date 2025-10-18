import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import ProfessionalFormComponent from "@/app/_components/professionalFormComponent";

const NewProfessionalPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) return notFound();

  // Buscar a barbearia do admin logado
  const barbershop = await db.barbershop.findFirst({
    where: { admins: { some: { id: (session.user as any).id } } },
  });

  if (!barbershop) return notFound();

  return <ProfessionalFormComponent barbershopId={barbershop.id} />;
};

export default NewProfessionalPage;
