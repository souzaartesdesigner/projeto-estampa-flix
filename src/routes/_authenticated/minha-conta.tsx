import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { formatBRL, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createBillingPortalSession } from "@/lib/stripe.functions";
import { toast } from "sonner";
import { Download, CreditCard, Package, Sparkles, Loader2, User as UserIcon, Camera, KeyRound } from "lucide-react";
import { ArtworkCard } from "@/components/artwork-card";
import { useI18n, tField } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";

const TABS = ["downloads", "favorites", "subscription", "orders", "profile"] as const;

export const Route = createFileRoute("/_authenticated/minha-conta")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: TABS.includes(search.tab as any) ? (search.tab as (typeof TABS)[number]) : undefined,
  }),
  head: () => ({ meta: [{ title: "Minha conta — Estampa Flix" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext() as { user: any };
  const { tab } = Route.useSearch();
  const portalFn = useServerFn(createBillingPortalSession);
  const [portalLoading, setPortalLoading] = useState(false);
  const { t, lang } = useI18n();


  async function openPortal() {
    setPortalLoading(true);
    try {
      const { url } = await portalFn();
      if (url) window.location.href = url;
    } catch (err: any) {
      toast.error(err?.message ?? t("account.errPortal"));
      setPortalLoading(false);
    }
  }

  const { data: sub } = useQuery({
    queryKey: ["my-subscription", user.id],
    queryFn: async () => (await supabase.from("subscriptions").select("*, plans(*)").eq("user_id", user.id).eq("status", "active").maybeSingle()).data,
  });

  const { data: downloads = [] } = useQuery({
    queryKey: ["my-downloads", user.id],
    queryFn: async () => (await supabase.from("downloads").select("*, artworks(id,slug,title,preview_url,translations)").eq("user_id", user.id).order("last_downloaded_at", { ascending: false })).data ?? [],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => (await supabase.from("orders").select("*, artworks(title,slug,translations)").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user.id],
    queryFn: async () => (await supabase.from("favorites").select("artwork_id, artworks(id,slug,title,preview_url,price_cents,is_featured,is_trending,download_count,translations,categories!artworks_category_id_fkey(id,name,slug,translations),artwork_categories(categories(id,name,slug,translations)))").order("created_at", { ascending: false })).data ?? [],
  });

  function translateOrderStatus(s: string) {
    const map: Record<string, string> = {
      paid: t("account.status.paid"),
      pending: t("account.status.pending"),
      failed: t("account.status.failed"),
      refunded: t("account.status.refunded"),
      canceled: t("account.status.canceled"),
      cancelled: t("account.status.canceled"),
      processing: t("account.status.processing"),
    };
    return map[s] ?? s;
  }

  async function redownload(art: { id: string; title: string }) {
    try {
      // Nem o link externo nem o caminho do arquivo são expostos na tabela pública:
      // só a RPC valida a posse e os devolve.
      const { data, error } = await supabase.rpc("consume_download", { _artwork_id: art.id });
      if (error) throw error;
      const row: any = Array.isArray(data) ? data[0] : data;
      if (row?.external_url) {
        window.open(row.external_url as string, "_blank", "noopener,noreferrer");
        return;
      }
      const path = row?.file_path;
      if (!path) {
        toast.error(t("account.errFileUnavailable"));
        return;
      }
      const { data: signed, error: sErr } = await supabase.storage
        .from("artwork-files")
        .createSignedUrl(path, 60, { download: art.title });
      if (sErr || !signed?.signedUrl) throw sErr ?? new Error("Falha ao gerar link");
      const a = document.createElement("a");
      a.href = signed.signedUrl;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      toast.error(e?.message ?? t("account.errDownload"));
    }
  }


  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 sm:py-10">
        <header className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("account.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground break-words">{t("account.greeting")} {user.email}</p>
        </header>

        <div className="mb-6 grid gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
          <StatCard icon={<CreditCard className="h-5 w-5" />} label={t("account.currentPlan")} value={sub?.plans?.name ?? t("account.none")} />
          <StatCard icon={<Sparkles className="h-5 w-5" />} label={t("account.creditsRemaining")} value={sub ? String(sub.credits_remaining) : "0"} accent />
          <StatCard icon={<Download className="h-5 w-5" />} label={t("account.downloadedCount")} value={String(downloads.length)} />
        </div>

          <Tabs defaultValue={tab ?? "downloads"} key={tab ?? "downloads"} className="w-full">
            <TabsList className="flex w-full overflow-x-auto min-h-[44px] px-2 py-1 gap-1 justify-start [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="downloads" className="shrink-0">{t("account.tabDownloads")}</TabsTrigger>
            <TabsTrigger value="favorites" className="shrink-0">{t("account.tabFavorites")}</TabsTrigger>
            <TabsTrigger value="subscription" className="shrink-0">{t("account.tabSubscription")}</TabsTrigger>
            <TabsTrigger value="orders" className="shrink-0">{t("account.tabOrders")}</TabsTrigger>
            <TabsTrigger value="profile" className="shrink-0">Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="downloads" className="mt-6">
            {downloads.length === 0 ? (
              <Empty msg={t("account.emptyDownloads")} cta={{ label: t("account.exploreCatalog"), to: "/catalogo" }} />
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {downloads.map((d: any) => {
                  const title = tField(d.artworks as any, "title", lang) || d.artworks.title;
                  return (
                    <div key={d.id} className="overflow-hidden rounded-xl border border-border/60 bg-card">
                      <Link to="/artes/$slug" params={{ slug: d.artworks.slug }} className="block aspect-square overflow-hidden bg-surface-2">
                        <img src={d.artworks.preview_url} alt={title} className="h-full w-full object-cover" />
                      </Link>
                      <div className="p-3">
                        <h3 className="line-clamp-1 text-sm font-medium">{title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{t("account.downloadedOn")} {formatDate(d.last_downloaded_at)}</p>
                        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => redownload({ ...d.artworks, title })}>
                          <Download className="mr-1 h-3 w-3" /> {t("account.redownload")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            {favorites.length === 0 ? (
              <Empty msg={t("account.emptyFavorites")} cta={{ label: t("account.exploreCatalog"), to: "/catalogo" }} />
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {favorites.map((f: any) => f.artworks && <ArtworkCard key={f.artwork_id} artwork={f.artworks} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscription" className="mt-6">
            {sub ? (
              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge className="mb-2 bg-gradient-brand text-brand-foreground border-0">{sub.plans.name}</Badge>
                    <p className="text-2xl font-bold">{formatBRL(sub.plans.price_cents)}<span className="text-sm font-normal text-muted-foreground">{t("plans.perMonth")}</span></p>
                    <p className="mt-1 text-sm text-muted-foreground">{t("account.renewsOn")} {formatDate(sub.current_period_end)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t("account.creditsRemaining")}</p>
                    <p className="text-3xl font-black text-primary">{sub.credits_remaining}<span className="text-sm text-muted-foreground">/{sub.plans.monthly_credits}</span></p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button onClick={openPortal} disabled={portalLoading} className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
                    {portalLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("account.opening")}</> : t("account.managePlan")}
                  </Button>
                  <Button asChild variant="outline"><Link to="/planos">{t("account.switchPlan")}</Link></Button>
                </div>
              </div>
            ) : (
              <Empty msg={t("account.emptySub")} cta={{ label: t("account.seePlans"), to: "/planos" }} />
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            {orders.length === 0 ? (
              <Empty msg={t("account.emptyOrders")} cta={{ label: t("account.exploreCatalog"), to: "/catalogo" }} />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
                    <tr><th className="px-4 py-3 text-left">{t("account.thArt")}</th><th className="px-4 py-3 text-left">{t("account.thDate")}</th><th className="px-4 py-3 text-left">{t("account.thValue")}</th><th className="px-4 py-3 text-left">{t("account.thStatus")}</th></tr>
                  </thead>
                  <tbody>
                    {orders.map((o: any) => {
                      const itemCount = Array.isArray(o.items) ? o.items.length : (o.artworks ? 1 : 0);
                      const title = o.artworks ? (tField(o.artworks, "title", lang) || o.artworks.title) : null;
                      const label = title
                        ? title
                        : itemCount > 0
                          ? `${itemCount} ${itemCount === 1 ? t("account.oneArt") : t("account.manyArt")}`
                          : t("account.orderLabel");
                      return (
                        <tr key={o.id} className="border-t border-border/40">
                          <td className="px-4 py-3">
                            {o.artworks ? (
                              <Link to="/artes/$slug" params={{ slug: o.artworks.slug }} className="hover:text-primary">{label}</Link>
                            ) : (
                              <span>{label}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(o.created_at)}</td>
                          <td className="px-4 py-3">{formatBRL(o.amount_cents)}</td>
                          <td className="px-4 py-3"><Badge variant={o.status === "paid" ? "default" : "secondary"}>{translateOrderStatus(o.status)}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
          <TabsContent value="profile" className="mt-6">
            <ProfilePanel userId={user.id} email={user.email} />
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}

function ProfilePanel({ userId, email }: { userId: string; email: string }) {
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () =>
      (await supabase.from("profiles").select("full_name, phone, avatar_url").eq("id", userId).maybeSingle()).data,
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() || null, phone: phone.trim() || null, avatar_url: avatarUrl })
      .eq("id", userId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Informações atualizadas!");
    qc.invalidateQueries({ queryKey: ["profile", userId] });
  }

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Selecione uma imagem");
    if (file.size > 3 * 1024 * 1024) return toast.error("Imagem muito grande (máx 3MB)");
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `avatars/${userId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("artwork-previews").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("artwork-previews").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
    toast.success("Foto enviada — clique em Salvar para confirmar");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Senha deve ter pelo menos 6 caracteres");
    if (newPassword !== confirmPassword) return toast.error("As senhas não coincidem");
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) return toast.error(error.message);
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Senha alterada com sucesso!");
  }

  if (isLoading) return <div className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">Carregando...</div>;

  const initials = (fullName || email || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={saveProfile} className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold">Minhas informações</h2>
        </div>

        <div className="mb-5 flex items-center gap-4">
          <div className="relative">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border border-border/60 bg-surface-2">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-xl font-bold text-muted-foreground">{initials}</span>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-brand hover:opacity-90">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
                disabled={uploading}
              />
            </label>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>Foto de perfil</p>
            <p>JPG ou PNG até 3MB</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor="email-ro">E-mail</Label>
            <Input id="email-ro" value={email} disabled readOnly />
            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado por aqui.</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fullname">Nome completo</Label>
            <Input id="fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">Telefone / WhatsApp</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 91234-5678" />
          </div>
        </div>

        <Button type="submit" disabled={saving} className="mt-5 w-full bg-gradient-brand text-brand-foreground shadow-brand">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar alterações"}
        </Button>
      </form>

      <form onSubmit={changePassword} className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold">Alterar senha</h2>
        </div>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor="np">Nova senha</Label>
            <Input id="np" type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cp">Confirmar nova senha</Label>
            <Input id="cp" type="password" minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" />
          </div>
          <PasswordStrength password={newPassword} />
        </div>
        <Button type="submit" disabled={changingPw || !newPassword} className="mt-5 w-full" variant="outline">
          {changingPw ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Alterando...</> : "Alterar senha"}
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Esqueceu sua senha atual? <Link to="/esqueci-a-senha" className="text-primary hover:underline">Use "Esqueci minha senha"</Link> na tela de login.
        </p>
      </form>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "Pelo menos 6 caracteres", ok: password.length >= 6 },
    { label: "Uma letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Um número", ok: /[0-9]/.test(password) },
    { label: "Um símbolo (!@#...)", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const label = score <= 1 ? "Fraca" : score === 2 ? "Razoável" : score === 3 ? "Boa" : "Forte";
  const color = score <= 1 ? "bg-destructive" : score === 2 ? "bg-yellow-500" : score === 3 ? "bg-primary" : "bg-green-500";
  if (!password) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-surface-2 p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Força da senha</span>
        <span className="font-medium">{label}</span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-border">
        <div className={`h-full transition-all ${color}`} style={{ width: `${(score / 4) * 100}%` }} />
      </div>
      <ul className="space-y-1 text-xs">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? "text-green-500" : "text-muted-foreground"}>
            {c.ok ? "✓" : "○"} {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "border-primary/40 bg-card shadow-brand" : "border-border/60 bg-card"}`}>
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">{icon} <span className="text-xs uppercase tracking-wide">{label}</span></div>
      <p className="font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Empty({ msg, cta }: { msg: string; cta: { label: string; to: string } }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
      <Package className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-3 text-muted-foreground">{msg}</p>
      <Button asChild className="mt-4"><Link to={cta.to}>{cta.label}</Link></Button>
    </div>
  );
}
