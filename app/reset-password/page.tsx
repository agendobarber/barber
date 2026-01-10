
"use client";

import { Suspense } from "react";
import ResetPasswordClient from "./reset-password-client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Carregando…</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
