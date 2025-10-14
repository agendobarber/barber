"use client";

import Header from "./header";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ProfessionalForm {
    name: string;
    email: string;
    phone?: string;
}

interface ProfessionalFormComponentProps {
    barbershopId: string;
    professional?: {
        id: string;
        name: string;
        email: string;
        phone?: string;
    };
}

const ProfessionalFormComponent = ({ barbershopId, professional }: ProfessionalFormComponentProps) => {
    const [form, setForm] = useState<ProfessionalForm>({
        name: professional?.name || "",
        email: professional?.email || "",
    });

    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const handleChange = (field: keyof ProfessionalForm, value: string) => {
        setForm({ ...form, [field]: value });
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const url = professional ? `/api/professionals/${professional.id}` : `/api/professionals`;
            const method = professional ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, barbershopId }),
            });

            if (!res.ok) {
                throw new Error("Erro ao salvar profissional");
            }

            toast.success(`Profissional ${professional ? "atualizado" : "cadastrado"} com sucesso!`);
            router.push("/professionals");
        } catch (err) {
            console.error(err);
            toast.error("Erro ao salvar profissional");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Header />
            <div className="p-5 space-y-4 max-w-xl mx-auto">
                <h1 className="text-2xl font-bold">{professional ? "Editar Profissional" : "Novo Profissional"}</h1>

                <label className="flex flex-col gap-1">
                    Nome
                    <input
                        className="border p-2 rounded"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                    />
                </label>

                <label className="flex flex-col gap-1">
                    Email
                    <input
                        type="email"
                        className="border p-2 rounded"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                    />
                </label>

                <div className="flex gap-2 mt-4">
                    <Button
                        className="gap-2"
                        variant="secondary"
                        onClick={handleSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button className="gap-2" variant="default" onClick={() => router.push("/professionals")}>
                        Voltar
                    </Button>
                </div>
            </div>
        </>
    );
};

export default ProfessionalFormComponent;
