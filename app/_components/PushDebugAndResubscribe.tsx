
// app/_components/PushDebugAndResubscribe.tsx
"use client";

import { useEffect, useState, useMemo } from "react";

function isIOSSafari(ua: string) {
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafariEngine =
    !!(ua.includes("safari") && !ua.includes("crios") && !ua.includes("fxios"));
  return isIOS && isSafariEngine;
}

export default function PushDebugAndResubscribe() {
  const [log, setLog] = useState<string[]>([]);
  const addLog = (msg: string) =>
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  const clearLogs = () => setLog([]);

  useEffect(() => {
    (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
  }, []);

  const ua = useMemo(() => navigator.userAgent.toLowerCase(), []);
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafari = isIOSSafari(ua);

  // ===== Botão: Ver status push =====
  const checkStatus = async () => {
    try {
      const w = window as any;
      if (!w.OneSignalDeferred) {
        addLog("OneSignalDeferred ausente.");
        return;
      }
      w.OneSignalDeferred.push(async (OneSignal: any) => {
        addLog(`OneSignal.version=${OneSignal?.version ?? "N/A"}`);
        addLog(`keys=${Object.keys(OneSignal || {}).join(", ")}`);
        addLog(`typeof Notifications=${typeof OneSignal?.Notifications}`);

        if (!OneSignal?.Notifications) {
          const perm =
            typeof Notification !== "undefined" ? Notification.permission : "N/A";
          addLog(`Notification.permission=${perm}`);
          try {
            const reg = await navigator.serviceWorker.getRegistration("/");
            addLog(reg ? "SW OK no escopo '/'" : "SW NÃO encontrado no escopo '/'");
          } catch (swErr: any) {
            addLog(`Erro ao verificar SW: ${swErr?.message ?? swErr}`);
          }
          addLog("Checklist: init via Deferred + SW na raiz ('/').");
          return;
        }

        const enabled =
          await OneSignal.Notifications.isPushNotificationsEnabled?.();
        const canRequest =
          await OneSignal.Notifications.canRequestPermission?.();
        addLog(
          `isPushEnabled=${String(enabled)}, canRequestPermission=${String(canRequest)}`
        );

        const permission = await OneSignal.Notifications.getPermission?.();
        addLog(`permission=${String(permission)}`);

        const device = await OneSignal.User.getDevice?.();
        addLog(`device=${device ? JSON.stringify(device) : "N/A"}`);

        const aliases = await OneSignal.User.getAliases?.();
        addLog(`aliases=${aliases ? JSON.stringify(aliases) : "N/A"}`);

        const tags = await OneSignal.User.getTags?.();
        addLog(`tags=${tags ? JSON.stringify(tags) : "N/A"}`);
      });
    } catch (e: any) {
      addLog(`Erro checkStatus: ${e?.message ?? e}`);
    }
  };

  // ===== Botão: Reinscrever/Permitir =====
  const resubscribe = async () => {
    try {
      const w = window as any;
      if (!w.OneSignalDeferred) {
        addLog("OneSignalDeferred ausente.");
        return;
      }
      w.OneSignalDeferred.push(async (OneSignal: any) => {
        if (!OneSignal?.Notifications) {
          addLog("Notifications indisponível para pedir permissão.");
          addLog("Checklist: init via Deferred, SW na raiz ('/'), HTTPS + manifest.");
          return;
        }

        const canRequest =
          await OneSignal.Notifications.canRequestPermission?.();
        addLog(`canRequestPermission=${String(canRequest)}`);

        if (canRequest) {
          const granted = await OneSignal.Notifications.requestPermission?.();
          addLog(`requestPermission granted=${String(granted)}`);
        } else {
          addLog(
            "Permissão bloqueada no navegador. Libere em: Cadeado → Permissões → Notificações → Permitir."
          );
        }

        const enabled =
          await OneSignal.Notifications.isPushNotificationsEnabled?.();
        addLog(`isPushEnabled after request=${String(enabled)}`);

        try {
          const reg = await navigator.serviceWorker.getRegistration("/");
          if (reg) {
            await reg.update();
            addLog("ServiceWorker atualizado.");
          } else {
            addLog("ServiceWorker NÃO encontrado no escopo '/'.");
          }
        } catch (swErr: any) {
          addLog(`Erro ao atualizar SW: ${swErr?.message ?? swErr}`);
        }
        addLog("Resubscribe tentativa concluída.");
      });
    } catch (e: any) {
      addLog(`Erro resubscribe: ${e?.message ?? e}`);
    }
  };

  // ===== Botão: Baixar App (instalar PWA direto, sem modal) =====
  const installAppNow = async () => {
    const dp = (window as any).__deferredPrompt;

    if (isIOS) {
      // iOS: não há prompt nativo; usar share() quando possível
      if (isSafari && "share" in navigator) {
        try {
          await (navigator as any).share({
            title: "Instalar App",
            text: "Escolha 'Adicionar à Tela de Início'",
            url: window.location.href,
          });
          addLog("share() aberto para instruir instalação (iOS/Safari).");
        } catch {
          addLog(
            "Usuário cancelou o share. Siga: Compartilhar → Adicionar à Tela de Início."
          );
          alert("No iPhone/iPad: toque em Compartilhar → Adicionar à Tela de Início.");
        }
      } else {
        alert("No iPhone/iPad: toque em Compartilhar → Adicionar à Tela de Início.");
        addLog("Instrução exibida (iOS, fora do Safari).");
      }
      return;
    }

    // Android/Chrome: precisa do evento beforeinstallprompt (capturado pelo bridge)
    if (dp) {
      try {
        dp.prompt();
        await dp.userChoice;
        addLog("Prompt de instalação exibido (Android/Chrome).");
      } catch (err: any) {
        addLog(`Erro ao exibir prompt: ${err?.message ?? err}`);
      }
    } else {
      // Fallback: instrução manual
      addLog("beforeinstallprompt indisponível. Fallback instruções.");
      alert("No Chrome: toque no menu ⋮ → Adicionar à tela inicial.");
    }
  };

  // ===== Botão: Copiar todos os logs =====
  const copyLogs = async () => {
    if (!log.length) return;

    const text = log.join("\n");

    // Tenta API moderna do clipboard
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        // opcional: feedback visual
        addLog("✅ Logs copiados para a área de transferência.");
        return;
      } catch {
        // Continua para o fallback
      }
    }

    // Fallback com textarea temporário
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.left = "-1000px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      addLog(ok ? "✅ Logs copiados (fallback)." : "❌ Falha ao copiar (fallback).");
    } catch {
      addLog("❌ Falha ao copiar logs.");
    }
  };

  return (
    <div className="rounded-lg border p-3 text-sm">
      <div className="flex flex-wrap gap-2">
        <button onClick={checkStatus} className="px-3 py-2 bg-gray-800 text-white rounded">
          Ver situação das notificações
        </button>
        <button onClick={resubscribe} className="px-3 py-2 bg-blue-600 text-white rounded">
          Ativar notificações novamente
        </button>
        {/* ✅ Novo botão "Baixar App" */}
        <button onClick={installAppNow} className="px-3 py-2 bg-black text-white rounded">
          Baixar App
        </button>
        {/* ✅ Copiar logs (habilitado quando houver mensagens) */}

        <button
          onClick={copyLogs}
          className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          disabled={log.length === 0}
          title={log.length === 0 ? "Sem mensagens para copiar" : "Copiar todas as mensagens"}
        >
          Copiar informações
        </button>
        {/* ✅ Botão para limpar logs */}
        <button onClick={clearLogs} className="px-3 py-2 bg-gray-200 text-gray-800 rounded">
          Limpar lista
        </button>
      </div>

      <div className="mt-3 max-h-48 overflow-auto font-mono text-xs bg-gray-50 p-2">
        {log.map((l, idx) => (
          <div key={idx}>{l}</div>
        ))}
      </div>
    </div>
  );
}
