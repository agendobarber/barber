"use client";

import { toast } from "sonner";
import Header from "./header";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

interface BarbershopService {
    id: string;
    name: string;
    description: string;
    price: string;
    tempo: number; // ⏱️ novo campo
    imageUrl?: string;
    status: number;
}

const BarbershopServicesComponent = ({ barbershop }: { barbershop: any }) => {
    const router = useRouter();

    const handleNewService = () => {
        router.push(`/services/new?barbershopId=${barbershop.id}`);
    };

    const toggleStatus = async (serviceId: string, currentStatus: number) => {
        const newStatus = currentStatus === 1 ? 0 : 1;

        try {
            const res = await fetch(`/api/services/${serviceId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Erro ao atualizar status");

            toast.success("Registro atualizado.");
            router.refresh();
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
                    <h1 className="text-2xl font-bold">Serviços</h1>
                    <Button onClick={handleNewService}>Novo</Button>
                </div>

                {barbershop.services.length === 0 ? (
                    <p className="text-gray-600">Nenhum serviço cadastrado ainda.</p>
                ) : (
                    <div className="space-y-4">
                        {barbershop.services.map((service: BarbershopService) => (
                            <div
                                key={service.id}
                                className="border rounded-lg p-4 flex items-center gap-4"
                            >
                                <div className="flex-1">
                                    <h2 className="font-semibold text-lg">{service.name}</h2>
                                    <p className="text-sm text-gray-600">{service.description}</p>
                                    <p className="font-bold mt-1">💰 R$ {service.price}</p>
                                    <p className="text-sm text-gray-700">⏱️ {service.tempo} min</p>
                                </div>

                                <Button
                                    variant="secondary"
                                    onClick={() => router.push(`/services/${service.id}`)}
                                >
                                    Editar
                                </Button>

                                <Button
                                    variant={service.status === 1 ? "destructive" : "default"}
                                    onClick={() => toggleStatus(service.id, service.status)}
                                >
                                    {service.status === 1 ? "Inativar" : "Ativar"}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default BarbershopServicesComponent;
