
"use client";

import { useEffect } from "react";

/**
 * Lê o barbershopId do atributo data-barbershop-id do <body>,
 * busca o tema em /api/theme e aplica 'dark' no <html> conforme modo e sistema.
 */

export default function ThemeInitScript() {
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const res = await fetch(`/api/theme?barbershopId`, { cache: "no-store" });
        const data = await res.json();

        const mode: "light" | "dark" | "system" = data?.mode ?? "system";
        if (!mounted) return;

        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const applyDark = mode === "dark" || (mode === "system" && prefersDark);
        document.documentElement.classList.toggle("dark", applyDark);
      } catch {
        // fallback: segue sistema
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", prefersDark);
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
