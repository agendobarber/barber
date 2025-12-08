"use client";

import { usePathname } from "next/navigation";
import Footer from "./_components/footer";

export default function FooterWrapper() {
  const pathname = usePathname();

  // esconda na rota /chat
  if (pathname === "/chat") return null;

  return <Footer />;
}
