import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import ProfessionalFormComponent from "@/app/_components/professionalFormComponent";

interface EditProfessionalPageProps {
  params: Promise<{ id: string }>; // 👈 agora params é uma Promise
}

const EditProfessionalPage = async ({ params }: EditProfessionalPageProps) => {
  const { id } = await params; // 👈 precisa "await" aqui
  if (!id) return notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user) return notFound();

  const professional = await db.professional.findUnique({
    where: { id },
    include: {
      barbershop: { include: { admins: true } },
      schedules: true,
    },
  });

  if (!professional) return notFound();

  const isAdmin = professional.barbershop.admins.some(
    (admin) => admin.id === (session.user as any).id
  );
  if (!isAdmin) return notFound();

  return (
    <ProfessionalFormComponent
      barbershopId={professional.barbershopId}
      professional={{
        id: professional.id,
        name: professional.name,
        email: professional.email,
        phone: professional.phone || "",
        schedules: professional.schedules,
      }}
    />
  );
};

export default EditProfessionalPage;
