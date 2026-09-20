import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { LayoutDashboard, Palette, Tag, FolderOpen, Users, ShoppingBag, FileText, MessageCircle, CreditCard, Upload, TicketPercent, BarChart3, Settings, Home, Image as ImageIcon, Mail, Star, Search } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const user = (context as any).user;
    if (!user) throw redirect({ to: "/login" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    if (!data || data.length === 0) throw redirect({ to: "/minha-conta", search: { tab: "profile" } });
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/home", label: "Home", icon: Home },
  { to: "/admin/banners", label: "Banners", icon: ImageIcon },

  { to: "/admin/artes", label: "Artes", icon: Palette },
  { to: "/admin/importar", label: "Importar CSV", icon: Upload },
  { to: "/admin/categorias", label: "Categorias", icon: FolderOpen },
  { to: "/admin/tags", label: "Tags", icon: Tag },
  { to: "/admin/cupons", label: "Cupons", icon: TicketPercent },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/vendas", label: "Vendas", icon: ShoppingBag },
  { to: "/admin/planos", label: "Planos", icon: CreditCard },
  { to: "/admin/blog", label: "Blog", icon: FileText },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { to: "/admin/suporte", label: "Suporte", icon: MessageCircle },
  { to: "/admin/emails", label: "E-mails", icon: Mail },
  { to: "/admin/conteudos", label: "Conteúdos", icon: FileText },
  { to: "/admin/seo-check", label: "SEO Check", icon: Search },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6 lg:flex-row lg:gap-6 lg:py-8">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="rounded-xl border border-border/60 bg-card p-2 lg:sticky lg:top-24">
            <div className="hidden px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:block">Painel Admin</div>
            <nav className="flex gap-1 overflow-x-auto lg:mt-1 lg:flex-col lg:gap-0.5 lg:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to} className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors lg:shrink ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                    <Icon className="h-4 w-4" /> {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>
    </div>
  );
}
