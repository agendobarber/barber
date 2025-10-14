"use client";

import Header from "./header";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ServiceForm {
    name: string;
    description: string;
    price: string;
    tempo: string; // ⏱️ novo campo
}

const ServiceFormComponent = ({ barbershopId }: { barbershopId: string }) => {
    const [form, setForm] = useState<ServiceForm>({
        name: "",
        description: "",
        price: "",
        tempo: "",
    });

    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const handleChange = (field: keyof ServiceForm, value: string) => {
        setForm({ ...form, [field]: value });
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/services`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, barbershopId }),
            });

            if (!res.ok) {
                throw new Error("Erro ao salvar serviço");
            }

            toast.success("💈 Serviço cadastrado com sucesso!");
            router.push("/services");
        } catch (err) {
            console.error(err);
            toast.error("❌ Erro ao salvar serviço");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Header />
            <div className="p-5 space-y-4 max-w-xl mx-auto">
                <h1 className="text-2xl font-bold">💈 Novo Serviço</h1>

                <label className="flex flex-col gap-1">
                    ✂️ Nome
                    <input
                        className="border p-2 rounded"
                        placeholder="Ex: Corte de Cabelo"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                    />
                </label>

                <label className="flex flex-col gap-1">
                    🧴 Descrição
                    <textarea
                        className="border p-2 rounded"
                        placeholder="Descreva o serviço..."
                        value={form.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                    />
                </label>

                <label className="flex flex-col gap-1">
                    💰 Preço (R$)
                    <input
                        type="number"
                        step="0.01"
                        className="border p-2 rounded"
                        placeholder="Ex: 50.00"
                        value={form.price}
                        onChange={(e) => handleChange("price", e.target.value)}
                    />
                </label>

                <label className="flex flex-col gap-1">
                    ⏱️ Tempo (minutos)
                    <input
                        type="number"
                        className="border p-2 rounded"
                        placeholder="Ex: 45"
                        value={form.tempo}
                        onChange={(e) => handleChange("tempo", e.target.value)}
                    />
                </label>

                <div className="flex gap-2 mt-4">
                    <Button
                        className="gap-2"
                        variant="secondary"
                        onClick={handleSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? "💾 Salvando..." : "✅ Salvar"}
                    </Button>
                    <Button
                        className="gap-2"
                        variant="default"
                        onClick={() => router.push("/services")}
                    >
                        ↩️ Voltar
                    </Button>
                </div>
            </div>
        </>
    );
};

export default ServiceFormComponent;
