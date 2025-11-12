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

    // ✅ Preserva contexto original do método register
    const originalRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker);

    // ✅ Intercepta registro automático inválido do SDK
    navigator.serviceWorker.register = ((scriptURL: string, options?: RegistrationOptions) => {
      if (scriptURL.toLowerCase().includes('onesignalsdkworker.js')) {
        console.warn('[OneSignal] Ignorando registro automático inválido.');
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
        appId: '7616b9f5-ce00-466c-a8c4-a6801e1d7bbd',
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