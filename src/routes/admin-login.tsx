import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin-login")({
  component: AdminLoginPage,
  head: () => ({
    meta: [
      { title: "Acesso administrativo — WhatsLink" },
      {
        name: "description",
        content: "Entrada exclusiva para administradores do painel SaaS do WhatsLink.",
      },
      { property: "og:title", content: "Acesso administrativo — WhatsLink" },
      {
        property: "og:description",
        content: "Entrada exclusiva para administradores do painel SaaS do WhatsLink.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  async function isAdmin(userId: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return !!data;
  }

  // Se já estiver logado, verifica se é admin e encaminha ao painel.
  useEffect(() => {
    if (loading || !user) return;
    let active = true;
    setChecking(true);
    isAdmin(user.id).then((ok) => {
      if (!active) return;
      setChecking(false);
      if (ok) navigate({ to: "/admin", replace: true });
      else setMsg("Esta conta não tem permissão de administrador.");
    });
    return () => {
      active = false;
    };
  }, [loading, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      setMsg("E-mail ou senha inválidos.");
      return;
    }
    const ok = data.user ? await isAdmin(data.user.id) : false;
    setBusy(false);
    if (ok) {
      navigate({ to: "/admin", replace: true });
    } else {
      await supabase.auth.signOut();
      setMsg("Esta conta não tem permissão de administrador.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Área administrativa
        </p>
        <h1 className="mt-1 text-xl font-bold text-card-foreground">Acesso ADM</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entrada exclusiva para administradores do sistema WhatsLink.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail do administrador"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy || checking}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy || checking ? "Verificando…" : "Entrar no painel"}
          </button>
        </form>

        {msg && <p className="mt-3 text-sm text-destructive">{msg}</p>}

        <div className="mt-5 flex justify-between text-xs text-muted-foreground">
          <Link to="/" className="underline">
            Voltar ao site
          </Link>
          <Link to="/auth" className="underline">
            Login de usuário
          </Link>
        </div>
      </div>
    </main>
  );
}
