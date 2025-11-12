import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "./providers/auth";
import Footer from "./_components/footer";
import ToasterClient from "./_components/ToasterClient"; // Import normal, sem dynamic
import OneSignalClient from "./_components/OneSignalClient";

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
      <head>
        <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer dangerouslySetInnerHTML={{
          __html: `
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function(OneSignal) {
          await OneSignal.init({
            appId: "8e1a7c53-84a0-442f-963d-3bd980a77e1b",
            safari_web_id: "web.onesignal.auto.25811132-3882-4d1b-a1e7-3632ed052841",
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: true },
            serviceWorkerPath: '/OneSignalSDKWorker.js',
            serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.js',
            serviceWorkerParam: { scope: '/' }
          });
        });
      `,
        }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
        <ToasterClient /> {/* Client Component */}
        <OneSignalClient />
      </body>
    </html>
  );
}
