"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import {
  Button,
  SheetTrigger,
  SheetContent,
  Sheet,
  ScrollArea,
  Separator,
} from "@/components/ui/";

import { cn } from "@/lib/utils";

const menu = [
  { label: "Dashboard", href: "/" },
  { label: "Product", href: "/master/product" },
  { label: "Customer", href: "/master/customer" },
  { label: "Supplier", href: "/master/supplier" },
  { label: "Inventory", href: "/inventory/stock" },
  { label: "Sales", href: "/sales" },
  { label: "Purchase", href: "/purchase" },
  { label: "Settings", href: "/settings" },
];

function SidebarContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="h-16 flex items-center px-6 font-semibold text-lg">
        ERP UMKM
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}

export function Sidebar() {
  return (
    <>
      <aside className="hidden md:flex w-64 border-r bg-background">
        <SidebarContent />
      </aside>

      <div className="md:hidden p-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
