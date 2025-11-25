import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "../_lib/auth";
import { db } from "../_lib/prisma";
import { requireRole } from "../_lib/requireRole";
import UsersListComponent from "../_components/UsersListComponent";

const UsersPage = async () => {
  await requireRole("admin");
  const session = await getServerSession(authOptions);

  if (!session?.user) return notFound();

  // Busca todos os usuários (sem select)
  const usersRaw = await db.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Map para UserData, usando 'as any' pra contornar TS no build
  const users = usersRaw.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: (u as any).status ?? 1, // força pegar status
    createdAt: u.createdAt,
  }));

  return <UsersListComponent users={users} />;
};

export default UsersPage;
