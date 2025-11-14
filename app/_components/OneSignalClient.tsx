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
          await OneSignal.User.addTag("userId", userId);
          console.log("[OneSignal] Tag userId adicionada:", userId);

          try {
            // Envia um push de teste
            const res = await fetch("/api/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: "Teste de Push!",
                message: "Seu push está funcionando 🎉",
                userId: userId, // ID do usuário autenticado
              }),
            });

            const data = await res.json();
            console.log("Resposta do servidor:", data);

            if (res.ok) {
              console.log("Push enviado com sucesso!");
            } else {
              console.log("Erro ao enviar push: " + data.error);
            }
          } catch (err) {
            console.error("Erro no botão de push:", err);
            console.log("Falha ao enviar push");
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
