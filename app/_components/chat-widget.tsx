
"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { MessageCircle, X, Bot } from "lucide-react";

interface ChatWidgetProps {
  userName?: string | null;
  iframeSrc?: string;
  width?: number;
  height?: number;
  openByDefault?: boolean;
  showWelcomeBubble?: boolean;
}

export default function ChatWidget({
  userName,
  iframeSrc = "/chat?embedded=1",
  width = 420,
  height = 520,
  openByDefault = false,
  showWelcomeBubble = true,
}: ChatWidgetProps) {
  const [open, setOpen] = useState(openByDefault);
  const [bubbleVisible, setBubbleVisible] = useState(showWelcomeBubble);

  // Some o balão após alguns segundos
  useEffect(() => {
    if (!showWelcomeBubble) return;
    const id = setTimeout(() => setBubbleVisible(false), 6000);
    return () => clearTimeout(id);
  }, [showWelcomeBubble]);

  return (
    <>
      {/* Wrapper FIXO sempre no canto inferior direito */}
      <div
        className="
          fixed z-50
          flex flex-col items-end   /* <- força alinhamento do conteúdo à direita */
          gap-2
        "
        style={{
          right: "16px",
          bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Balãozinho de convite (fica alinhado à direita do wrapper) */}
        {bubbleVisible && (
          <div
            className="max-w-[240px] rounded-lg border border-white/20 bg-white/90 px-3 py-2 text-sm shadow-md
                       dark:bg-zinc-800/90 dark:border-zinc-700/60"
            style={{ textAlign: "left" }}  /* conteúdo do balão alinhado interno à esquerda */
          >
            <div className="flex items-start gap-2">
              <Bot className="h-4 w-4 text-primary mt-0.5" />
              <span>
                {userName ? `Oi, ${userName.split(" ")[0]}! ` : "Oi! "}
                Posso ajudar?
              </span>
            </div>
          </div>
        )}

        {/* Botão flutuante */}
        <Button
          onClick={() => setOpen(true)}
          className="
            rounded-full h-12 w-12 p-0 shadow-lg
            bg-primary hover:bg-primary/90 text-primary-foreground
            dark:bg-primary dark:hover:bg-primary/90
          "
          aria-label="Abrir chat de ajuda"
          title="Abrir chat de ajuda"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* Janela de chat */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="
            p-0 gap-0 w-[92vw] max-w-[420px]
            [&>button]:hidden
          "
          style={{ height }}
        >
          <DialogHeader className="px-3 py-2 border-b border-border/40 bg-muted/30">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-semibold">
                Atendimento • Chat
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Fechar chat"
                title="Fechar chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Área do chat (iframe) — compensando a altura do header (≈ 42px) */}
          <div className="w-full" style={{ height: height - 42 }}>
            <iframe
              src={iframeSrc}
              title="Chat de atendimento"
              className="w-full h-full border-0"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
