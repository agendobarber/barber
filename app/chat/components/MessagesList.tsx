// app/chat/components/MessagesList.tsx
"use client";

type Message = { id: number; sender: "bot" | "user"; text: string };

export function MessagesList({
  messages,
  bottomRef,
  children, // já adicionado antes
}: {
  messages: Message[];
  bottomRef: React.RefObject<HTMLDivElement | null>; // <-- aceita null
  children?: React.ReactNode;
}) {
  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-4 pb-32"
      data-chat-scroll // ✅ permite achar o container scrollável
      style={{ overflowAnchor: "none" }} // ✅ desliga o scroll anchoring do navegador
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[75%] p-3 rounded-2xl text-sm shadow whitespace-pre-line ${
              msg.sender === "user"
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-white text-gray-800 rounded-bl-none"
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}

      {children}

      <div ref={bottomRef} />
    </div>
  );
}