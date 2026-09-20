import { CheckCircle2, Download, FileStack, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TestimonialsSection } from "@/features/home/testimonials-section";

const AUDIENCE = [
  {
    title: "Gráficas e estamparias",
    desc: "Não perca vendas por falta de artes atualizadas — ofereça o que seus clientes estão buscando com visual profissional e pronto pra produção.",
  },
  {
    title: "Designers e freelancers",
    desc: "Tenha um banco de artes editáveis sempre à mão e entregue mais rápido com qualidade, sem partir do zero.",
  },
  {
    title: "Empresas de sublimação",
    desc: "Aumente sua taxa de aprovação com artes modernas e edições automatizadas, que agilizam o processo e impressionam seus clientes.",
  },
  {
    title: "Lojistas e Empreendedores Online",
    desc: "Diferencie seus produtos no mercado e crie coleções que vendem, mesmo sem ser designer.",
  },
];

const PERKS = [
  {
    icon: Download,
    title: "Downloads Imediatos",
    desc: "Acesso instantâneo a todas as artes premium logo após a confirmação.",
  },
  {
    icon: FileStack,
    title: "Arquivos Editáveis e Prontos",
    desc: "Arquivos organizados nos principais formatos do mercado (PSD, AI, CDR, PNG, PDF).",
  },
  {
    icon: Zap,
    title: "Novas Artes Toda Semana",
    desc: "Conteúdo atualizado constantemente para sua loja nunca ficar desatualizada.",
  },
];

const FAQ = [
  {
    q: "Como funciona o acesso após o pagamento?",
    a: "Assim que o pagamento é confirmado, sua assinatura é ativada automaticamente e os créditos entram na sua conta. Você já pode baixar as artes na hora, direto pelo site, sem esperar aprovação manual.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. O cancelamento é feito em poucos cliques na área Minha Conta, sem multa nem fidelidade. Você continua com acesso até o fim do período já pago.",
  },
  {
    q: "As artes servem para comercialização nos meus produtos?",
    a: "Sim. Sua assinatura inclui licença comercial para aplicar as artes em produtos que você vende (camisetas, canecas, quadros e afins). Não é permitido revender ou redistribuir os arquivos originais.",
  },
  {
    q: "Qual formato vêm os arquivos?",
    a: "Os arquivos são entregues em alta resolução, nos principais formatos do mercado: PSD, AI, CDR, PNG transparente e PDF, conforme a arte escolhida.",
  },
];

export function PlansLanding({ onScrollToPlans }: { onScrollToPlans: () => void }) {
  return (
    <>
      <section className="relative border-y border-border/50 bg-surface/60 py-14 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h2 className="text-center font-display text-2xl font-black tracking-tight sm:text-4xl">
            A Estampa<span className="text-primary">Flix</span> é Para Você?
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {AUDIENCE.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-sm transition-colors hover:border-primary/40"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <h3 className="font-display text-lg font-bold tracking-tight">{item.title}</h3>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Button
              onClick={onScrollToPlans}
              className="h-12 rounded-full bg-gradient-brand px-8 text-sm font-bold text-brand-foreground shadow-brand transition-transform hover:-translate-y-0.5 hover:opacity-95 sm:text-base"
            >
              Garantir Minha Assinatura Estampaflix!
            </Button>
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
        <h2 className="mb-8 text-center font-display text-2xl font-black tracking-tight sm:text-3xl">Benefícios</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {PERKS.map((perk) => (
            <div
              key={perk.title}
              className="rounded-2xl border border-border/60 bg-card/70 p-6 text-center backdrop-blur-sm"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <perk.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold tracking-tight">{perk.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{perk.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 pb-16 sm:pb-24">
        <h2 className="text-center font-display text-2xl font-black tracking-tight sm:text-3xl">
          Perguntas Frequentes
        </h2>
        <Accordion type="single" collapsible className="mt-8 w-full">
          {FAQ.map((item) => (
            <AccordionItem key={item.q} value={item.q} className="border-border/60">
              <AccordionTrigger className="text-left text-sm font-semibold sm:text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  );
}
