import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Entrar — WhatsLink" },
      {
        name: "description",
        content: "Acesse sua conta WhatsLink para gerenciar seus links e seu plano.",
      },
      { property: "og:title", content: "Entrar — WhatsLink" },
      {
        property: "og:description",
        content: "Acesse sua conta WhatsLink para gerenciar seus links e seu plano.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/planos" });
  }, [loading, session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fn =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/planos` },
          });
    const { error } = await fn;
    setBusy(false);
    if (error) setMsg(error.message);
    else if (mode === "signup") setMsg("Conta criada! Verifique seu e-mail para confirmar.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-bold text-card-foreground">
          {mode === "login" ? "Entrar no WhatsLink" : "Criar conta"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua conta começa no plano Grátis.
        </p>

        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setMsg(null);
            try {
              sessionStorage.setItem("whatslink:after-login", "/planos");
            } catch {
              /* ignore */
            }
            const result = await lovable.auth.signInWithOAuth("google", {
              redirect_uri: `${window.location.origin}/auth/callback`,
            });
            if (result.error) {
              setBusy(false);
              setMsg("Não foi possível entrar com o Google. Tente novamente.");
              return;
            }
            if (result.redirected) return;
            navigate({ to: "/planos" });
          }}
          className="mt-5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
        >
          Continuar com Google
        </button>


        <div className="my-4 text-center text-xs text-muted-foreground">ou</div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-sm text-muted-foreground underline"
        >
          {mode === "login" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
        </button>

        <div className="mt-5 text-center">
          <Link to="/" className="text-xs text-muted-foreground underline">
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
