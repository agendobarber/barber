
// app/chat/components/Header.tsx
"use client";

import Image from "next/image";

export default function Header() {
    return (
        <div className="flex items-center gap-3 p-4 bg-white shadow">
            <Image
                src="/srcorte.png"
                alt="Chatbot"
                width={60}
                height={60}
                className="rounded-full object-cover"
            />
            <div>
                <h1 className="text-lg font-semibold text-gray-900">Sr. Corte</h1>
                <p className="text-xs text-green-600">Online agora</p>
            </div>
        </div>
    );
}
