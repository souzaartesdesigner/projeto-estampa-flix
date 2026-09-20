import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Estampa Flix" },
      { name: "description", content: "Escolha uma nova senha para sua conta na Estampa Flix." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Reset,
});

type LinkState = "checking" | "valid" | "invalid";

function Reset() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkState, setLinkState] = useState<LinkState>("checking");

  // Verifica se veio de um link de recuperação válido.
  // Supabase entrega um token no hash e dispara PASSWORD_RECOVERY quando processado.
  useEffect(() => {
    let ok = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        ok = true;
        setLinkState("valid");
      }
    });

    // Fallback: se já houver sessão ativa (usuário logado abriu direto) considera válido
    const timer = setTimeout(async () => {
      if (ok) return;
      const { data } = await supabase.auth.getSession();
      setLinkState(data.session ? "valid" : "invalid");
    }, 1200);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const checks = [
    { label: "Pelo menos 6 caracteres", ok: password.length >= 6 },
    { label: "Uma letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Um número", ok: /[0-9]/.test(password) },
    { label: "Um símbolo (!@#...)", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const strengthLabel = score <= 1 ? "Fraca" : score === 2 ? "Razoável" : score === 3 ? "Boa" : "Forte";
  const strengthColor = score <= 1 ? "bg-destructive" : score === 2 ? "bg-yellow-500" : score === 3 ? "bg-primary" : "bg-green-500";
  const passwordsMatch = password && password === confirm;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres");
    if (password !== confirm) return toast.error("As senhas não coincidem");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("same")) {
        return toast.error("A nova senha deve ser diferente da atual");
      }
      return toast.error(error.message);
    }
    toast.success("Senha atualizada com sucesso!");
    navigate({ to: "/minha-conta", search: { tab: "profile" } });
  }

  return (
    <SiteLayout>
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-border/60 bg-card p-8 shadow-elegant">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand shadow-brand">
              <KeyRound className="h-6 w-6 text-brand-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold">Definir nova senha</h1>
            <p className="mt-1 text-sm text-muted-foreground">Escolha uma senha forte para proteger sua conta.</p>
          </div>

          {linkState === "checking" && (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-surface-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Verificando link...
            </div>
          )}

          {linkState === "invalid" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <p className="font-medium text-foreground">Link inválido ou expirado</p>
                  <p className="mt-1 text-muted-foreground">
                    O link de recuperação pode ter expirado ou já foi utilizado. Solicite um novo.
                  </p>
                </div>
              </div>
              <Button asChild className="w-full bg-gradient-brand text-brand-foreground shadow-brand">
                <Link to="/esqueci-a-senha">Solicitar novo link</Link>
              </Button>
            </div>
          )}

          {linkState === "valid" && (
            <form onSubmit={submit} className="space-y-3">
              <div className="grid gap-1.5">
                <Label htmlFor="p">Nova senha</Label>
                <Input id="p" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p2">Confirmar nova senha</Label>
                <Input id="p2" type="password" minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                {confirm && !passwordsMatch && (
                  <p className="text-xs text-destructive">As senhas não coincidem</p>
                )}
                {passwordsMatch && (
                  <p className="flex items-center gap-1 text-xs text-green-500">
                    <CheckCircle2 className="h-3 w-3" /> Senhas conferem
                  </p>
                )}
              </div>

              {password && (
                <div className="rounded-lg border border-border/60 bg-surface-2 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Força da senha</span>
                    <span className="font-medium">{strengthLabel}</span>
                  </div>
                  <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-border">
                    <div className={`h-full transition-all ${strengthColor}`} style={{ width: `${(score / 4) * 100}%` }} />
                  </div>
                  <ul className="space-y-1 text-xs">
                    {checks.map((c) => (
                      <li key={c.label} className={c.ok ? "text-green-500" : "text-muted-foreground"}>
                        {c.ok ? "✓" : "○"} {c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !passwordsMatch}
                className="w-full bg-gradient-brand text-brand-foreground shadow-brand"
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar nova senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
