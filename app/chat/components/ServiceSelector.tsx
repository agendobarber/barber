
// app/chat/components/ServiceSelector.tsx
"use client";

import { Button } from "../../_components/ui/button";

export function ServiceSelector({
  services,
  selectedServices,
  setSelectedServices,
  onContinue,
}: {
  services: any[];
  selectedServices: string[];
  setSelectedServices: (fn: (prev: string[]) => string[]) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 bg-white p-4 rounded-xl shadow text-gray-900 w-fit">
      {services.map((s: any) => (
        <label
          key={s.id}
          className="flex items-center gap-3 cursor-pointer px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition w-fit"
        >
          <input
            type="checkbox"
            checked={selectedServices.includes(s.id)}
            onChange={() =>
              setSelectedServices((prev) =>
                prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
              )
            }
          />
          <span className="text-sm font-medium">{s.name} — {s.tempo} min</span>
        </label>
      ))}

      {selectedServices.length > 0 && (
        <Button className="mt-2 w-fit" onClick={onContinue}>
          Continuar
        </Button>
      )}
    </div>
  );
}
