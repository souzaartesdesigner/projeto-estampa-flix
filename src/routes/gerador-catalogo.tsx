import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import {
  Search,
  Upload,
  FileDown,
  CheckSquare,
  XSquare,
  Loader2,
  X,
  Check,
  Plus,
  Lock,
  Sparkles,
  ExternalLink,
  Instagram,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useUserSubscription } from "@/hooks/use-user-subscription";
import exemploCatalogo from "@/assets/exemplo-catalogo.pdf.asset.json";

export const Route = createFileRoute("/gerador-catalogo")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Gerador de Catálogo em PDF — Estampa Flix" },
      {
        name: "description",
        content:
          "Monte portfólios em PDF com as artes da Estampa Flix, adicione a sua logo e envie para os seus clientes. Ferramenta exclusiva para assinantes.",
      },
      { property: "og:title", content: "Gerador de Catálogo em PDF — Estampa Flix" },
      {
        property: "og:description",
        content: "Selecione artes, adicione sua logo e gere um catálogo em PDF personalizado em segundos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CatalogGeneratorPage,
});

const PAGE_LIMIT = 300;
const DEFAULT_BG = "#e8e8e8";
const DEFAULT_TEXT = "#141414";
const DEFAULT_WA_MESSAGE = "Olá! Gostaria de encomendar um produto com esta estampa: Ref: [CODIGO]";
const CLICK_NOTICE = "Dica: As imagens deste catálogo são clicáveis. Clique na estampa para fazer o seu pedido!";

function refLabel(art: any) {
  const code = art?.product_code?.trim();
  return code ? `Ref: ${code}` : "";
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return [20, 20, 20];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function CatalogGeneratorPage() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, any>>({});
  const [logo, setLogo] = useState<{ dataUrl: string; name: string } | null>(null);
  const [columns, setColumns] = useState("3");
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT);
  const [showClickNotice, setShowClickNotice] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [waMessage, setWaMessage] = useState(DEFAULT_WA_MESSAGE);
  const [instagramUser, setInstagramUser] = useState("");
  const [showWaButton, setShowWaButton] = useState(false);
  const [showInstaButton, setShowInstaButton] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id))
      .finally(() => setIsAuthResolved(true));
  }, []);

  const { data: sub, isLoading: isSubLoading } = useUserSubscription(userId);
  const isPremium = !!sub && ["lite", "pro", "plus"].includes(sub.plans?.tier || "");

  const handlePremiumClick = (e: React.MouseEvent) => {
    if (!isPremium) {
      e.preventDefault();
      setPremiumModalOpen(true);
      return true;
    }
    return false;
  };

  const { data: categories = [] } = useQuery({
    queryKey: ["catalog-generator-categories"],
    queryFn: async () =>
      (
        await supabase
          .from("categories")
          .select("id,slug,name,parent_id")
          .is("parent_id", null)
          .order("sort_order")
          .order("name")
      ).data ?? [],
  });

  const resolveCategoryIds = async (slug: string): Promise<string[] | null> => {
    const cat = (categories as any[]).find((c) => c.slug === slug);
    if (!cat) return null;
    const { data: subs } = await supabase.from("categories").select("id").eq("parent_id", cat.id);
    const catIds = [cat.id, ...((subs ?? []) as any[]).map((s) => s.id)];
    const { data: links } = await supabase.from("artwork_categories").select("artwork_id").in("category_id", catIds);
    return Array.from(new Set(((links ?? []) as any[]).map((l) => l.artwork_id)));
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["catalog-generator-artworks", term, categorySlug, categories.length],
    queryFn: async ({ pageParam }) => {
      const from = pageParam * PAGE_LIMIT;
      const to = from + PAGE_LIMIT - 1;

      let ids: string[] | null = null;
      if (categorySlug) {
        ids = await resolveCategoryIds(categorySlug);
        if (ids && ids.length === 0) {
          return { items: [], total: 0, nextPage: undefined };
        }
      }

      let query = supabase
        .from("artworks")
        .select("id,slug,title,preview_url,alt_text,product_code", { count: "exact" })
        .eq("is_published", true)
        .not("preview_url", "is", null)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (term.trim()) query = query.ilike("title", `%${term.trim()}%`);
      if (ids) query = query.in("id", ids);

      const { data: rows, count } = await query;
      const items = rows ?? [];
      return {
        items,
        total: count ?? items.length,
        nextPage: items.length === PAGE_LIMIT ? pageParam + 1 : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    placeholderData: (prev) => prev,
  });

  const artworks = (data?.pages.flatMap((p) => p.items) ?? []) as any[];
  const total = data?.pages[0]?.total ?? 0;
  const hasMore = !!hasNextPage && artworks.length < total;

  const selectedList = useMemo(() => Object.values(selected) as any[], [selected]);
  const selectedCount = selectedList.length;
  const cols = Number(columns);

  function toggle(art: any) {
    setSelected((s) => {
      const next = { ...s };
      if (next[art.id]) delete next[art.id];
      else next[art.id] = art;
      return next;
    });
  }

  function onLogoChange(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Envie um arquivo de imagem (PNG ou JPG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo({ dataUrl: String(reader.result), name: file.name });
    reader.onerror = () => toast.error("Não foi possível ler a imagem.");
    reader.readAsDataURL(file);
  }

  async function generatePdf() {
    if (selectedList.length === 0) {
      toast.error("Selecione ao menos uma arte.");
      return;
    }
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 8;
      const gap = 8;
      const captionH = 7;


      const paintBg = () => {
        doc.setFillColor(isPremium ? bgColor : DEFAULT_BG);
        doc.rect(0, 0, pageW, pageH, "F");
      };

      const effTextColor = isPremium ? textColor : DEFAULT_TEXT;
      const [tr, tg, tb] = hexToRgb(effTextColor);
      const showNotice = isPremium && showClickNotice;

      const logoMeta = isPremium && logo ? await loadImage(logo.dataUrl) : null;
      const drawHeader = () => {
        paintBg();
        let cursor = margin;
        if (isPremium && logo && logoMeta) {
          const ratio = Math.min(90 / logoMeta.width, 30 / logoMeta.height);
          const w = logoMeta.width * ratio;
          const h = logoMeta.height * ratio;
          doc.addImage(logo.dataUrl, (pageW - w) / 2, margin, w, h, undefined, "FAST");
          cursor = margin + h + 4;
        }
        if (showNotice) {
          doc.setFontSize(9);
          doc.setTextColor(tr, tg, tb);
          const lines = doc.splitTextToSize(CLICK_NOTICE, pageW - margin * 2) as string[];
          doc.text(lines, pageW / 2, cursor + 3, { align: "center" });
          cursor += lines.length * 4 + 3;
          doc.setFontSize(11);
        }
        doc.setTextColor(tr, tg, tb);
        return cursor + (cursor > margin ? 3 : 0);
      };

      const drawWatermark = () => {
        if (!isPremium) {
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text("Gerado via Estampaflix", pageW / 2, pageH - 5, { align: "center" });
          doc.setFontSize(11);
          doc.setTextColor(tr, tg, tb);
        }
      };

      const drawSocialButtons = async () => {
        if (!isPremium || (!showWaButton && !showInstaButton)) return;

        const footerY = pageH - 15;
        doc.setFontSize(9);
        doc.setTextColor(tr, tg, tb);
        doc.text("Siga nossas redes e faça seu pedido!", pageW / 2, footerY - 3, { align: "center" });

        const buttons = [];
        if (showWaButton && whatsapp) {
          buttons.push({
            type: "wa",
            label: "Whatsapp",
            color: [0, 215, 87],
            link: `https://api.whatsapp.com/send?phone=${whatsapp.replace(/\D/g, "")}`,
          });
        }
        if (showInstaButton && instagramUser) {
          buttons.push({
            type: "insta",
            label: instagramUser.replace("@", ""),
            gradient: true,
            link: `https://instagram.com/${instagramUser.replace("@", "")}`,
          });
        }

        if (buttons.length === 0) return;

        const btnH = 8;
        const btnGap = 4;
        const iconSize = 5;
        const padding = 3;

        // Calculate total width first to center
        let totalW = 0;
        const btnWidths: number[] = [];

        for (const btn of buttons) {
          doc.setFontSize(9);
          const textW = doc.getTextWidth(btn.label);
          const w = padding * 2 + iconSize + 2 + textW + 2;
          btnWidths.push(w);
          totalW += w;
        }
        totalW += (buttons.length - 1) * btnGap;

        let startX = (pageW - totalW) / 2;

        for (let i = 0; i < buttons.length; i++) {
          const btn = buttons[i];
          const w = btnWidths[i];

          // Draw background
          if (btn.gradient) {
            // Instagram official gradient colors for PDF
            const canvas = document.createElement("canvas");
            // Use a higher resolution for better quality
            const scaleFactor = 4;
            canvas.width = w * 10 * scaleFactor;
            canvas.height = btnH * 10 * scaleFactor;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
              grad.addColorStop(0, "#feda75");
              grad.addColorStop(0.25, "#fa7e1e");
              grad.addColorStop(0.5, "#d62976");
              grad.addColorStop(0.75, "#962fbf");
              grad.addColorStop(1, "#4f5bd5");

              ctx.fillStyle = grad;
              ctx.beginPath();
              // Pill shape radius
              ctx.roundRect(0, 0, canvas.width, canvas.height, canvas.height / 2);
              ctx.fill();

              doc.addImage(canvas.toDataURL("image/png"), "PNG", startX, footerY, w, btnH, undefined, "FAST");
            }
          } else if (btn.color) {
            doc.setFillColor(btn.color[0], btn.color[1], btn.color[2]);
            doc.roundedRect(startX, footerY, w, btnH, 4, 4, "F");
          }

          // Draw Icon
          const iconImg = await renderSocialIconForPdf(btn.type as "wa" | "insta");
          if (iconImg) {
            doc.addImage(
              iconImg,
              startX + padding,
              footerY + (btnH - iconSize) / 2,
              iconSize,
              iconSize,
              undefined,
              "FAST",
            );
          }

          // Draw Text
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.text(btn.label, startX + padding + iconSize + 2, footerY + 5.5);

          doc.link(startX, footerY, w, btnH, { url: btn.link });

          startX += w + btnGap;
        }

        doc.setTextColor(tr, tg, tb);
        doc.setFontSize(11);
      };

      doc.setFontSize(11);
      doc.setTextColor(tr, tg, tb);

      let currentIndex = 0;
      while (currentIndex < selectedList.length) {
        let x = margin;
        let y = drawHeader();

        const startY = y;
        const availableH = pageH - margin - 15 - startY; // 15mm reserved for footer

        // Calculate layout dynamically based on available height
        const cellW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
        // In a grid, we usually want images to be roughly square or consistent ratio
        // We'll use the same formula for targetRows regardless of column count
        let targetRows = Math.floor((availableH + gap) / (cellW + captionH + gap));
        if (targetRows < 1) targetRows = 1;

        const currentCellH = (availableH - (targetRows - 1) * gap) / targetRows;
        const currentImgH = currentCellH - captionH;
        const itemsPerPage = targetRows * cols;
        const pageItems = selectedList.slice(currentIndex, currentIndex + itemsPerPage);

        let col = 0;
        for (const art of pageItems) {
          if (col === cols) {
            col = 0;
            x = margin;
            y += currentCellH + gap;
          }

          const img = await toDataUrl(art.preview_url, isPremium ? bgColor : DEFAULT_BG);
          if (img) {
            const ratio = Math.min(cellW / img.width, currentImgH / img.height);
            const w = img.width * ratio;
            const h = img.height * ratio;
            const imgX = x + (cellW - w) / 2;
            const imgY = y + (currentImgH - h) / 2;
            doc.addImage(img.dataUrl, imgX, imgY, w, h, undefined, "FAST");

            const cleanPhone = isPremium ? whatsapp.replace(/\D/g, "") : "";
            if (cleanPhone) {
              const code = art.product_code?.trim() || "";
              const template = waMessage.trim() || DEFAULT_WA_MESSAGE;
              const msg = template.replace(/\[CODIGO\]/gi, code);
              const whatsappLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
              doc.link(imgX, imgY, w, h, { url: whatsappLink });
            }
          }
          const label = refLabel(art);
          if (label) doc.text(label, x + cellW / 2, y + currentImgH + 5, { align: "center" });

          x += cellW + gap;
          col += 1;
        }


        currentIndex += pageItems.length;
        if (currentIndex < selectedList.length) {
          drawWatermark();
          await drawSocialButtons();
          doc.addPage();
        }
      }

      drawWatermark();
      await drawSocialButtons();
      doc.save("catalogo.pdf");
      toast.success("Catálogo gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10 pb-32">
        <header className="mb-8 max-w-2xl">
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Gerador de Catálogo</h1>
          <p className="mt-2 text-muted-foreground">
            Monte um portfólio em PDF com as artes que você quiser, adicione a logo da sua marca e envie direto para os
            seus clientes — sem preços e sem marca d'água.
          </p>
        </header>

        <section className="rounded-2xl border border-border/50 bg-card p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setTerm(q);
              }}
              className="relative"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar artes por nome…"
                className="pl-9"
              />
            </form>

            <div className="flex flex-wrap gap-2">
              <Pill active={!categorySlug} onClick={() => setCategorySlug(null)}>
                Todas
              </Pill>
              {(categories as any[]).map((c) => (
                <Pill
                  key={c.id}
                  active={categorySlug === c.slug}
                  onClick={() => setCategorySlug(categorySlug === c.slug ? null : c.slug)}
                >
                  {c.name}
                </Pill>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-2 lg:pb-[8px] custom-scrollbar">
            {isAuthResolved && !isSubLoading && !isPremium && (
              <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 shadow-brand">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Vantagens de ser Premium no Gerador</h2>
                </div>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    Catálogo com a sua logo, sem marca d'água da Estampa Flix.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    Cores de fundo e de texto personalizadas com a sua identidade.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    Estampas clicáveis com link de venda direto para o seu WhatsApp.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    Botões sociais clicáveis (WhatsApp e Instagram) no rodapé.
                  </li>
                </ul>
                <Button
                  asChild
                  variant="outline"
                  className="mt-4 w-full border-primary/50 text-[11px] font-bold text-primary hover:bg-primary/10"
                >
                  <a href={exemploCatalogo.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Ver Exemplo de Catálogo Premium
                  </a>
                </Button>
                <Button asChild className="mt-2 w-full bg-gradient-brand text-brand-foreground hover:opacity-90">
                  <Link to="/planos">Quero ser Premium</Link>
                </Button>
              </div>
            )}
            <div

              className={cn(
                "rounded-2xl border border-border/50 bg-card p-4 transition-opacity",
                !isPremium && "opacity-60",
              )}
              onClick={handlePremiumClick}
            >
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Logo do cliente</Label>
                {!isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Aparece apenas no topo do PDF. Não é salva no servidor.
              </p>
              {logo && isPremium ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-border/50 bg-surface-2 p-3">
                  <img
                    src={logo.dataUrl}
                    alt="Logo enviada pelo cliente"
                    className="h-10 w-auto max-w-24 object-contain"
                  />
                  <span className="line-clamp-1 flex-1 text-xs text-muted-foreground">{logo.name}</span>
                  <button
                    type="button"
                    aria-label="Remover logo"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLogo(null);
                    }}
                    className="rounded-full p-1 hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  className={cn(
                    "mt-3 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground transition-colors",
                    isPremium ? "cursor-pointer hover:border-primary/50 hover:text-foreground" : "cursor-default",
                  )}
                >
                  <Upload className="h-5 w-5" />
                  Enviar logo (PNG/JPG)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!isPremium}
                    onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <Label className="text-sm font-semibold">Colunas no PDF</Label>
              <Select value={columns} onValueChange={setColumns}>
                <SelectTrigger className="mt-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 colunas (recomendado)</SelectItem>
                  <SelectItem value="4">4 colunas (compacto)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div
              className={cn(
                "rounded-2xl border border-border/50 bg-card p-4 transition-opacity",
                !isPremium && "opacity-60",
              )}
              onClick={handlePremiumClick}
            >
              <div className="flex items-center justify-between">
                <Label htmlFor="pdf-bg" className="text-sm font-semibold">
                  Cor de fundo do PDF
                </Label>
                {!isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <input
                  id="pdf-bg"
                  type="color"
                  value={isPremium ? bgColor : DEFAULT_BG}
                  disabled={!isPremium}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-1"
                />
                <span className="text-sm text-muted-foreground">
                  {(isPremium ? bgColor : DEFAULT_BG).toUpperCase()}
                </span>
              </div>
            </div>

            <div
              className={cn(
                "rounded-2xl border border-border/50 bg-card p-4 transition-opacity",
                !isPremium && "opacity-60",
              )}
              onClick={handlePremiumClick}
            >
              <div className="flex items-center justify-between">
                <Label htmlFor="pdf-text" className="text-sm font-semibold">
                  Cor do texto do PDF
                </Label>
                {!isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <input
                  id="pdf-text"
                  type="color"
                  value={isPremium ? textColor : DEFAULT_TEXT}
                  disabled={!isPremium}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-1"
                />
                <span className="text-sm text-muted-foreground">
                  {(isPremium ? textColor : DEFAULT_TEXT).toUpperCase()}
                </span>
              </div>
            </div>

            <div
              className={cn(
                "rounded-2xl border border-border/50 bg-card p-4 transition-opacity",
                !isPremium && "opacity-60",
              )}
              onClick={handlePremiumClick}
            >
              <div className="flex items-start justify-between gap-3">
                <Label htmlFor="click-notice" className="text-sm font-semibold leading-snug">
                  Exibir aviso "Imagens Clicáveis" no PDF
                </Label>
                <div className="flex items-center gap-2">
                  {!isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
                  <Switch
                    id="click-notice"
                    checked={isPremium && showClickNotice}
                    disabled={!isPremium}
                    onCheckedChange={setShowClickNotice}
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Mostra um aviso logo abaixo da sua logo, orientando o cliente a clicar nas estampas.
              </p>
            </div>

            <div
              className={cn(
                "rounded-2xl border border-border/50 bg-card p-4 transition-opacity",
                !isPremium && "opacity-60",
              )}
              onClick={handlePremiumClick}
            >
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp" className="text-sm font-semibold">
                  WhatsApp (com DDD)
                </Label>
                {!isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Torna as imagens no PDF clicáveis para compra direta.
              </p>
              <Input
                id="whatsapp"
                type="text"
                value={isPremium ? whatsapp : ""}
                disabled={!isPremium}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 11999999999"
                className="mt-3"
              />

              <Label htmlFor="wa-message" className="mt-4 block text-sm font-semibold">
                Mensagem do WhatsApp
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Use <span className="font-mono text-foreground">[CODIGO]</span> para inserir o código da estampa.
              </p>
              <Textarea
                id="wa-message"
                rows={3}
                value={isPremium ? waMessage : DEFAULT_WA_MESSAGE}
                disabled={!isPremium}
                onChange={(e) => setWaMessage(e.target.value)}
                placeholder={DEFAULT_WA_MESSAGE}
                className="mt-2 text-sm"
              />
              {isPremium && waMessage.trim() !== DEFAULT_WA_MESSAGE && (
                <button
                  type="button"
                  onClick={() => setWaMessage(DEFAULT_WA_MESSAGE)}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Restaurar mensagem padrão
                </button>
              )}
            </div>

            <div
              className={cn(
                "rounded-2xl border border-border/50 bg-card p-4 transition-opacity",
                !isPremium && "opacity-60",
              )}
              onClick={handlePremiumClick}
            >
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Redes Sociais (Rodapé)</Label>
                {!isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="insta-user" className="text-xs font-medium text-muted-foreground">
                    Usuário do Instagram (sem @)
                  </Label>
                  <Input
                    id="insta-user"
                    type="text"
                    value={isPremium ? instagramUser : ""}
                    disabled={!isPremium}
                    onChange={(e) => setInstagramUser(e.target.value)}
                    placeholder="Ex: estampaflix"
                    className="mt-1.5 h-9"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="show-wa" className="text-xs font-medium leading-snug text-muted-foreground">
                    Exibir botão WhatsApp
                  </Label>
                  <Switch
                    id="show-wa"
                    checked={isPremium && showWaButton}
                    disabled={!isPremium}
                    onCheckedChange={setShowWaButton}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="show-insta" className="text-xs font-medium leading-snug text-muted-foreground">
                    Exibir botão Instagram
                  </Label>
                  <Switch
                    id="show-insta"
                    checked={isPremium && showInstaButton}
                    disabled={!isPremium}
                    onCheckedChange={setShowInstaButton}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{selectedCount}</span> arte(s) selecionada(s)
              </p>
              <Button className="mt-3 w-full" onClick={generatePdf} disabled={generating || selectedCount === 0}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                {generating ? "Gerando PDF…" : "Gerar PDF"}
              </Button>
            </div>

            <div className="h-[8px]" aria-hidden />
          </aside>


          <section>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelected((s) => {
                    const next = { ...s };
                    for (const a of artworks) next[a.id] = a;
                    return next;
                  })
                }
              >
                <CheckSquare className="h-4 w-4" /> Selecionar tudo
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelected({})}>
                <XSquare className="h-4 w-4" /> Limpar seleção
              </Button>
              {hasMore && (
                <Button size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="gap-2">
                  {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Carregar mais
                </Button>
              )}
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              Encontrado(s) <span className="font-semibold text-foreground">{total}</span> produto(s). Carregados{" "}
              <span className="font-semibold text-foreground">{artworks.length}</span>.{" "}
              <span className="font-semibold text-primary">{selectedCount}</span> arte(s) selecionada(s) no total.
            </p>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-2xl bg-surface-2" />
                ))}
              </div>
            ) : artworks.length === 0 ? (
              <p className="rounded-2xl border border-border/50 bg-card p-10 text-center text-muted-foreground">
                Nenhuma arte encontrada com esses filtros.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {artworks.map((a) => {
                  const isOn = !!selected[a.id];
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => toggle(a)}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl border bg-card text-left transition-colors",
                        isOn ? "border-primary" : "border-border/50 hover:border-primary/40",
                      )}
                    >
                      <div className="aspect-square w-full overflow-hidden bg-surface-2">
                        <img
                          src={a.preview_url}
                          alt={a.alt_text?.trim() || a.title}
                          loading="lazy"
                          className="block h-full w-full object-cover"
                        />
                      </div>
                      <span className="absolute left-2 top-2">
                        <span
                          aria-hidden
                          className={cn(
                            "grid h-5 w-5 place-items-center rounded border",
                            isOn
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background/80",
                          )}
                        >
                          {isOn && <Check className="h-3.5 w-3.5" />}
                        </span>
                      </span>
                      <p className="line-clamp-2 p-3 text-base font-medium leading-snug text-foreground">{a.title}</p>
                      {a.product_code && <p className="px-3 pb-3 text-sm text-muted-foreground">{refLabel(a)}</p>}
                    </button>
                  );
                })}
              </div>
            )}

            {hasMore && !isLoading && artworks.length > 0 && (
              <div className="mt-8 flex justify-center">
                <Button
                  size="lg"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="gap-2 shadow-lg shadow-primary/30"
                >
                  {isFetchingNextPage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  Carregar mais produtos
                </Button>
              </div>
            )}

            {selectedCount > 0 && (
              <div className="mt-10">
                <h2 className="mb-3 font-display text-xl font-bold">Pré-visualização do PDF</h2>
                <div
                  className="rounded-2xl border border-border/50 p-6"
                  style={{ backgroundColor: isPremium ? bgColor : DEFAULT_BG }}
                >
                  {isPremium && logo && (
                    <img
                      src={logo.dataUrl}
                      alt="Logo do cliente no topo do catálogo"
                      className="mx-auto mb-3 h-16 w-auto max-w-[240px] object-contain"
                    />
                  )}
                  {isPremium && showClickNotice && (
                    <p className="mx-auto mb-6 max-w-xl text-center text-sm" style={{ color: textColor }}>
                      {CLICK_NOTICE}
                    </p>
                  )}
                  <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                    {selectedList.map((a) => (
                      <figure key={a.id} className="text-center">
                        <div className="aspect-square w-full overflow-hidden rounded-[8px]">
                          <img
                            src={a.preview_url}
                            alt={a.alt_text?.trim() || a.title}
                            loading="lazy"
                            className="block h-full w-full object-contain"
                          />
                        </div>
                        <figcaption
                          className="mt-1 text-sm font-medium"
                          style={{ color: isPremium ? textColor : DEFAULT_TEXT }}
                        >
                          {refLabel(a)}
                        </figcaption>
                      </figure>
                    ))}
                  </div>

                  {isPremium && (showWaButton || showInstaButton) && (
                    <div className="mt-8 border-t border-border/30 pt-6 text-center">
                      <p className="mb-1 text-xs font-medium" style={{ color: textColor }}>
                        Siga nossas redes e faça seu pedido!
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        {showWaButton && whatsapp && (
                          <div className="flex items-center gap-2 rounded-full bg-[#00d757] px-4 py-2 text-xs font-bold text-white shadow-sm">
                            <svg className="h-4 w-4 fill-white" viewBox="0 0 16 16">
                              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                            </svg>
                            <span>Whatsapp</span>
                          </div>
                        )}
                        {showInstaButton && instagramUser && (
                          <div
                            className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm"
                            style={{
                              background: "linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)",
                            }}
                          >
                            <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                              <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zm8.9 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                            </svg>
                            <span>{instagramUser.replace("@", "")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!isPremium && (
                    <div className="mt-8 border-t border-border/30 pt-4 text-center">
                      <p className="text-xs text-muted-foreground/60">Gerado via Estampaflix</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        <Dialog open={premiumModalOpen} onOpenChange={setPremiumModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" /> Recurso Exclusivo Premium
              </DialogTitle>
              <DialogDescription className="pt-2 text-base">
                Assine um dos nossos planos (Premium Lite, Pro ou Plus) para personalizar seus catálogos com sua logo,
                cores e links diretos para o seu WhatsApp!
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setPremiumModalOpen(false)}>
                Agora não
              </Button>
              <Button asChild className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
                <Link to="/planos">Conhecer Planos</Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">{selectedCount}</span> arte(s) selecionada(s) no total {"\u2063"}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelected({})}>
                <XSquare className="h-4 w-4" /> Limpar seleção
              </Button>
              <Button size="sm" onClick={generatePdf} disabled={generating} className="shadow-lg shadow-primary/30">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                {generating ? "Gerando PDF…" : "Gerar PDF"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}

function Pill({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function toDataUrl(
  url: string,
  background = "#ffffff",
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const img = await loadImage(url);
    const max = 1400;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply 8px border radius clipping
    // The radius needs to be scaled to the canvas resolution
    // We target ~8px at standard document size, but since canvas is scaled for quality:
    const radius = 8 * (canvas.width / 300); // Approximate scaling for radius
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, canvas.width, canvas.height, radius);
    } else {
      // Fallback for older environments
      ctx.moveTo(radius, 0);
      ctx.arcTo(canvas.width, 0, canvas.width, canvas.height, radius);
      ctx.arcTo(canvas.width, canvas.height, 0, canvas.height, radius);
      ctx.arcTo(0, canvas.height, 0, 0, radius);
      ctx.arcTo(0, 0, canvas.width, 0, radius);
    }
    ctx.clip();

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
  } catch {
    return null;
  }
}

async function renderSocialIconForPdf(type: "wa" | "insta"): Promise<string | null> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, 120, 120);

    if (type === "insta") {
      // Instagram Icon Path (centered and scaled)
      ctx.fillStyle = "white";
      const p = new Path2D(
        "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zm8.9 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
      );
      ctx.save();
      ctx.scale(120 / 24, 120 / 24);
      ctx.fill(p);
      ctx.restore();
    } else {
      // WhatsApp Icon Path (centered and scaled)
      ctx.fillStyle = "white";
      const p = new Path2D(
        "M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z",
      );
      ctx.save();
      ctx.scale(120 / 16, 120 / 16);
      ctx.fill(p);
      ctx.restore();
    }

    return canvas.toDataURL("image/png");
  } catch (e) {
    console.error("Error rendering social icon:", e);
    return null;
  }
}
