import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AuthShell, GoogleButton, PasswordField, TextField } from "@/features/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Lock } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s.redirect === "string" ? { redirect: s.redirect } : {},

  head: () => ({
    meta: [
      { title: "Entrar | Estampa Flix" },
      {
        name: "description",
        content: "Acesse sua conta na Estampa Flix para baixar artes, ver pedidos e gerenciar sua assinatura.",
      },
      { property: "og:title", content: "Entrar | Estampa Flix" },
      { property: "og:description", content: "Acesse sua conta na Estampa Flix." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        if (redirect) navigate({ to: redirect as any });
        else navigate({ to: "/minha-conta", search: { tab: "profile" } });
      }
    });
  }, [navigate, redirect]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Informe um e-mail válido";
    if (!password) next.password = "Informe sua senha";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setErrors({ password: "E-mail ou senha incorretos" });
      return toast.error("Não foi possível entrar. Verifique seus dados.");
    }
    toast.success("Bem-vindo de volta!");
    if (redirect) navigate({ to: redirect as any });
    else navigate({ to: "/minha-conta", search: { tab: "profile" } });
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Erro ao entrar com Google");
  }

  return (
    <AuthShell
      title={
        <>
          {" "}
          BEM-VINDO <span className="text-[#0089ff]">DE VOLTA.</span>{" "}
        </>
      }
      subtitle="Acesse sua conta e gerencie seus downloads e assinaturas."
      footer={
        <>
          Ainda não tem uma conta?{" "}
          <Link to="/cadastro" className="font-medium text-primary hover:underline">
            Criar conta →
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          id="email"
          label="E-mail"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          icon={Mail}
          placeholder="seu@email.com"
          error={errors.email}
        />

        <PasswordField
          id="password"
          label="Senha"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          icon={Lock}
          placeholder="Digite sua senha"
          error={errors.password}
          visible={show}
          onToggle={() => setShow((v) => !v)}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-border/60 bg-surface/40 accent-[var(--primary)]"
            />
            Lembrar de mim
          </label>
          <Link to="/esqueci-a-senha" className="text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton onClick={google} label="Entrar com Google" />
    </AuthShell>
  );
}
