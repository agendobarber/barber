
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
    if (!userId) return;
    if (typeof window === "undefined") return;

    const w = window as any;

    // Evita múltiplos inits
    if (w.OneSignalInitialized || initCalled.current) return;
    initCalled.current = true;

    // ✅ v16: garanta o array BEFORE script
    w.OneSignalDeferred = w.OneSignalDeferred || [];

    // ✅ Empurre o init já para o Deferred
    w.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          notifyButton: { enable: true },
          serviceWorkerParam: { scope: "/" },
          serviceWorkerPath: "OneSignalSDKWorker.js",
          serviceWorkerUpdaterPath: "OneSignalSDKUpdaterWorker.js",
          subscriptionOptions: { web: { notificationIcon: "/onesignal-icon.png" } },
          promptOptions: { slidedown: { enabled: true } },
          // autoResubscribe: true, // opcional
        });

        // ✅ (Opcional mas recomendado no user-centric v16) vincule o usuário:
        // move o conceito de external_id para login/logout
        if (OneSignal.login) {
          await OneSignal.login(String(userId));
        }

        // Tags (funcionam também no v16)
        await OneSignal.User.addTag("userId", userId);
        if ((session?.user as any)?.role === "admin") {
          await OneSignal.User.addTag("perfil", "admin");
        }

        w.OneSignalInitialized = true;
      } catch (error) {
        console.error("[OneSignal] Erro no init:", error);
      }
    });

    // ✅ Carregue o SDK com defer (recomendação v16)
    if (!w.OneSignal) {
      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true; // melhor que async para este caso
      document.head.appendChild(script);
    }
  }, [session]);

  return null;
}