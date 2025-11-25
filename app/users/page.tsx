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

    // Busca todos os usuários (sem usar 'select' que trava TS)
    const usersRaw = await db.user.findMany({
        orderBy: { createdAt: "desc" },
    });

    // Mapeia para o formato que o componente espera
    const users = usersRaw.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,        // aqui pega do objeto real
        createdAt: u.createdAt,
    }));

    return <UsersListComponent users={users} />;
};

export default UsersPage;
