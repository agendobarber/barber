import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import ProfessionalFormComponent from "@/app/_components/professionalFormComponent";

// Tipagem
interface EditProfessionalPageProps {
  params: Promise<{ id: string }>;
}

const EditProfessionalPage = async ({ params }: EditProfessionalPageProps) => {
  const { id } = await params;
  if (!id) return notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user) return notFound();

  const professional = await db.professional.findUnique({
    where: { id },
    include: {
      barbershop: { include: { admins: true } },
      schedules: true,
      services: true, // opcional, caso tenha relação many-to-many
    },
  });

  if (!professional) return notFound();

  const isAdmin = professional.barbershop.admins.some(
    (admin) => admin.id === (session.user as any).id
  );
  if (!isAdmin) return notFound();

  // Busca os serviços da barbearia (convertendo Decimal → number)
  const services = await db.barbershopService.findMany({
    where: { barbershopId: professional.barbershopId },
  });
  const serializableServices = services.map((s) => ({
    ...s,
    price: Number(s.price),
  }));

  return (
    <ProfessionalFormComponent
      barbershopId={professional.barbershopId}
      professional={{
        id: professional.id,
        name: professional.name,
        email: professional.email,
        phone: professional.phone || "",
        schedules: professional.schedules,
        serviceIds: professional.services?.map((s) => s.id) || [],
      }}
      services={serializableServices}
    />
  );
};

export default EditProfessionalPage;
