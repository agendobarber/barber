
// app/_components/PWAInstallBridge.tsx
"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __deferredPrompt?: any;
  }
}

export default function PWAInstallBridge() {
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      // guarda globalmente para ser reutilizado
      window.__deferredPrompt = e;
      // opcional: dispare um evento custom para avisar quem precisar
      window.dispatchEvent(new Event("pwa-deferred-available"));
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return null;
}
``
