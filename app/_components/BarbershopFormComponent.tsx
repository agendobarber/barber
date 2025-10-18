"use client";

import Header from "./header";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { toast } from "sonner";
import Image from "next/image";

interface BarbershopForm {
    name: string;
    address: string;
    phones: string[];
    description: string;
    imageFile?: File;
    imageUrl?: string;
}

const BarbershopFormComponent = ({ barbershop }: { barbershop: any }) => {
    const [form, setForm] = useState<BarbershopForm>({
        name: barbershop.name,
        address: barbershop.address,
        phones: barbershop.phones,
        description: barbershop.description,
        imageUrl: barbershop.imageUrl,
    });

    const [preview, setPreview] = useState<string>(barbershop.imageUrl || "");
    const [isSaving, setIsSaving] = useState(false);

    const router = useRouter();

    const handleChange = (field: keyof BarbershopForm, value: string | File) => {
        if (field === "phones" && typeof value === "string") {
            setForm({ ...form, phones: value.split(",").map((p) => p.trim()) });
        } else if (field === "imageFile" && value instanceof File) {
            setForm({ ...form, imageFile: value });
            setPreview(URL.createObjectURL(value));
        } else {
            setForm({ ...form, [field]: value });
        }
    };

    const handleSubmit = async () => {
        setIsSaving(true);

        try {
            const data = new FormData();
            data.append("name", form.name);
            data.append("address", form.address);
            data.append("phones", JSON.stringify(form.phones));
            data.append("description", form.description);
            if (form.imageFile) data.append("image", form.imageFile);

            const res = await fetch(`/api/barbershop/${barbershop.id}`, {
                method: "PUT",
                body: data,
            });

            const result = await res.json();

            if (!res.ok) {
                console.error("Erro do servidor:", result);
                throw new Error(result.error || "Falha ao atualizar");
            }

            setIsSaving(false);
            toast.success("Registro atualizado.")
            // Opcional: atualizar a página ou cache do Next.js
            // router.refresh();
        } catch (err) {
            console.error(err);
            toast.error("Erro ao atualizar registro.")
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        router.push("/dashboard");
    };

    return (
        <>
            <Header />
            <div className="p-5 space-y-4 max-w-xl mx-auto">
                <h1 className="text-2xl font-bold">Dados Gerais</h1>

                <label className="flex flex-col gap-1">
                    Nome
                    <input
                        className="border p-2 rounded"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                    />
                </label>

                <label className="flex flex-col gap-1">
                    Endereço
                    <input
                        className="border p-2 rounded"
                        value={form.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                    />
                </label>

                <label className="flex flex-col gap-1">
                    Telefones (separados por vírgula)
                    <input
                        className="border p-2 rounded"
                        value={form.phones.join(", ")}
                        onChange={(e) => handleChange("phones", e.target.value)}
                    />
                </label>

                <label className="flex flex-col gap-1">
                    Descrição
                    <textarea
                        className="border p-2 rounded"
                        value={form.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                    />
                </label>

                <div className="flex flex-col gap-2">
                    <span className="font-medium">Imagem da Barbearia</span>
                    <label className="cursor-pointer mt-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-200 text-center text-black">
                        Selecionar Imagem
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                                e.target.files?.[0] && handleChange("imageFile", e.target.files[0])
                            }
                        />
                    </label>
                    {preview && (
                        <div className="w-full h-64 relative border border-gray-300 rounded-lg">
                            <Image
                                src={preview}
                                alt="Preview"
                                fill
                                style={{ objectFit: "contain" }}
                                className="rounded-lg"
                                priority={true} // opcional: melhora LCP para imagens críticas
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-4">
                    <Button
                        className="gap-2"
                        variant="secondary"
                        onClick={handleSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button className="gap-2" variant="default" onClick={handleBack}>
                        Voltar
                    </Button>
                </div>
            </div>
        </>
    );
};

export default BarbershopFormComponent;
