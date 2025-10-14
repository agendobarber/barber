"use client";

import { toast } from "sonner";
import Header from "./header";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

interface Professional {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status?: number; // opcional caso queira controlar ativo/inativo
}

const BarbershopProfessionalsComponent = ({ barbershop }: { barbershop: any }) => {
    const router = useRouter();

    const handleNewProfessional = () => {
        router.push(`/professionals/new?barbershopId=${barbershop.id}`);
    };

    const toggleStatus = async (professionalId: string, currentStatus: number) => {
        const newStatus = currentStatus === 1 ? 0 : 1;

        try {
            const res = await fetch(`/api/professionals/${professionalId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Erro ao atualizar status");

            toast.success("Registro atualizado.");
            router.refresh(); // Atualiza a UI
        } catch (error) {
            toast.error("Erro ao atualizar registro.");
            console.error(error);
        }
    };

    return (
        <>
            <Header />
            <div className="p-5 max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Profissionais</h1>
                    <Button onClick={handleNewProfessional}>Novo</Button>
                </div>

                {barbershop.professionals.length === 0 ? (
                    <p className="text-gray-600">Nenhum profissional cadastrado ainda.</p>
                ) : (
                    <div className="space-y-4">
                        {barbershop.professionals.map((prof: Professional) => (
                            <div
                                key={prof.id}
                                className="border rounded-lg p-4 flex items-center gap-4"
                            >
                                <div className="flex-1">
                                    <h2 className="font-semibold text-lg">{prof.name}</h2>
                                    <p className="text-sm text-gray-600">{prof.email}</p>
                                    {prof.phone && (
                                        <p className="text-sm text-gray-600">📞 {prof.phone}</p>
                                    )}
                                </div>

                                <Button
                                    variant="secondary"
                                    onClick={() => router.push(`/professionals/${prof.id}`)}
                                >
                                    Editar
                                </Button>

                                {prof.status !== undefined && (
                                    <Button
                                        variant={prof.status === 1 ? "destructive" : "default"}
                                        onClick={() => toggleStatus(prof.id, prof.status!)}
                                    >
                                        {prof.status === 1 ? "Inativar" : "Ativar"}
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default BarbershopProfessionalsComponent;
