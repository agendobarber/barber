"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

declare global {
  interface Window {
    OneSignalDeferred: any[];
    OneSignalInitialized?: boolean;
  }
}

export default function OneSignalClient() {
  const { data: session } = useSession();
  const initCalled = useRef(false); // trava local para evitar múltiplas execuções

  useEffect(() => {
    if (!session) return;
    if (typeof window === "undefined") return;

    // Se já inicializou alguma vez → não roda mais
    if (window.OneSignalInitialized || initCalled.current) {
      console.log("[OneSignal] Já iniciado. Ignorando nova inicialização.");
      return;
    }

    initCalled.current = true;

    console.log("[OneSignal] Carregando SDK...");

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;

    script.onload = () => {
      console.log("[OneSignal] SDK carregado.");

      window.OneSignalDeferred = window.OneSignalDeferred || [];

      window.OneSignalDeferred.push(async (OneSignal: any) => {
        if (window.OneSignalInitialized) {
          console.log("[OneSignal] Já estava iniciado. Ignorando.");
          return;
        }

        console.log("[OneSignal] Inicializando OneSignal...");

        try {
          await OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
            notifyButton: { enable: true },
            serviceWorkerParam: { scope: "/" },
            serviceWorkerPath: "OneSignalSDKWorker.js",
            serviceWorkerUpdaterPath: "OneSignalSDKUpdaterWorker.js",
            subscriptionOptions: {
              web: { notificationIcon: "/onesignal-icon.png" },
            },
            promptOptions: { slidedown: { enabled: true } },
          });

          window.OneSignalInitialized = true;
          console.log("[OneSignal] Inicialização concluída.");

          // marca o user do banco
          await OneSignal.User.addTag("userId", session.user.id);
          console.log("[OneSignal] Tag userId adicionada:", session.user.id);

        } catch (error) {
          console.error("[OneSignal] Erro no init:", error);
        }
      });
    };

    document.head.appendChild(script);
  }, [session]);

  return null;
}
