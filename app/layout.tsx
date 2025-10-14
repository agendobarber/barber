import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AuthProvider from "./providers/auth";
import Footer from "./_components/footer";

// Fontes
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ Metadados PWA (sem themeColor aqui)
export const metadata: Metadata = {
  title: "Calendo",
  description: "Agendamento fácil para barbeiros e salões",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

// ✅ Novo export exigido pelo Next.js 14+
export const viewport: Viewport = {
  themeColor: "#0d6efd",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        {/* 🔗 Links e metatags PWA */}
        <meta name="theme-color" content="#0d6efd" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {/* flex-col + min-h-screen garante o footer no fim */}
          <div className="flex min-h-screen flex-col">
            {/* conteúdo cresce e empurra o footer */}
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
