'use client';
import { useEffect } from "react";

declare global {
  interface Window {
    OneSignalDeferred: any[];
  }
}

export default function OneSignalClient() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Carregar SDK do OneSignal
    const script = document.createElement('script');
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;
    script.onload = () => {
      console.log("[OneSignal] SDK carregado.");
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        console.log("[OneSignal] Inicializando...");
        try {
          await OneSignal.init({
            appId: '8e1a7c53-84a0-442f-963d-3bd980a77e1b',
           // allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: true }
          });
          console.log("[OneSignal] Inicializado com sucesso.");
        } catch (err) {
          console.error("[OneSignal] Erro no init:", err);
        }
      });
    };
    document.head.appendChild(script);
  }, []);

  return null;
}