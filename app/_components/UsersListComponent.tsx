
"use client";

import Header from "./header";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { CheckCircle, XCircle, Pencil } from "lucide-react";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: number; // 1 = ativo, 0 = inativo
  createdAt: string | Date;
}

interface UsersListComponentProps {
  users: UserData[];
  barbershopId?: string | null;
}

const UsersListComponent = ({ users, barbershopId = null }: UsersListComponentProps) => {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const toggleStatus = async (userId: string, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;

    try {
      setLoadingId(userId);

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
    } finally {
      setLoadingId(null);
    }
  };

  const goEdit = (userId: string) => {
    router.push(`/users/${userId}/edit`);
  };

  const goCreate = () => {
    if (barbershopId) {
      router.push(`/users/new?barbershopId=${encodeURIComponent(barbershopId)}`);
    } else {
      router.push("/users/new");
    }
  };

  return (
    <>
      <Header />

      <div className="p-5 md:p-10 max-w-5xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Usuários</h1>

          <Button onClick={goCreate} aria-label="Adicionar usuário" title="Adicionar usuário">
            Novo
          </Button>
        </div>

        {/* Card: mantenha o rounded aqui, mas dê respiro no wrapper interno */}
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-lg shadow-md">
          {/* Wrapper de scroll com padding lateral para evitar corte visual */}
          <div className="overflow-x-auto px-4 md:px-6 py-2">
            <table className="min-w-[700px] w-full text-left">
              <thead className="bg-white/10 border-b border-white/10">
                <tr>
                  {/* Gutter / espaçador à esquerda */}
                  <th className="w-3 md:w-4 p-0" aria-hidden="true"></th>

                  {/* Ação primeiro */}
                  <th className="py-3 px-4 font-semibold w-[160px]">Ação</th>
                  <th className="py-3 px-4 font-semibold">Nome</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold hidden sm:table-cell">Criado em</th>
                </tr>
              </thead>

              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-300">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isActive = u.status === 1;
                    const isLoading = loadingId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-white/5 transition">
                        {/* Gutter */}
                        <td className="w-3 md:w-4 p-0" aria-hidden="true"></td>

                        {/* Ação */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {isActive ? (
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => toggleStatus(u.id, u.status)}
                                disabled={isLoading}
                                aria-label="Inativar usuário"
                                title="Inativar usuário"
                              >
                                <XCircle className="h-5 w-5" />
                              </Button>
                            ) : (
                              <Button
                                size="icon"
                                variant="default"
                                onClick={() => toggleStatus(u.id, u.status)}
                                disabled={isLoading}
                                aria-label="Ativar usuário"
                                title="Ativar usuário"
                                className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </Button>
                            )}

                            <Button
                              size="icon"
                              onClick={() => goEdit(u.id)}
                              aria-label="Editar usuário"
                              title="Editar usuário"
                            >
                              <Pencil className="h-5 w-5" />
                            </Button>
                          </div>
                        </td>

                        {/* Nome */}
                        <td className="py-3 px-4 whitespace-nowrap">{u.name ?? "Sem nome"}</td>

                        {/* Email */}
                        <td className="py-3 px-4 whitespace-nowrap">{u.email}</td>

                        {/* Criado em */}
                        <td className="py-3 px-4 hidden sm:table-cell">
                          {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default UsersListComponent;
