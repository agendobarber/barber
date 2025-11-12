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

    // ✅ Interceptar registro automático inválido do SDK
    const originalRegister = navigator.serviceWorker.register;
    navigator.serviceWorker.register = ((scriptURL: string, options?: RegistrationOptions) => {
      if (scriptURL.includes('onesignalsdkworker.js')) {
        console.warn('[OneSignal] Ignorando registro automático inválido.');
        // ✅ Retorna um valor nulo forçando o tipo para evitar erro TS
        return Promise.resolve(null as unknown as ServiceWorkerRegistration);
      }
      return originalRegister(scriptURL, options);
    }) as typeof originalRegister;

    // ✅ Registrar manualmente o SW correto
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/OneSignalSDKWorker.js', { scope: '/' })
        .then(() => console.log("[OneSignal] SW registrado manualmente"))
        .catch(err => console.error("[OneSignal] Erro ao registrar SW:", err));
    }

    // ✅ Inicializar OneSignal
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      console.log("[OneSignal] Inicializando...");
      await OneSignal.init({
        appId: '8e1a7c53-84a0-442f-963d-3bd980a77e1b',
        safari_web_id: "web.onesignal.auto.25811132-3882-4d1b-a1e7-3632ed052841",
        allowLocalhostAsSecureOrigin: true,
        notifyButton: { enable: true },
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.js',
        serviceWorkerParam: { scope: '/' },
      });
      console.log("[OneSignal] Inicializado com sucesso.");
    });
  }, []);

  return null;
}