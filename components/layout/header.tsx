import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/logout/actions";

export async function Header() {
  const session = await getSession();
  const initials = session?.name
    ? session.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6">
      <div className="text-lg font-semibold">ERP System</div>

      <div className="flex items-center gap-3">
        {session && (
          <span className="text-sm text-muted-foreground hidden sm:block">
            {session.name}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            {session && (
              <>
                <div className="px-3 py-2 text-sm">
                  <p className="font-medium">{session.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.email}
                  </p>
                </div>
                <div className="border-t my-1" />
              </>
            )}
            <DropdownMenuItem asChild>
              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full justify-start px-2 text-destructive hover:text-destructive"
                >
                  Keluar
                </Button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
