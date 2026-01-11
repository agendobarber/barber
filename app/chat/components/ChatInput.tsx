
// app/chat/components/ChatInput.tsx
"use client";

import { Button } from "../../_components/ui/button";

export function ChatInput({
  input,
  setInput,
  sendMessage,
}: {
  input: string;
  setInput: (v: string) => void;
  sendMessage: () => void;
}) {
  return (
    <div className="p-4 bg-white border-t flex gap-2">
      <input
        className="flex-1 border rounded-xl p-3 text-base bg-gray-50 font-semibold text-gray-700"
        style={{ fontSize: "16px" }}
        placeholder="Digite sua mensagem..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
      <Button onClick={sendMessage}>Enviar</Button>
    </div>
  );
}