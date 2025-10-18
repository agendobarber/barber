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

interface Schedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface ProfessionalFormComponentProps {
  barbershopId: string;
  professional?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    schedules?: Schedule[];
  };
}

const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const ProfessionalFormComponent = ({ barbershopId, professional }: ProfessionalFormComponentProps) => {
  const [form, setForm] = useState<ProfessionalForm>({
    name: professional?.name || "",
    email: professional?.email || "",
    phone: professional?.phone || "",
  });

  const [schedules, setSchedules] = useState<Schedule[]>(
    daysOfWeek.map((_, i) => {
      const found = professional?.schedules?.find((s) => s.dayOfWeek === i);
      return found ? { ...found } : { dayOfWeek: i, startTime: "00:00", endTime: "00:00" };
    })
  );

  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleChange = (field: keyof ProfessionalForm, value: string) =>
    setForm({ ...form, [field]: value });

  const handleScheduleChange = (index: number, field: "startTime" | "endTime", value: string) => {
    const updated = [...schedules];
    updated[index][field] = value;
    setSchedules(updated);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const url = professional ? `/api/professionals/${professional.id}` : `/api/professionals`;
      const method = professional ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, barbershopId, schedules }),
      });

      if (!res.ok) throw new Error("Erro ao salvar profissional");
      toast.success("Profissional salvo com sucesso!");
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

        <label className="flex flex-col gap-1">
          Telefone
          <input
            type="tel"
            className="border p-2 rounded"
            value={form.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </label>

        <div className="mt-4">
          <h2 className="font-semibold mb-2">Horários</h2>
          {schedules.map((s, i) => (
            <div key={i} className="flex gap-2 items-center mb-2">
              <span className="w-12 font-medium">{daysOfWeek[s.dayOfWeek]}</span>
              <input
                type="time"
                value={s.startTime}
                onChange={(e) => handleScheduleChange(i, "startTime", e.target.value)}
                className="border p-1 rounded"
              />
              <input
                type="time"
                value={s.endTime}
                onChange={(e) => handleScheduleChange(i, "endTime", e.target.value)}
                className="border p-1 rounded"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
          <Button variant="secondary" onClick={() => router.push("/professionals")}>
            Voltar
          </Button>
        </div>
      </div>
    </>
  );
};

export default ProfessionalFormComponent;
