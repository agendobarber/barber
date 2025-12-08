import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "./providers/auth";
import ToasterClient from "./_components/ToasterClient";
import OneSignalClient from "./_components/OneSignalClient";
import FooterWrapper from "./FooterWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jc Barber App",
  description: "Agendamento fácil para barbeiros e salões",
  manifest: "/manifest.json",
  icons: {
    icon: "/logoOficial.png",
    apple: "/logoOficial.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#0d6efd"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="pt-BR" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <OneSignalClient />
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
            <FooterWrapper />
          </div>
        </AuthProvider>
        <ToasterClient />
      </body>
    </html>
  );
}