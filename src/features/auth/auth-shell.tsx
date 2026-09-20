import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Sparkles, ArrowLeft, ImageIcon, Zap, Star, Crown, ShieldCheck, Lock, Phone } from "lucide-react";
import logoAsset from "@/assets/estampa-flix-logo.png.asset.json";
import { useSiteSettings } from "@/hooks/use-site-settings";

const PERKS = [
  { icon: ImageIcon, title: "Artes em alta resolução", desc: "Qualidade profissional para impressão perfeita." },
  { icon: Zap, title: "Downloads rápidos", desc: "Acesso imediato às suas artes favoritas." },
  { icon: Star, title: "Novas artes toda semana", desc: "Conteúdo atualizado constantemente." },
  { icon: Crown, title: "Para sublimadores", desc: "Criado por quem entende do seu negócio." },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: React.ReactNode;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { data: settings } = useSiteSettings();
  const logo = settings?.logo_url || logoAsset.url;
  const siteName = settings?.site_name ?? "Estampa Flix";

  return (
    <main className="relative flex min-h-screen w-full flex-col lg:flex-row">
      {/* Painel visual (showcase) — apenas desktop */}
      <section className="relative hidden w-full shrink-0 flex-col justify-start gap-10 overflow-hidden px-10 py-12 lg:flex lg:w-[40%] lg:min-h-screen lg:border-r lg:border-r-primary/15 xl:px-14">
        {/* Background atual, restrito ao painel esquerdo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-background"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 90% 45% at 25% 12%, var(--brand), transparent 65%), radial-gradient(ellipse 80% 40% at 85% 90%, var(--brand-2), transparent 70%)",
          }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-background/80" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 0.5) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.035,
            maskImage: "radial-gradient(ellipse at 35% 35%, black, transparent 78%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-1/3 -z-10 h-72 w-72 rounded-full blur-[130px]"
          style={{ background: "var(--brand)", opacity: 0.18 }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-px lg:block"
          style={{
            background: "linear-gradient(180deg, transparent, oklch(0.635 0.208 253 / 0.35), transparent)",
          }}
        />

        <Link to="/" className="relative inline-flex w-fit items-center">
          <img src={logo} alt={siteName} className="h-12 w-auto object-contain" />
        </Link>

        <div className="relative max-w-full animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Artes digitais para sublimação
          </span>
          <h2 className="mt-7 max-w-full font-display text-[clamp(2.1rem,3vw,3.1rem)] font-bold leading-[1.08] tracking-tight">
            Suas artes.
            <br />
            Sua produção.
            <br />
            <span className="text-primary">Mais possibilidades.</span>
          </h2>
          <p className="mt-5 max-w-[38ch] text-base leading-relaxed text-muted-foreground">
            Encontre artes prontas para transformar suas ideias em produtos incríveis.
          </p>

          <ul className="mt-8 grid max-w-[46ch] gap-3">
            {PERKS.map(({ icon: Icon, title, desc }) => (
              <li
                key={title}
                className="flex items-center gap-3.5 rounded-2xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-sm"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold leading-snug">{title}</span>
                  <span className="block text-[13px] leading-snug text-muted-foreground">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-auto flex max-w-[46ch] items-center gap-3.5 rounded-2xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-sm">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold leading-snug">Uso comercial permitido</span>
            <span className="block text-[13px] leading-snug text-muted-foreground">
              Artes liberadas para uso em produtos físicos.
            </span>
          </span>
        </div>
      </section>

      {/* Formulário */}
      <section
        className="relative flex w-full flex-1 flex-col px-4 py-14 sm:px-10 lg:min-h-screen lg:px-16 lg:py-12"
        style={{ background: "#0a0a0a" }}
      >
        <Link
          to="/"
          className="absolute left-4 top-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:left-8 lg:left-10 lg:top-8"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center">
          <div className="mb-7 flex flex-col items-center text-center lg:hidden">
            <Link to="/">
              <img src={logo} alt={siteName} className="h-9 w-auto object-contain" />
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-[26px] border border-border/60 bg-card/60 p-7 shadow-elegant backdrop-blur-2xl sm:p-9">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 h-px"
              style={{
                background: "linear-gradient(90deg, transparent, oklch(0.635 0.208 253 / 0.9), transparent)",
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-40 w-2/3 rounded-full blur-3xl"
              style={{ background: "var(--brand)", opacity: 0.12 }}
            />

            <div className="relative mb-6 text-center">
              <h1 className="text-center font-display text-2xl font-bold tracking-tight sm:text-[27px]">{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            </div>

            <div className="relative">{children}</div>
          </div>

          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>

        {/* Rodapé do painel de autenticação */}
        <div className="mt-12 pt-5" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center text-xs text-muted-foreground/70">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/60" />
              Ambiente seguro e protegido
            </span>
            <span aria-hidden className="hidden text-muted-foreground/40 sm:inline">
              |
            </span>
            <span>© 2026 EstampaFlix. Todos os direitos reservados.</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "Mínimo de 6 caracteres", ok: password.length >= 6 },
    { label: "Uma letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Um número", ok: /[0-9]/.test(password) },
    { label: "Um símbolo (!@#...)", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const label = score <= 1 ? "Fraca" : score === 2 ? "Razoável" : score === 3 ? "Boa" : "Forte";
  const color = score <= 1 ? "bg-destructive" : score === 2 ? "bg-warning" : score === 3 ? "bg-primary" : "bg-success";

  return (
    <div className="rounded-xl border border-border/60 bg-surface/40 p-3.5">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Força da senha</span>
        <span className="font-medium">{label}</span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-border">
        <div className={`h-full transition-all duration-300 ${color}`} style={{ width: `${(score / 4) * 100}%` }} />
      </div>
      <ul className="grid gap-1 text-xs sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? "text-success" : "text-muted-foreground"}>
            {c.ok ? "✓" : "○"} {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GoogleButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border/60 bg-surface/40 py-2.5 text-sm font-medium transition-colors hover:bg-surface hover:text-foreground"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#EA4335"
          d="M12 5c1.6 0 3.1.6 4.2 1.6l3.1-3.1C17.5 1.7 14.9.6 12 .6 7.3.6 3.3 3.3 1.4 7.3l3.6 2.8C6 7.1 8.8 5 12 5z"
        />
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.8-.1-1.7-.2-2.4H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
        />
        <path
          fill="#FBBC05"
          d="M5 14.1c-.3-.9-.5-1.9-.5-2.9s.2-2 .5-2.9L1.4 5.5C.5 7.3 0 9.3 0 11.4s.5 4.1 1.4 5.9l3.6-2.8z"
        />
        <path
          fill="#34A853"
          d="M12 22.2c3.2 0 5.9-1.1 7.8-2.9l-3.7-2.9c-1 .7-2.4 1.1-4.1 1.1-3.2 0-5.9-2.1-6.9-5L1.4 15.3C3.3 19.3 7.3 22.2 12 22.2z"
        />
      </svg>
      {label}
    </button>
  );
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  error,
  visible,
  onToggle,
  autoFocus,
  icon: Icon = Lock,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder?: string;
  error?: string;
  visible: boolean;
  onToggle: () => void;
  autoFocus?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
        )}
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border border-border/60 bg-surface/40 py-2.5 pr-11 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-surface focus:ring-2 focus:ring-primary/25 ${Icon ? "pl-10" : "pl-3.5"}`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Eye() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOff() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.16 3.19M6.6 6.6A18 18 0 0 0 2 12s3.5 8 10 8a9.3 9.3 0 0 0 5.4-1.6" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function TextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  placeholder,
  error,
  autoFocus,
  icon: Icon,
  hint,
  maxLength,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  autoFocus?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  hint?: string;
  maxLength?: number;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium">
        <span>{label}</span>
        {hint && <span className="text-xs font-normal text-muted-foreground">({hint})</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border border-border/60 bg-surface/40 py-2.5 pr-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-surface focus:ring-2 focus:ring-primary/25 ${Icon ? "pl-10" : "pl-3.5"}`}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function PhoneField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const handleChange = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "").slice(0, 15);
    onChange(digits ? `+${digits}` : "");
  };

  return (
    <div className="grid gap-1.5">
      <label htmlFor="whatsapp" className="text-sm font-medium">
        Seu WhatsApp
      </label>
      <div className="relative rounded-xl border border-border/60 bg-surface/40 transition-all focus-within:border-primary/60 focus-within:bg-surface focus-within:ring-2 focus-within:ring-primary/25">
        <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
        <input
          id="whatsapp"
          type="tel"
          inputMode="tel"
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          autoComplete="tel"
          placeholder="Digite 55 + DDD + número"
          maxLength={16}
          aria-invalid={!!error}
          aria-describedby={error ? "whatsapp-error" : "whatsapp-hint"}
          className="w-full bg-transparent py-2.5 pl-10 pr-3.5 text-sm outline-none placeholder:text-muted-foreground/60"
        />
      </div>
      {!error && (
        <p id="whatsapp-hint" className="text-xs text-muted-foreground">
          Inclua o código do país. Ex.: 55 11 99999-9999
        </p>
      )}
      {error && (
        <p id="whatsapp-error" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
