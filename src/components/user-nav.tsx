import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditCard, Download, Heart, LogOut, MessageCircle, Settings, ShieldCheck, User } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useUserSubscription } from "@/hooks/use-user-subscription";


type Props = { user: { id: string; email?: string | null; user_metadata?: any }; isAdmin?: boolean };

export function ItemIcon({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60 ${className}`}>{children}</span>
  );
}

export function UserMenuContent({ user, isAdmin, isMobile = false, closeMobileMenu }: Props & { isMobile?: boolean; closeMobileMenu?: () => void }) {
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

  const { data: profile } = useQuery({
    queryKey: ["nav-profile", user.id],
    queryFn: async () =>
      (await supabase.from("profiles").select("full_name, avatar_url, email").eq("id", user.id).maybeSingle()).data,
  });

  const { data: sub } = useUserSubscription(user.id);


  const { data: todayCount = 0 } = useQuery({
    queryKey: ["nav-free-downloads", user.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("free_downloads_today");
      return (data as number) ?? 0;
    },
  });

  const name =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (user.email ? user.email.split("@")[0] : "Minha conta");
  const email = profile?.email ?? user.email ?? "";
  const avatar = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null;
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p: string) => p[0])
    .join("")
    .toUpperCase();

  const downloadsBadge = sub ? `${sub.credits_remaining} créditos` : `${todayCount} / 5 hoje`;

  const whatsappRaw = settings?.whatsapp ?? "";
  const whatsappHref = whatsappRaw
    ? `https://wa.me/${whatsappRaw.replace(/\D/g, "")}`
    : null;

  async function signOut() {
    await supabase.auth.signOut();
    if (closeMobileMenu) closeMobileMenu();
    navigate({ to: "/" });
  }

  const handleLinkClick = () => {
    if (closeMobileMenu) closeMobileMenu();
  };

  const content = (
    <>
      <div className={`flex items-center gap-3 px-2 py-2.5 ${isMobile ? "mb-2" : ""}`}>
        {avatar ? (
          <img src={avatar} alt={name} className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-brand text-sm font-bold text-brand-foreground">
            {initials || "U"}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>

      {!isMobile && <DropdownMenuSeparator />}

      <div className={`flex flex-col gap-1 ${isMobile ? "mt-2" : ""}`}>
        <Link 
          to="/minha-conta" 
          search={{ tab: 'downloads' } as any}
          onClick={handleLinkClick}
          className={`flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted ${isMobile ? "text-foreground" : "text-sm"}`}
        >
          <ItemIcon><Settings className="h-4 w-4" /></ItemIcon>
          <span>Minha conta</span>
        </Link>

        <Link 
          to="/minha-conta" 
          search={{ tab: 'subscription' } as any}
          onClick={handleLinkClick}
          className={`flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted ${isMobile ? "text-foreground" : "text-sm"}`}
        >
          <ItemIcon><CreditCard className="h-4 w-4" /></ItemIcon>
          <span>Cobrança</span>
        </Link>

        <Link 
          to="/minha-conta" 
          search={{ tab: 'downloads' } as any}
          onClick={handleLinkClick}
          className={`flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted ${isMobile ? "text-foreground" : "text-sm"}`}
        >
          <ItemIcon><Download className="h-4 w-4" /></ItemIcon>
          <span>Downloads</span>
          <span className="ml-auto rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {downloadsBadge}
          </span>
        </Link>

        <Link 
          to="/minha-conta" 
          search={{ tab: 'favorites' } as any}
          onClick={handleLinkClick}
          className={`flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted ${isMobile ? "text-foreground" : "text-sm"}`}
        >
          <ItemIcon><Heart className="h-4 w-4" /></ItemIcon>
          <span>Favoritos</span>
        </Link>

        {isAdmin && (
          <Link 
            to="/admin" 
            onClick={handleLinkClick}
            className={`flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted ${isMobile ? "text-foreground" : "text-sm"}`}
          >
            <ItemIcon><ShieldCheck className="h-4 w-4" /></ItemIcon>
            <span>Admin</span>
          </Link>
        )}

        {isMobile && <div className="my-2 h-px bg-border/40" />}
        {!isMobile && <DropdownMenuSeparator />}

        {whatsappHref && (
          <a 
            href={whatsappHref} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className={`flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted ${isMobile ? "text-foreground" : "text-sm"}`}
          >
            <ItemIcon className="bg-green-500/10"><MessageCircle className="h-4 w-4 text-green-500" /></ItemIcon>
            <span>Suporte WhatsApp</span>
          </a>
        )}

        <button
          onClick={signOut}
          className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-destructive/10 text-destructive ${isMobile ? "" : "text-sm"}`}
        >
          <ItemIcon className="bg-destructive/10"><LogOut className="h-4 w-4 text-destructive" /></ItemIcon>
          <span>Sair</span>
        </button>
      </div>
    </>
  );

  return content;
}

export function UserNav({ user, isAdmin }: Props) {
  const name = user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split("@")[0] : "Minha conta");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden max-w-[120px] truncate sm:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[280px] rounded-2xl border-border/60 p-2 shadow-2xl">
        <UserMenuContent user={user} isAdmin={isAdmin} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}