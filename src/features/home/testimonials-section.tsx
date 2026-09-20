import { Star, BadgeCheck } from "lucide-react";

type Testimonial = {
  name: string;
  text: string;
  initial: string;
  color: string;
};

const ROW_1: Testimonial[] = [
  { name: "Marcos Silva", text: "As artes são de altíssima qualidade! Meus produtos sublimados ficaram incríveis, os clientes amaram.", initial: "M", color: "from-blue-500 to-cyan-500" },
  { name: "Ana Clara", text: "Comprei o pacote de camisetas e não me arrependo. Estampas nítidas, cores vibrantes e download imediato.", initial: "A", color: "from-purple-500 to-pink-500" },
  { name: "Rodrigo Santos", text: "Uso as artes de futebol há meses. Vendo muito na minha loja graças à qualidade das estampas.", initial: "R", color: "from-emerald-500 to-teal-500" },
  { name: "Fernanda Ramos", text: "A assinatura vale cada centavo. Toda semana tem arte nova e o suporte é rápido no WhatsApp.", initial: "F", color: "from-orange-500 to-red-500" },
  { name: "Lucas Ferreira", text: "Comprei o pacote de personagens e o resultado no tecido ficou perfeito. Recomendo demais!", initial: "L", color: "from-indigo-500 to-blue-500" },
  { name: "Camila Lima", text: "Plataforma simples, rápida e cheia de artes exclusivas. Meu ateliê nunca faturou tanto.", initial: "C", color: "from-fuchsia-500 to-purple-500" },
];

const ROW_2: Testimonial[] = [
  { name: "Bruno Henrique", text: "Baixei minhas artes em segundos após o Pix. Impressionante a organização do site.", initial: "B", color: "from-sky-500 to-blue-600" },
  { name: "Mariana Oliveira", text: "As categorias facilitam demais achar o que preciso. Estou apaixonada pelo acervo Disney.", initial: "M", color: "from-pink-500 to-rose-500" },
  { name: "Rafael Costa", text: "Os arquivos vêm prontos para sublimação. Sem dor de cabeça com resolução ou fundo.", initial: "R", color: "from-amber-500 to-orange-500" },
  { name: "Juliana Prado", text: "Já testei outras plataformas, mas essa é disparada a melhor em qualidade e variedade.", initial: "J", color: "from-teal-500 to-cyan-500" },
  { name: "Thiago Almeida", text: "O plano mensal me deu acesso a milhares de artes. Meu Instagram bombou depois disso.", initial: "T", color: "from-violet-500 to-indigo-500" },
  { name: "Patrícia Melo", text: "Suporte excelente, artes lindas e preço justo. Virei cliente fiel!", initial: "P", color: "from-red-500 to-pink-500" },
];

function Card({ t: item }: { t: Testimonial }) {
  return (
    <article className="w-[300px] shrink-0 rounded-3xl border border-white/5 bg-white/[0.02] p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:border-primary/40 hover:bg-white/[0.04] sm:w-[380px]">
      <header className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-gradient-to-br ${item.color} text-lg font-bold text-white`}>
          {item.initial}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-black tracking-tight text-foreground">{item.name}</span>
            <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
          </div>
          <div className="mt-0.5 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-primary text-primary" />
            ))}
          </div>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          Verificado
        </span>
      </header>
      <p className="mt-4 text-sm leading-relaxed text-foreground/70">"{item.text}"</p>
    </article>
  );
}

function Marquee({ items, reverse = false }: { items: Testimonial[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="relative mb-6 flex overflow-hidden last:mb-0">
      <div
        className={`flex w-max shrink-0 gap-6 pr-6 ${reverse ? "animate-marquee-right" : "animate-marquee-left"}`}
      >
        {doubled.map((t, i) => (
          <Card key={i} t={t} />
        ))}
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="relative mt-10 w-full overflow-hidden py-10 md:mt-16 md:py-16">
      <div className="mx-auto mb-10 max-w-7xl px-4 text-center md:px-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <Star className="h-3.5 w-3.5 fill-current" />
          Depoimentos Reais
        </span>
        <h2 className="mt-6 font-display text-3xl font-black tracking-tight text-foreground md:text-5xl">
          O que nossos clientes dizem
        </h2>
        <p className="mt-4 text-balance text-sm font-medium text-foreground/50 md:text-base">
          A confiança de milhares de clientes em todo o Brasil.
        </p>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent md:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent md:w-40" />
        <Marquee items={ROW_1} />
        <Marquee items={ROW_2} reverse />
      </div>
    </section>
  );
}
