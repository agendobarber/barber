import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "./providers/auth";
import Footer from "./_components/footer";
import ToasterClient from "./_components/ToasterClient"; // Import normal, sem dynamic

// Fontes
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadados PWA
export const metadata: Metadata = {
  title: "Jc Barber App",
  description: "Agendamento fácil para barbeiros e salões",
  manifest: "/manifest.json",
  icons: {
    icon: "/logoOficial.png",
    apple: "/logoOficial.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d6efd",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
        <ToasterClient /> {/* Client Component */}
      </body>
    </html>
  );
}
