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
    const userId = session?.user && (session.user as any).id;

    // Se não houver usuário ou não houver ID, não tente inicializar o OneSignal
    if (!userId) {
      return;
    }

    if (typeof window === "undefined") return;

    // Impede múltiplas inicializações
    if (window.OneSignalInitialized || initCalled.current) {
      return;
    }

    initCalled.current = true;

    // Carrega o script do OneSignal
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;

    script.onload = () => {

      window.OneSignalDeferred = window.OneSignalDeferred || [];

      window.OneSignalDeferred.push(async (OneSignal: any) => {
        if (window.OneSignalInitialized) {
          return;
        }

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

          // Adiciona a tag com o ID do usuário
          await OneSignal.User.addTag("userId", userId);

          if(session?.user && (session.user as any).role === 'admin'){
            console.log("adicionar tag de admin")
            await OneSignal.User.addTag("perfil", "admin");
          }         

        } catch (error) {
          console.error("[OneSignal] Erro no init:", error);
        }
      });
    };

    document.head.appendChild(script);
  }, [session]);

  return null;
}
