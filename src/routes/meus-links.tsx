import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/meus-links")({
  component: MeusLinksPage,
  head: () => ({
    meta: [
      { title: "Meus Links — Painel de cliques do WhatsLink" },
      {
        name: "description",
        content:
          "Acompanhe seus links personalizados do WhatsApp: nome, URL completa, total de cliques e data de criação.",
      },
      { property: "og:title", content: "Meus Links — WhatsLink" },
      {
        property: "og:description",
        content: "Painel com todos os seus links do WhatsApp e a contagem de cliques.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Row = {
  id: string;
  code: string;
  url: string;
  clicks: number;
  created_at: string;
};

function MeusLinksPage() {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRows(null);
      return;
    }
    let active = true;
    supabase
      .from("short_links")
      .select("id, code, url, clicks, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) setRows((data as Row[]) ?? []);
      });
    return () => {
      active = false;
    };
  }, [user]);

  async function copy(shortUrl: string, id: string) {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  const totalClicks = (rows ?? []).reduce((sum, r) => sum + (r.clicks ?? 0), 0);

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-[image:var(--gradient-hero)] px-5 pb-16 pt-14 text-primary-foreground">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Meus Links</h1>
          <p className="mx-auto mt-3 max-w-lg text-base opacity-90">
            Acompanhe seus links personalizados e os cliques de cada um.
          </p>
        </div>
      </section>

      <div className="mx-auto -mt-10 max-w-3xl px-5 pb-20">
        {loading ? (
          <div className="rounded-2xl bg-card p-6 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
            Carregando...
          </div>
        ) : !user ? (
          <div className="rounded-2xl bg-card p-6 text-center shadow-[var(--shadow-card)]">
            <p className="text-sm text-muted-foreground">
              Entre na sua conta para ver os links que você criou.
            </p>
            <Link
              to="/auth"
              className="mt-4 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Entrar
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
                <p className="text-sm text-muted-foreground">Total de links</p>
                <p className="mt-1 text-2xl font-bold text-card-foreground">
                  {rows ? rows.length : "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
                <p className="text-sm text-muted-foreground">Total de cliques</p>
                <p className="mt-1 text-2xl font-bold text-card-foreground">
                  {rows ? totalClicks : "—"}
                </p>
              </div>
            </div>

            {rows === null ? (
              <p className="mt-6 text-sm text-muted-foreground">Carregando seus links...</p>
            ) : rows.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Você ainda não criou nenhum link curto com a sua conta.
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Criar meu primeiro link
                </Link>
              </div>
            ) : (
              <ul className="mt-6 grid gap-3">
                {rows.map((r) => {
                  const shortUrl =
                    typeof window !== "undefined"
                      ? `${window.location.origin}/${r.code}`
                      : `/${r.code}`;
                  return (
                    <li
                      key={r.id}
                      className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-card-foreground">/{r.code}</p>
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                          {r.clicks} {r.clicks === 1 ? "clique" : "cliques"}
                        </span>
                      </div>
                      <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                        {shortUrl}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">{r.url}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Criado em {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button
                          onClick={() => copy(shortUrl, r.id)}
                          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
                        >
                          {copied === r.id ? "Copiado!" : "Copiar link"}
                        </button>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:opacity-90"
                        >
                          Abrir link
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}
