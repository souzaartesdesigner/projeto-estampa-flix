import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AuthShell, GoogleButton, PasswordField, PasswordStrength, PhoneField, TextField } from "@/features/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck, ArrowLeft, User, Mail, Building2, Lock, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta | Estampa Flix" },
      {
        name: "description",
        content: "Crie sua conta gratuita na Estampa Flix e comece a explorar artes digitais para sublimação e DTF.",
      },
      { property: "og:title", content: "Criar conta | Estampa Flix" },
      { property: "og:description", content: "Crie sua conta gratuita na Estampa Flix." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignupPage,
});

const STEPS = ["Dados", "Senha"];

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [company, setCompany] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/minha-conta", search: { tab: "profile" } });
    });
  }, [navigate]);

  function nextStep(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim() || name.trim().length > 100) next.name = "Informe seu nome (até 100 caracteres)";
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || email.trim().length > 255) next.email = "Informe um e-mail válido";
    const phoneDigits = whatsapp.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) next.whatsapp = "Informe o código do país, DDD e número";
    if (company.trim().length > 100) next.company = "A empresa deve ter até 100 caracteres";
    setErrors(next);
    if (Object.keys(next).length) return;
    setStep(1);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (password.length < 6) next.password = "A senha deve ter no mínimo 6 caracteres";
    if (password !== confirm) next.confirm = "As senhas não coincidem";
    if (!accepted) next.terms = "É necessário aceitar os Termos de Uso e a Política de Privacidade";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          whatsapp,
          company: company.trim() || null,
          accepted_terms_at: new Date().toISOString(),
        },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      if (/registered|already/i.test(error.message)) {
        setErrors({ email: "Este e-mail já possui uma conta" });
        setStep(0);
        return toast.error("Este e-mail já possui uma conta.");
      }
      return toast.error(error.message);
    }
    setDone(true);
    toast.success("Conta criada! Confira seu e-mail para confirmar.");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Erro ao entrar com Google");
  }

  if (done) {
    return (
      <AuthShell
        title="Verifique seu e-mail."
        subtitle="Enviamos um link de confirmação para concluir a criação da sua conta."
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            ← Voltar para o login
          </Link>
        }
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/12 text-primary shadow-glow">
            <MailCheck className="h-7 w-7" />
          </div>
          <p className="text-sm text-muted-foreground">
            Confirme seu e-mail <span className="font-medium text-foreground">{email}</span> para acessar a Estampa
            Flix.
          </p>
          <Button asChild className="w-full bg-gradient-brand text-brand-foreground shadow-brand">
            <Link to="/login">Ir para o login</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={
        <>
          {" "}
          CRIE SUA <span className="text-[#0089ff]">CONTA.</span>{" "}
        </>
      }
      subtitle="Comece agora a explorar a Estampa Flix."
      footer={
        <>
          Já tem uma conta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Entrar →
          </Link>
        </>
      }
    >
      {/* Indicador de etapas */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-all duration-300 ${
                i <= step
                  ? "bg-gradient-brand text-brand-foreground shadow-brand"
                  : "border border-border/60 bg-surface/40 text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-xs ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
            {i < STEPS.length - 1 && (
              <span className={`h-px flex-1 transition-colors ${i < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {step === 0 ? (
        <form onSubmit={nextStep} className="animate-fade-in space-y-4" noValidate>
          <TextField
            id="name"
            label="Seu nome"
            value={name}
            onChange={setName}
            autoComplete="name"
            icon={User}
            placeholder="Seu nome completo"
            error={errors.name}
            maxLength={100}
          />
          <TextField
            id="email"
            label="Seu E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            icon={Mail}
            placeholder="seu@email.com"
            error={errors.email}
            maxLength={255}
          />
          <PhoneField
            value={whatsapp}
            onChange={setWhatsapp}
            error={errors.whatsapp}
          />
          <TextField
            id="company"
            label="Empresa"
            hint="Opcional"
            value={company}
            onChange={setCompany}
            autoComplete="organization"
            icon={Building2}
            placeholder="Nome da sua empresa"
            error={errors.company}
            maxLength={100}
          />
          <Button
            type="submit"
            className="w-full bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90"
          >
            Continuar
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton onClick={google} label="Criar conta com Google" />
        </form>
      ) : (
        <form onSubmit={onSubmit} className="animate-fade-in space-y-4" noValidate>
          <PasswordField
            id="password"
            label="Senha"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            icon={Lock}
            placeholder="Crie uma senha segura"
            error={errors.password}
            visible={showPwd}
            onToggle={() => setShowPwd((v) => !v)}
            autoFocus
          />
          <PasswordField
            id="confirm"
            label="Confirmar senha"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            icon={ShieldCheck}
            placeholder="Repita a senha"
            error={errors.confirm}
            visible={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
          />
          {password && <PasswordStrength password={password} />}

          <div className="grid gap-1.5">
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border/60 bg-surface/40 accent-[var(--primary)]"
              />
              <span>
                Li e aceito os{" "}
                <Link to="/termos" target="_blank" className="font-medium text-primary hover:underline">
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link to="/privacidade" target="_blank" className="font-medium text-primary hover:underline">
                  Política de Privacidade
                </Link>
                .
              </span>
            </label>
            {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(0)} disabled={loading}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando conta...
                </>
              ) : (
                "Criar conta"
              )}
            </Button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
