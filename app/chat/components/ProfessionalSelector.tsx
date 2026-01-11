
// app/chat/components/ProfessionalSelector.tsx
"use client";

import { Button } from "../../_components/ui/button";

export function ProfessionalSelector({
  professionals,
  bookingProfessional,
  setBookingProfessional,
  onContinue,
}: {
  professionals: any[];
  bookingProfessional: string;
  setBookingProfessional: (newId: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 bg-white p-4 rounded-xl shadow text-gray-900 w-fit">
      {professionals.map((p: any) => (
        <label
          key={p.id}
          className="flex items-center gap-3 cursor-pointer px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition w-fit"
        >
          <input
            type="checkbox"
            checked={bookingProfessional === p.id}
            onChange={() => setBookingProfessional(bookingProfessional === p.id ? "" : p.id)}
          />
          <span className="text-sm font-medium">{p.name}</span>
        </label>
      ))}

      {bookingProfessional && (
        <Button className="mt-2 w-fit" onClick={onContinue}>
          Continuar
        </Button>
      )}
    </div>
  );
}