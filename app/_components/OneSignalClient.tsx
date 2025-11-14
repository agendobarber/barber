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

    console.log("OEEEEEEEE");
    console.table(session)
    console.log(session?.user && (session.user as any).role);

    // Se não houver usuário ou não houver ID, não tente inicializar o OneSignal
    if (!userId) {
      console.log("[OneSignal] Aguardando sessão com userId...");
      return;
    }

    if (typeof window === "undefined") return;

    // Impede múltiplas inicializações
    if (window.OneSignalInitialized || initCalled.current) {
      console.log("[OneSignal] Já inicializado. Ignorando...");
      return;
    }

    initCalled.current = true;

    console.log("[OneSignal] Carregando SDK...");

    // Carrega o script do OneSignal
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;

    script.onload = () => {
      console.log("[OneSignal] SDK carregado.");

      window.OneSignalDeferred = window.OneSignalDeferred || [];

      window.OneSignalDeferred.push(async (OneSignal: any) => {
        if (window.OneSignalInitialized) {
          console.log("[OneSignal] Já estava iniciado.");
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

          // Adiciona a tag com o ID do usuário
          //await OneSignal.User.addTag("userId", userId);

          if(session?.user && (session.user as any).role === 'admin'){
            console.log("adicionar tag de admin")
            await OneSignal.User.addTag("perfil", "admin");
          }

          console.log("[OneSignal] Tag userId adicionada:", userId);

          

        } catch (error) {
          console.error("[OneSignal] Erro no init:", error);
        }
      });
    };

    document.head.appendChild(script);
  }, [session]);

  return null;
}
