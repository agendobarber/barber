"use client";

import Header from "./header";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface UserData {
    id: string;
    name: string | null;
    email: string;
    role: string;
    status: number; // <- novo campo
    createdAt: string | Date;
}

const UsersListComponent = ({ users }: { users: UserData[] }) => {
    const router = useRouter();

    const toggleStatus = async (userId: string, currentStatus: number) => {
        const newStatus = currentStatus === 1 ? 0 : 1;

        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Erro ao atualizar status");

            toast.success("Status atualizado.");
            router.refresh();
        } catch (error) {
            toast.error("Erro ao atualizar status.");
            console.error(error);
        }
    };

    return (
        <>
            <Header />

            <div className="p-5 md:p-10 max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Usuários</h1>

                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-lg shadow-md overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/10 border-b border-white/10">
                            <tr>
                                <th className="py-3 px-4 font-semibold text-gray-200">Nome</th>
                                <th className="py-3 px-4 font-semibold text-gray-200">Email</th>
                                <th className="py-3 px-4 font-semibold text-gray-200">Criado em</th>
                                <th className="py-3 px-4 font-semibold text-gray-200">Status</th>
                                <th className="py-3 px-4 font-semibold text-gray-200">Ação</th>
                            </tr>
                        </thead>

                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-6 text-gray-400">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr
                                        key={u.id}
                                        className="hover:bg-white/5 transition"
                                    >
                                        <td className="py-3 px-4">{u.name ?? "Sem nome"}</td>
                                        <td className="py-3 px-4">{u.email}</td>
                                        <td className="py-3 px-4">
                                            {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                                        </td>

                                        {/* STATUS */}
                                        <td className="py-3 px-4 font-bold">
                                            {u.status === 1 ? (
                                                <span className="text-green-400">ATIVO</span>
                                            ) : (
                                                <span className="text-red-400">INATIVO</span>
                                            )}
                                        </td>

                                        {/* ACTION BUTTON */}
                                        <td className="py-3 px-4">
                                            <Button
                                                variant={u.status === 1 ? "destructive" : "default"}
                                                onClick={() => toggleStatus(u.id, u.status)}
                                            >
                                                {u.status === 1 ? "Inativar" : "Ativar"}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default UsersListComponent;
