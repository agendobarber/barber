"use client";

import Image from "next/image";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { MenuIcon } from "lucide-react";
import { Sheet, SheetTrigger } from "./ui/sheet";
import SidebarSheet from "./sidebar-sheets";
import Link from "next/link";
import { useSession } from "next-auth/react";

const Header = () => {
  const { data } = useSession();

  // 👇 Pega a role do usuário logado
  const role = (data?.user as any)?.role;

  // 👇 Define o link do logo conforme a role
  const homeLink = role === "admin" ? "/dashboard" : "/";

  return (
    <Card>
      <CardContent className="p-3 py-1 flex flex-row items-center justify-between">
        {/* 👇 O logo agora leva o usuário para / ou /dashboard */}
        <Link href={homeLink}>
          <Image
            alt="Jc Barber App"
            src="/logoOficial.png"
            height={17}
            width={120}
            className="cursor-pointer"
            // ou use o estilo abaixo se quiser controle mais fino:
            // style={{ filter: "invert(1) brightness(1.5)" }}
          />
        </Link>

        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SidebarSheet />
        </Sheet>
      </CardContent>
    </Card>
  );
};

export default Header;
