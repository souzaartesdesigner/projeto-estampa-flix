import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, TextField } from "@/features/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck, AlertTriangle, Mail } from "lucide-react";

export const Route = createFileRoute("/esqueci-a-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha | Estampa Flix" },
      { name: "description", content: "Recupere o acesso à sua conta Estampa Flix e redefina sua senha com segurança." },
      { property: "og:title", content: "Recuperar senha | Estampa Flix" },
      { property: "og:description", content: "Redefina a senha da sua conta Estampa Flix." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [fieldError, setFieldError] = useState<string | undefined>();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFieldError("Informe um e-mail válido");
      return;
    }
    setFieldError(undefined);
    setState("loading");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setState(error ? "error" : "sent");
  }

  return (
    <AuthShell
      title="Recupere sua senha."
      subtitle="Informe seu e-mail e enviaremos as instruções para redefinir sua senha."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          ← Voltar para o login
        </Link>
      }
    >
      {state === "sent" ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/12 text-primary shadow-glow">
            <MailCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Verifique seu e-mail.</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enviamos as instruções para redefinir sua senha.
            </p>
          </div>
          <Button asChild className="w-full bg-gradient-brand text-brand-foreground shadow-brand">
            <Link to="/login">Voltar para o login</Link>
          </Button>
        </div>
      ) : (
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
            error={fieldError}
            autoFocus
          />

          {state === "error" && (
            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-muted-foreground">
                Não foi possível processar sua solicitação agora. Tente novamente em alguns instantes.
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={state === "loading"}
            className="w-full bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90"
          >
            {state === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
              </>
            ) : (
              "Enviar instruções"
            )}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
