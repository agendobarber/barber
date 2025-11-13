'use client';
import { useEffect } from "react";

declare global {
  interface Window {
    OneSignalDeferred: any[];
  }
}

export default function OneSignalClient() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load OneSignal SDK
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;

    script.onload = () => {
      console.log("[OneSignal] SDK carregado.");

      window.OneSignalDeferred = window.OneSignalDeferred || [];

      window.OneSignalDeferred.push(async (OneSignal: any) => {
        console.log("[OneSignal] Inicializando OneSignal...");

        try {
          await OneSignal.init({
            appId: "8e1a7c53-84a0-442f-963d-3bd980a77e1b",
            safari_web_id: "web.onesignal.auto.25811132-3882-4d1b-a1e7-3632ed052841",

            notifyButton: {
              enable: true,
            },

            // 🔥 ESSENCIAL: garante que o browser use seus workers corretos
            serviceWorkerParam: { scope: "/" },
            serviceWorkerPath: "OneSignalSDKWorker.js",
            serviceWorkerUpdaterPath: "OneSignalSDKUpdaterWorker.js",

            // 🔥 ESSENCIAL: o ícone QUEBRA push se não estiver aqui!
            subscriptionOptions: {
              web: {
                notificationIcon: "/onesignal-icon.png",
              },
            },

            // Opcional, mas recomendado
            promptOptions: {
              slidedown: {
                enabled: true,
              },
            },
          });

          console.log("[OneSignal] Inicialização concluída.");
        } catch (error) {
          console.error("[OneSignal] Erro no init:", error);
        }
      });
    };

    document.head.appendChild(script);
  }, []);

  return null;
}
