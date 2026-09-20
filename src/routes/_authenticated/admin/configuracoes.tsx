import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Upload as UploadIcon, Palette, Phone, Search as SearchIcon, FileText, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({ component: Configuracoes });

function Configuracoes() {
  const { data: settings, isLoading } = useSiteSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({});
  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [ogUploading, setOgUploading] = useState(false);
  const [homeOgUploading, setHomeOgUploading] = useState(false);

  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      // Usamos upsert para garantir que a linha única exista ou seja atualizada
      const { error } = await (supabase as any).from("site_settings").upsert({ ...form, id: true });
      if (error) throw error;
      // A invalidação via queryClient no onSuccess já cuida do recarregamento
    },
    onSuccess: () => { toast.success("Configurações salvas"); qc.invalidateQueries({ queryKey: ["site-settings"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const FIELD_BY_KIND = { logo: "logo_url", favicon: "favicon_url", og: "og_image_url", home_og: "home_og_image_url" } as const;

  async function upload(file: File, kind: "logo" | "favicon" | "og" | "home_og") {
    const setter = kind === "logo" ? setLogoUploading : kind === "favicon" ? setFaviconUploading : kind === "og" ? setOgUploading : setHomeOgUploading;
    setter(true);
    try {
      const path = `settings/${kind}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("artwork-previews").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("artwork-previews").getPublicUrl(path);
      setForm((f: any) => ({ ...f, [FIELD_BY_KIND[kind]]: data.publicUrl }));
      toast.success("Imagem carregada");
    } catch (e: any) { toast.error(e.message); } finally { setter(false); }
  }


  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target?.value ?? e }));

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Configurações da loja</h1>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-gradient-brand text-brand-foreground">
          <Save className="mr-2 h-4 w-4" /> Salvar alterações
        </Button>
      </div>

      <Tabs defaultValue="identity">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="identity"><Palette className="mr-1 h-4 w-4" />Identidade</TabsTrigger>
          <TabsTrigger value="contact"><Phone className="mr-1 h-4 w-4" />Contato</TabsTrigger>
          <TabsTrigger value="seo"><SearchIcon className="mr-1 h-4 w-4" />SEO / Analytics</TabsTrigger>
          <TabsTrigger value="footer"><FileText className="mr-1 h-4 w-4" />Rodapé & Legal</TabsTrigger>
          <TabsTrigger value="promo">Banner topo</TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="space-y-4">
          <Section title="Identidade visual">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome da loja"><Input value={form.site_name ?? ""} onChange={set("site_name")} /></Field>
              <Field label="Tagline"><Input value={form.tagline ?? ""} onChange={set("tagline")} /></Field>
              <Field label="Cor primária">
                <div className="flex gap-2">
                  <Input value={form.primary_color ?? ""} onChange={set("primary_color")} placeholder="#007bff" />
                  <input type="color" value={form.primary_color ?? "#007bff"} onChange={(e) => setForm((f: any) => ({ ...f, primary_color: e.target.value }))} className="h-10 w-14 rounded border border-border/60 bg-transparent" />
                </div>
              </Field>
              <div />
              <ImageField label="Logo" url={form.logo_url} onFile={(f: File) => upload(f, "logo")} uploading={logoUploading} onClear={() => setForm((s: any) => ({ ...s, logo_url: null }))} />
              <ImageField label="Favicon" url={form.favicon_url} onFile={(f: File) => upload(f, "favicon")} uploading={faviconUploading} onClear={() => setForm((s: any) => ({ ...s, favicon_url: null }))} />
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Section title="Contato & redes sociais">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail de suporte"><Input type="email" value={form.support_email ?? ""} onChange={set("support_email")} placeholder="suporte@exemplo.com" /></Field>
              <Field label="WhatsApp"><Input value={form.whatsapp ?? ""} onChange={set("whatsapp")} placeholder="+55 11 90000-0000" /></Field>
              <Field label="Mensagem pré-preenchida do WhatsApp"><Input value={form.whatsapp_message ?? ""} onChange={set("whatsapp_message")} placeholder="Olá! Vim pelo site e gostaria de tirar uma dúvida." /></Field>
              <Field label="Instagram (URL)"><Input value={form.instagram_url ?? ""} onChange={set("instagram_url")} placeholder="https://instagram.com/…" /></Field>
              <Field label="Facebook (URL)"><Input value={form.facebook_url ?? ""} onChange={set("facebook_url")} placeholder="https://facebook.com/…" /></Field>
              <Field label="TikTok (URL)"><Input value={form.tiktok_url ?? ""} onChange={set("tiktok_url")} placeholder="https://tiktok.com/@…" /></Field>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Section title="SEO global (páginas sem SEO próprio)">
            <div className="grid gap-4">
              <Field label="Meta title padrão">
                <Input value={form.seo_title ?? ""} onChange={set("seo_title")} maxLength={70} placeholder="Estampa Flix — Artes digitais para sublimação e DTF" />
                <span className="mt-1 block text-[11px] text-muted-foreground">{(form.seo_title ?? "").length}/60 caracteres recomendados</span>
              </Field>
              <Field label="Meta description padrão">
                <Textarea rows={2} maxLength={200} value={form.seo_description ?? ""} onChange={set("seo_description")} placeholder="Resumo do site que aparece no Google (até 160 caracteres)" />
                <span className="mt-1 block text-[11px] text-muted-foreground">{(form.seo_description ?? "").length}/160 caracteres recomendados</span>
              </Field>
              <Field label="Palavras-chave gerais (separadas por vírgula)">
                <Input value={form.seo_keywords ?? ""} onChange={set("seo_keywords")} placeholder="artes para sublimação, estampas dtf, arquivos png 300dpi" />
              </Field>
            </div>
          </Section>

          <Section title="Compartilhamento social (Open Graph)">
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Título de compartilhamento"><Input value={form.og_title ?? ""} onChange={set("og_title")} placeholder="Deixe vazio para usar o meta title" /></Field>
                <Field label="Descrição de compartilhamento"><Input value={form.og_description ?? ""} onChange={set("og_description")} placeholder="Deixe vazio para usar a meta description" /></Field>
              </div>
              <ImageField label="Imagem de compartilhamento (1200x630)" url={form.og_image_url} onFile={(f: File) => upload(f, "og")} uploading={ogUploading} onClear={() => setForm((s: any) => ({ ...s, og_image_url: null }))} />
              <Field label="Ou cole a URL da imagem"><Input value={form.og_image_url ?? ""} onChange={set("og_image_url")} placeholder="https://..." /></Field>
              <p className="text-xs text-muted-foreground">As redes sociais guardam a última imagem lida — a troca pode demorar a aparecer nos links já compartilhados.</p>
            </div>
          </Section>

          <Section title="Analytics & rastreamento (Google Tag Manager recomendado)">
            <p className="mb-4 text-sm text-muted-foreground">O rastreamento agora é feito exclusivamente via Google Tag Manager. Use os campos abaixo para injetar os scripts.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="GTM ID (Referência)"><Input value={form.ga4_measurement_id ?? ""} onChange={set("ga4_measurement_id")} placeholder="GTM-594LSV6J" /></Field>
            </div>
            <div className="mt-4">
              <Field label="Google Search Console (verificação)"><Input value={form.google_search_console_id ?? ""} onChange={set("google_search_console_id")} placeholder="Conteúdo da meta tag" /></Field>
            </div>
            <div className="mt-4">

              <Field label="Scripts do head (Google Analytics / Tag Manager)">
                <Textarea rows={6} className="font-mono text-xs" value={form.head_scripts ?? ""} onChange={set("head_scripts")} placeholder={"<script async src=\"https://www.googletagmanager.com/gtag/js?id=G-XXXX\"></script>\n<script>window.dataLayer=window.dataLayer||[];...</script>"} />
              </Field>
              <Field label="Scripts do body (Tag Manager noscript)">
                <Textarea rows={4} className="font-mono text-xs" value={form.body_scripts ?? ""} onChange={set("body_scripts")} placeholder={"<noscript><iframe src=\"https://www.googletagmanager.com/ns.html?id=GTM-XXXX\" ...></iframe></noscript>"} />
              </Field>
              <p className="mt-2 text-xs text-muted-foreground">Cole o código completo fornecido pelo Google. Eles são injetados no head e logo após a abertura do body em todas as páginas.</p>
            </div>
          </Section>

          <Section title="Indexação — robots.txt e sitemap">
            <div className="grid gap-4">
              <Field label="Conteúdo do robots.txt">
                <Textarea rows={10} className="font-mono text-xs" value={form.robots_txt ?? ""} onChange={set("robots_txt")} placeholder={"User-agent: *\nAllow: /\n\nDisallow: /admin\n\nSitemap: https://estampaflix.com/sitemap.xml"} />
              </Field>
              <p className="text-xs text-muted-foreground">Vazio = usa o padrão do site. Veja o resultado em <a className="text-primary underline" href="/robots.txt" target="_blank" rel="noreferrer">/robots.txt</a>.</p>

              <div className="flex items-center gap-3">
                <Switch checked={form.sitemap_enabled !== false} onCheckedChange={(v) => setForm((f: any) => ({ ...f, sitemap_enabled: v }))} />
                <Label>Gerar sitemap.xml automaticamente</Label>
              </div>
              <Field label="Endereços extras no sitemap (um por linha, começando com /)">
                <Textarea rows={4} className="font-mono text-xs" value={form.sitemap_extra_paths ?? ""} onChange={set("sitemap_extra_paths")} placeholder={"/promocoes\n/parceiros"} />
              </Field>
              <p className="text-xs text-muted-foreground">O sitemap já inclui automaticamente home, catálogo, planos, blog, categorias, artes publicadas (exceto as marcadas como "não indexar") e posts.  Veja em <a className="text-primary underline" href="/sitemap.xml" target="_blank" rel="noreferrer">/sitemap.xml</a>.</p>
            </div>
          </Section>

          <Section title="SEO de Páginas Estáticas">
            <div className="space-y-6">
              <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                <h3 className="mb-3 font-medium text-sm flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" /> Página Inicial (Home)
                </h3>
                <div className="grid gap-4">
                  <Field label="Meta title da Home">
                    <Input value={form.home_seo_title ?? ""} onChange={set("home_seo_title")} placeholder="Título personalizado para a home" />
                  </Field>
                  <Field label="Meta description da Home">
                    <Textarea rows={2} value={form.home_seo_description ?? ""} onChange={set("home_seo_description")} placeholder="Descrição personalizada para a home" />
                  </Field>
                  <ImageField 
                    label="Imagem Open Graph da Home (1200x630)" 
                    url={form.home_og_image_url} 
                    onFile={(f: File) => upload(f, "home_og")} 
                    uploading={homeOgUploading} 
                    onClear={() => setForm((s: any) => ({ ...s, home_og_image_url: null }))} 
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                <h3 className="mb-3 font-medium text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> Página de Planos
                </h3>
                <div className="grid gap-4">
                  <Field label="Meta title dos Planos">
                    <Input value={form.plans_seo_title ?? ""} onChange={set("plans_seo_title")} placeholder="Título personalizado para a página de planos" />
                  </Field>
                  <Field label="Meta description dos Planos">
                    <Textarea rows={2} value={form.plans_seo_description ?? ""} onChange={set("plans_seo_description")} placeholder="Descrição personalizada para a página de planos" />
                  </Field>
                  <Field label="Palavra-chave foco (Planos)">
                    <Input value={form.plans_seo_keyword ?? ""} onChange={set("plans_seo_keyword")} placeholder="ex: assinatura artes sublimação" />
                  </Field>
                </div>
              </div>

              <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                <h3 className="mb-3 font-medium text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Página do Blog (Listagem)
                </h3>
                <div className="grid gap-4">
                  <Field label="Meta title do Blog">
                    <Input value={form.blog_seo_title ?? ""} onChange={set("blog_seo_title")} placeholder="Título personalizado para a listagem do blog" />
                  </Field>
                  <Field label="Meta description do Blog">
                    <Textarea rows={2} value={form.blog_seo_description ?? ""} onChange={set("blog_seo_description")} placeholder="Descrição personalizada para a listagem do blog" />
                  </Field>
                  <Field label="Palavra-chave foco (Blog)">
                    <Input value={form.blog_seo_keyword ?? ""} onChange={set("blog_seo_keyword")} placeholder="ex: dicas sublimação estamparia" />
                  </Field>
                </div>
              </div>
            </div>
          </Section>
        </TabsContent>


        <TabsContent value="footer" className="space-y-4">
          <Section title="Rodapé & informações legais">
            <div className="grid gap-4">
              <Field label="Texto do rodapé"><Textarea rows={3} value={form.footer_text ?? ""} onChange={set("footer_text")} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Razão social"><Input value={form.legal_business_name ?? ""} onChange={set("legal_business_name")} /></Field>
                <Field label="CNPJ / CPF"><Input value={form.legal_document ?? ""} onChange={set("legal_document")} /></Field>
              </div>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="promo" className="space-y-4">
          <Section title="Banner promocional no topo">
            <div className="mb-4 flex items-center gap-3">
              <Switch checked={!!form.promo_banner_enabled} onCheckedChange={(v) => setForm((f: any) => ({ ...f, promo_banner_enabled: v }))} />
              <Label>Ativar banner no topo do site</Label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Texto"><Input value={form.promo_banner_text ?? ""} onChange={set("promo_banner_text")} placeholder="🎉 15% OFF em toda loja com o cupom PRIMEIRA" /></Field>
              <Field label="Link (opcional)"><Input value={form.promo_banner_link ?? ""} onChange={set("promo_banner_link")} placeholder="/planos" /></Field>
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, children }: any) {
  return <div><Label className="mb-1.5 block text-xs uppercase text-muted-foreground">{label}</Label>{children}</div>;
}
function ImageField({ label, url, onFile, uploading, onClear }: any) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs uppercase text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-3">
        {url ? <img src={url} alt={label} className="h-14 w-14 rounded-md border border-border/60 object-contain bg-surface-2" /> : <div className="grid h-14 w-14 place-items-center rounded-md border border-dashed border-border/60 bg-surface-2 text-xs text-muted-foreground">Sem</div>}
        <label className="cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <span className="inline-flex items-center gap-1 rounded-md border border-border/60 px-3 py-2 text-sm hover:bg-muted"><UploadIcon className="h-3 w-3" /> {uploading ? "Enviando…" : "Carregar"}</span>
        </label>
        {url && <Button size="sm" variant="ghost" onClick={onClear}>Remover</Button>}
      </div>
    </div>
  );
}
