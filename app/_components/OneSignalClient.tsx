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
  const initCalled = useRef(false);

  useEffect(() => {
    // só segue se existir user logado **com ID**
    if (!session?.user?.id) {
      console.log("[OneSignal] Sem sessão ou sem userId. Aguardando login...");
      return;
    }

    if (typeof window === "undefined") return;

    // evita reinicialização
    if (window.OneSignalInitialized || initCalled.current) {
      console.log("[OneSignal] Já iniciado anteriormente. Ignorando...");
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
          console.log("[OneSignal] SDK já estava inicializado.");
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

          // marca o usuário no OneSignal
          await OneSignal.User.addTag("userId", session.user.id);
          console.log("[OneSignal] Tag userId adicionada ao usuário:", session.user.id);

        } catch (error) {
          console.error("[OneSignal] Erro no init:", error);
        }
      });
    };

    document.head.appendChild(script);
  }, [session?.user?.id]);

  return null;
}
