import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { useSiteContent } from "@/hooks/use-site-content";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { QRCodeSVG } from "qrcode.react";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.002 2C6.486 2 2 6.486 2 12.003c0 1.834.48 3.552 1.322 5.04L2 22l4.974-1.316A9.955 9.955 0 0 0 12.002 22c5.517 0 10.003-4.486 10.003-9.997C22.005 6.486 17.519 2 12.002 2Zm6.308 13.988c-.274.772-1.362 1.408-1.878 1.5-.504.09-1.002.128-1.49-.03-.343-.108-.698-.208-1.065-.322-2.17-.68-3.93-2.04-5.198-3.9-.46-.67-.83-1.39-1.08-2.17-.16-.49-.066-1.02.24-1.43.13-.18.298-.31.51-.36.213-.05.44-.01.64.11.26.15.52.43.7.71.18.28.31.59.4.91.07.24.03.5-.11.7-.12.17-.27.32-.43.45-.1.08-.2.16-.28.26-.08.1-.13.22-.1.34.15.65.48 1.22.94 1.67.6.58 1.33.99 2.13 1.21.13.04.27.02.38-.07.11-.09.2-.2.29-.31.19-.24.4-.47.63-.68.19-.18.45-.25.7-.19.25.06.48.2.66.4.37.4.72.82 1.05 1.25.18.24.22.55.1.82Z"
        fill="currentColor"
      />
    </svg>
  );
}

function normalizeWhatsApp(raw: string | null | undefined) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export const Route = createFileRoute("/suporte")({
  loader: async ({ context }) => {
    const settings = await context.queryClient.ensureQueryData({
      queryKey: ["site-settings"],
      queryFn: async () => {
        const { data } = await (supabase as any).from("site_settings").select("*").eq("id", true).maybeSingle();
        return data;
      },
    });
    return { settings };
  },
  head: ({ loaderData }) => {
    const settings = (loaderData as any)?.settings;
    const title = "Suporte e perguntas frequentes — Estampa Flix";
    const description = "Tire dúvidas sobre assinatura, créditos, licença comercial e downloads na Estampa Flix, ou fale com nosso time pelo formulário de contato.";
    
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: "Suporte — Estampa Flix" },
        { property: "og:description", content: "Perguntas frequentes sobre planos, créditos e licença de uso, além de canal direto com a equipe da Estampa Flix." },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://estampaflix.com/suporte" },
        { name: "keywords", content: "suporte estampa flix, dúvidas sublimação, como baixar artes, licença comercial" },
      ],
      links: [{ rel: "canonical", href: "https://estampaflix.com/suporte" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              { "@type": "Question", name: "Como funciona a assinatura?", acceptedAnswer: { "@type": "Answer", text: "Você escolhe um plano (Lite, Pro ou Plus), ganha créditos mensais para baixar as artes que quiser e a assinatura renova automaticamente todo mês." } },
              { "@type": "Question", name: "Posso usar as artes comercialmente?", acceptedAnswer: { "@type": "Answer", text: "Sim. Todos os planos incluem licença de uso comercial e você pode aplicar em produtos que vender." } },
              { "@type": "Question", name: "Downloads repetidos consomem créditos?", acceptedAnswer: { "@type": "Answer", text: "Não. Se você já baixou uma arte antes, pode baixar de novo pelo seu histórico sem gastar novos créditos." } },
              { "@type": "Question", name: "E se eu ficar sem créditos no meio do mês?", acceptedAnswer: { "@type": "Answer", text: "Você pode fazer upgrade para um plano maior a qualquer momento, ou comprar artes avulsas." } },
              { "@type": "Question", name: "Como cancelo minha assinatura?", acceptedAnswer: { "@type": "Answer", text: "Pela sua área do cliente em Minha Assinatura, com um clique. Sem burocracia." } },
              { "@type": "Question", name: "Qual a qualidade dos arquivos?", acceptedAnswer: { "@type": "Answer", text: "Todas as artes vêm em alta resolução (300 DPI), prontas para sublimação, DTF e impressão profissional." } },
            ],
          }),
        },
      ],
    };
  },
  component: Suporte,
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(10).max(2000),
});

function Suporte() {
  const { t } = useI18n();
  const cms = useSiteContent("page_suporte");
  const { data: settings } = useSiteSettings();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const whatsappNumber = normalizeWhatsApp(settings?.whatsapp);
  const whatsappText = settings?.whatsapp_message?.trim() || t("support.whatsappDefaultMessage");
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`
    : null;

  const FAQ = [
    { q: t("support.faq1q"), a: t("support.faq1a") },
    { q: t("support.faq2q"), a: t("support.faq2a") },
    { q: t("support.faq3q"), a: t("support.faq3a") },
    { q: t("support.faq4q"), a: t("support.faq4a") },
    { q: t("support.faq5q"), a: t("support.faq5a") },
    { q: t("support.faq6q"), a: t("support.faq6a") },
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("support_messages").insert(parsed.data);
    setLoading(false);
    if (error) return toast.error(t("support.error"));
    toast.success(t("support.sent"));
    setForm({ name: "", email: "", subject: "", message: "" });
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-5xl px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="font-display text-4xl font-black">{cms?.title || t("support.title")}</h1>
          {cms?.content ? (
            <div
              className="mx-auto mt-2 max-w-2xl text-muted-foreground [&_a]:text-primary [&_a]:underline [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(cms.content) }}
            />
          ) : (
            <p className="mt-2 text-muted-foreground">{t("support.subtitle")}</p>
          )}
        </header>

        {whatsappHref && (
          <section className="mb-10 overflow-hidden rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 text-center sm:text-left">
                <h2 className="mb-2 font-display text-2xl font-bold">{t("support.whatsappTitle")}</h2>
                <p className="mb-5 text-sm text-muted-foreground">{t("support.whatsappBody")}</p>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-animated-btn"
                  aria-label={t("support.whatsappButton")}
                >
                  <span className="whatsapp-animated-btn__sign">
                    <svg className="whatsapp-animated-btn__icon" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"></path>
                    </svg>
                  </span>
                  <span className="whatsapp-animated-btn__text">Whatsapp</span>
                </a>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG value={whatsappHref} size={132} level="M" />
                </div>
                <span className="text-xs text-muted-foreground">{t("support.whatsappQr")}</span>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <h2 className="mb-4 font-display text-2xl font-bold"><MessageCircle className="mr-2 inline h-5 w-5 text-primary" /> {t("support.contactTitle")}</h2>
            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border/60 bg-card p-6">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("support.name")}</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t("support.email")}</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">{t("support.subject")}</Label>
                <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={150} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">{t("support.message")}</Label>
                <Textarea id="message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={2000} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-brand text-brand-foreground shadow-brand">
                <Mail className="mr-2 h-4 w-4" /> {loading ? t("support.sending") : t("support.send")}
              </Button>
            </form>
          </div>


          <div>
            <h2 className="mb-4 font-display text-2xl font-bold">{t("support.faqTitle")}</h2>
            <Accordion type="single" collapsible className="rounded-2xl border border-border/60 bg-card px-4">
              {FAQ.map((item, i) => (
                <AccordionItem key={i} value={String(i)}>
                  <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
