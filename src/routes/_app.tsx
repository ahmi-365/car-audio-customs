import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { auth } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { LogOut, FileText, Plus } from "lucide-react";
import logo from "@/assets/hr-logo.png";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!auth.getToken()) throw redirect({ to: "/login" });
  },
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const user = auth.getUser();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <Link to="/invoices" className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <img src={logo} alt="HR" className="h-8 sm:h-10 w-auto flex-shrink-0" />
            <div className="hidden xs:block truncate">
              <div className="font-bold text-xs sm:text-sm leading-tight truncate">HR Car Audio & Tints</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Invoice Manager</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link to="/invoices">
              <Button variant={path === "/invoices" ? "default" : "ghost"} size="sm" className="px-2 sm:px-3">
                <FileText className="h-4 w-4 sm:mr-1" /> 
                <span className="hidden sm:inline">Invoices</span>
              </Button>
            </Link>
            <Link to="/invoices/new">
              <Button variant={path.endsWith("/new") ? "default" : "outline"} size="sm" className="px-2 sm:px-3">
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">New</span>
              </Button>
            </Link>
            <div className="hidden lg:flex items-center gap-2 ml-2 pl-3 border-l">
              <span className="text-sm text-muted-foreground truncate max-w-[120px]">{user?.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={() => {
                auth.clear();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 print:p-0 print:max-w-none">
        <Outlet />
      </main>
    </div>
  );
}
