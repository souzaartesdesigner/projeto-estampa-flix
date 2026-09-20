import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Search, ShieldCheck, ShoppingCart, User } from "lucide-react";
import { UserMenuContent, UserNav } from "@/components/user-nav";
import logoAsset from "@/assets/estampa-flix-logo.png.asset.json";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { useI18n } from "@/lib/i18n";
import { LangSwitcher } from "./lang-switcher";

import { PromoBanner } from "./promo-banner";
import { VisualSearchDialog } from "./visual-search-dialog";
import { useSiteSettings } from "@/hooks/use-site-settings";


export function SiteHeader() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const NAV = [
    { to: "/", label: t("nav.home") },
    { to: "/catalogo", label: t("nav.catalog"), search: { page: 1 } },
    { to: "/planos", label: t("nav.plans") },
    
    { to: "/blog", label: t("nav.blog") },

    { to: "/suporte", label: t("nav.support") },
  ];
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [q, setQ] = useState("");

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const cart = useCart();
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).then(({ data }) => {
          setIsAdmin(!!data?.some((r) => r.role === "admin"));
        });
      } else {
        setIsAdmin(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        supabase.from("user_roles").select("role").eq("user_id", data.session.user.id).then(({ data }) => {
          setIsAdmin(!!data?.some((r) => r.role === "admin"));
        });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/catalogo", search: { q: q || undefined, page: 1 } as any });
  }

  const [isOpen, setIsOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <PromoBanner />
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-display text-base font-bold tracking-tight sm:gap-2.5 sm:text-lg">
          <img
            src={settings?.logo_url || logoAsset.url}
            alt={settings?.site_name ?? "Estampa Flix"}
            className="h-[33px] w-[114px] object-contain sm:h-[37px] sm:w-[128px]"
          />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                search={item.search}
                className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={submitSearch} className="hidden flex-1 items-center md:flex">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search.placeholder")}
              aria-label={t("search.placeholder")}
              className="w-full rounded-full border border-border/60 bg-surface/50 py-2.5 pl-10 pr-12 text-sm outline-none ring-0 transition-all placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-surface focus:ring-2 focus:ring-primary/20"
            />
            <VisualSearchDialog />
          </div>
        </form>


        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <Button asChild variant="ghost" size="icon" className="md:hidden" aria-label={t("search.placeholder")}>
            <Link to="/catalogo" search={{ page: 1 }}><Search className="h-5 w-5" /></Link>
          </Button>
          <div className="md:hidden">
            <VisualSearchDialog variant="inline" />
          </div>
          <LangSwitcher />
          
          {user && (
            <Button asChild variant="ghost" size="icon" className="relative" aria-label={t("nav.cart")}>
              <Link to="/carrinho">
                <ShoppingCart className="h-5 w-5" />
                {cart.count > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {cart.count}
                  </span>
                )}
              </Link>
            </Button>
          )}
          {user ? (
            <UserNav user={user as any} isAdmin={isAdmin} />
          ) : (

            <div className="flex items-center gap-1 sm:gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/login">{t("nav.signIn")}</Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="inline-flex sm:hidden border-border/40 bg-surface/50 hover:bg-surface hover:text-primary">
                <Link to="/login">{t("nav.signIn")}</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
                <Link to="/planos">{t("nav.subscribe")}</Link>
              </Button>
            </div>
          )}


          {/* O menu mobile (Sheet) foi removido conforme solicitação para evitar bugs de scroll lateral */}

        </div>
      </div>
    </header>
  );
}
