"use client";

import {
  CalendarIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LogInIcon,
  LogOutIcon,
  ScissorsIcon,
  StoreIcon,
  Loader2,
  UsersIcon,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Avatar, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { signOut, useSession } from "next-auth/react";
import SignInDialog from "./sign-in-dialog";
import { usePathname } from "next/navigation";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const SidebarSheet = () => {
  const { data } = useSession();

  const role = (data?.user as any)?.role;
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/" });
  };

  const userMenu: MenuItem[] = [
    { label: "Inicio", href: "/", icon: <HomeIcon size={18} /> },
    { label: "Agendamentos", href: "/bookingsuser", icon: <CalendarIcon size={18} /> },
  ];

  const adminMenu: MenuItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboardIcon size={18} /> },
    { label: "Perfil", href: "/store", icon: <StoreIcon size={18} /> },
    { label: "Serviços", href: "/services", icon: <ScissorsIcon size={18} /> },
    { label: "Profissionais", href: "/professionals", icon: <UsersIcon size={18} /> },
    //{ label: "Relatórios", href: "/reports", icon: <BarChart3 size={18} /> },
  ];

  const isActive = (href: string) => pathname === href;

  const renderMenu = (menu: MenuItem[]) =>
    menu.map((item) => (
      <Button
        key={item.href}
        variant={isActive(item.href) ? "secondary" : "ghost"}
        className="justify-start gap-2"
        asChild
      >
        <Link href={item.href}>
          {item.icon}
          {item.label}
        </Link>
      </Button>
    ));

  return (
    <SheetContent className="overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Menu</SheetTitle>
      </SheetHeader>

      <div className="flex items-center justify-between border-b border-solid p-5 gap-3">
        {data?.user ? (
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={data?.user?.image ?? ""} height={18} width={18} />
            </Avatar>
            <div>
              <p className="font-bold">{data?.user?.name}</p>
              <p className="text-xs">{data?.user?.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col w-full gap-4">
            <div className="flex items-center justify-between w-full">
              <h2 className="font-bold">Olá, faça seu login como cliente</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon">
                    <LogInIcon />
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[90%]">
                  <SignInDialog role="user" />
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center justify-between w-full">
              <h2 className="font-bold">Olá, faça seu login como admin</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon">
                    <LogInIcon />
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[90%]">
                  <SignInDialog role="admin" />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </div>

      {/* Menu do usuário */}
      {data?.user && role === "user" && (
        <div className="flex flex-col gap-2 p-5 border-b border-solid">{renderMenu(userMenu)}</div>
      )}

      {/* Menu do admin */}
      {data?.user && role === "admin" && (
        <div className="flex flex-col gap-2 p-5 border-b border-solid">{renderMenu(adminMenu)}</div>
      )}

      {/* Logout */}
      {data?.user && (
        <div className="flex flex-col gap-1 p-5">
          <Button
            variant="ghost"
            className="justify-start gap-2"
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <LogOutIcon size={18} />}
            {isLoggingOut ? "Saindo..." : "Sair da conta"}
          </Button>
        </div>
      )}
    </SheetContent>
  );
};

export default SidebarSheet;
