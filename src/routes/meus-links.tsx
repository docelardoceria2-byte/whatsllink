import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, usePlan } from "@/hooks/useAuth";

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

const ALIAS_RE = /^[a-zA-Z0-9_-]{3,32}$/;

function parseWa(url: string) {
  try {
    const u = new URL(url);
    return {
      phone: u.pathname.replace(/\D/g, ""),
      message: u.searchParams.get("text") ?? "",
    };
  } catch {
    return { phone: "", message: "" };
  }
}

function MeusLinksPage() {
  const { user, loading } = useAuth();
  const plan = usePlan(user?.id);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", phone: "", message: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    let active = true;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (active) setIsAdmin(!!data);
      });
    return () => {
      active = false;
    };
  }, [user]);


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

  function startEdit(r: Row) {
    const { phone, message } = parseWa(r.url);
    setEditingId(r.id);
    setForm({ code: r.code, phone, message });
    setFormError(null);
  }

  async function save(id: string) {
    if (saving) return;
    const code = form.code.trim();
    const digits = form.phone.replace(/\D/g, "");
    if (!ALIAS_RE.test(code)) {
      setFormError("Use de 3 a 32 caracteres: letras, números, hífen ou _ (sem espaços).");
      return;
    }
    if (digits.length < 8) {
      setFormError("Informe o número completo com código do país e DDD (só números).");
      return;
    }
    const base = `https://wa.me/${digits}`;
    const url = form.message.trim()
      ? `${base}?text=${encodeURIComponent(form.message.trim())}`
      : base;

    setSaving(true);
    setFormError(null);
    const { error } = await supabase.rpc("update_short_link", {
      _id: id,
      _code: code,
      _url: url,
    });
    setSaving(false);
    if (error) {
      setFormError(
        error.message?.includes("duplicate")
          ? "Esse nome já está em uso. Escolha outro."
          : "Não foi possível salvar as alterações. Tente novamente.",
      );
      return;
    }
    setRows((prev) => (prev ?? []).map((r) => (r.id === id ? { ...r, code, url } : r)));
    setEditingId(null);
  }

  const totalClicks = (rows ?? []).reduce((sum, r) => sum + (r.clicks ?? 0), 0);
  const topLink = (rows ?? []).reduce<Row | null>(
    (best, r) => (!best || r.clicks > best.clicks ? r : best),
    null,
  );

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-[image:var(--gradient-hero)] px-5 pb-16 pt-14 text-primary-foreground">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Meus Links</h1>
          <p className="mx-auto mt-3 max-w-lg text-base opacity-90">
            Acompanhe seus links personalizados e os cliques de cada um.
          </p>
          {!loading && user && (
            <p className="mt-3 text-sm opacity-90">
              Plano atual: {plan === "pro" ? "Pro" : "Grátis"}
            </p>
          )}
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

            {isAdmin && (
              <div className="mt-3 text-right">
                <Link to="/admin" className="text-sm font-semibold text-primary underline">
                  Abrir painel de administração
                </Link>
              </div>
            )}

            </div>

            {topLink && topLink.clicks > 0 && (
              <div className="mt-3 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <p className="text-sm text-muted-foreground">Link mais acessado</p>
                <p className="mt-1 font-semibold text-card-foreground">
                  /{topLink.code} · {topLink.clicks}{" "}
                  {topLink.clicks === 1 ? "clique" : "cliques"}
                </p>
              </div>
            )}

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
                        <button
                          onClick={() => (editingId === r.id ? setEditingId(null) : startEdit(r))}
                          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
                        >
                          {editingId === r.id ? "Cancelar edição" : "Editar"}
                        </button>
                        <Link
                          to="/link/$code"
                          params={{ code: r.code }}
                          className="rounded-xl border border-border bg-background px-4 py-2.5 text-center text-sm font-semibold text-foreground hover:bg-accent"
                        >
                          Estatísticas
                        </Link>
                      </div>

                      {editingId === r.id && (
                        <div className="mt-4 rounded-xl border border-border p-4">
                          <label className="text-sm font-medium text-card-foreground">
                            Nome personalizado
                          </label>
                          <div className="mt-1.5 flex items-center rounded-xl border border-input bg-background focus-within:border-primary">
                            <span className="pl-4 text-sm text-muted-foreground">/</span>
                            <input
                              value={form.code}
                              onChange={(e) => setForm({ ...form, code: e.target.value })}
                              className="w-full bg-transparent px-2 py-3 text-base text-foreground outline-none"
                            />
                          </div>

                          <label className="mt-3 block text-sm font-medium text-card-foreground">
                            Número do WhatsApp (com país e DDD)
                          </label>
                          <input
                            inputMode="numeric"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="5511999999999"
                            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-primary"
                          />

                          <label className="mt-3 block text-sm font-medium text-card-foreground">
                            Mensagem automática (opcional)
                          </label>
                          <input
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-primary"
                          />

                          {formError && (
                            <p className="mt-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                              {formError}
                            </p>
                          )}

                          <button
                            onClick={() => save(r.id)}
                            disabled={saving}
                            className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                          >
                            {saving ? "Salvando..." : "Salvar alterações"}
                          </button>

                          {plan !== "pro" && (
                            <div className="mt-4 rounded-xl bg-muted p-4 text-center">
                              <p className="text-sm text-muted-foreground">
                                Cores, foto/logo, botões extras e QR Code personalizado fazem parte
                                do plano Pro.
                              </p>
                              <Link
                                to="/planos"
                                className="mt-3 inline-block rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                              >
                                Assinar Pro
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
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
