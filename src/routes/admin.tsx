import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import {
  adminDashboard,
  adminDeleteUser,
  adminSetUserActive,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Administração — WhatsLink" },
      {
        name: "description",
        content: "Painel administrativo do WhatsLink: usuários, links, cliques e planos.",
      },
      { property: "og:title", content: "Administração — WhatsLink" },
      {
        property: "og:description",
        content: "Painel administrativo do WhatsLink: usuários, links, cliques e planos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Data = Awaited<ReturnType<typeof adminDashboard>>;
type Tab = "dashboard" | "users" | "links" | "plans" | "reports";

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Usuários" },
  { id: "links", label: "Links" },
  { id: "plans", label: "Monetização" },
  { id: "reports", label: "Relatórios" },
];

function fmtDate(v: string) {
  return new Date(v).toLocaleDateString("pt-BR");
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-card-foreground">{value}</p>
    </div>
  );
}

function AdminPage() {
  const { user, loading } = useAuth();
  const load = useServerFn(adminDashboard);
  const setActive = useServerFn(adminSetUserActive);
  const removeUser = useServerFn(adminDeleteUser);

  const [data, setData] = useState<Data | null>(null);
  const [denied, setDenied] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [userQuery, setUserQuery] = useState("");
  const [linkQuery, setLinkQuery] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const d = await load({});
      setData(d as Data);
      setDenied(false);
    } catch {
      setDenied(true);
    }
  }

  useEffect(() => {
    if (loading || !user) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const users = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    const list = data?.users ?? [];
    return q ? list.filter((u) => (u.email ?? "").toLowerCase().includes(q)) : list;
  }, [data, userQuery]);

  const links = useMemo(() => {
    const q = linkQuery.trim().toLowerCase();
    const list = data?.links ?? [];
    return q
      ? list.filter(
          (l) =>
            l.code.toLowerCase().includes(q) ||
            l.url.toLowerCase().includes(q) ||
            String(l.owner).toLowerCase().includes(q),
        )
      : list;
  }, [data, linkQuery]);

  async function toggle(userId: string, active: boolean) {
    setBusy(true);
    await setActive({ data: { userId, active } });
    await refresh();
    setBusy(false);
  }

  async function destroy(userId: string, email: string | null) {
    if (!confirm(`Excluir definitivamente ${email ?? userId} e todos os seus links?`)) return;
    setBusy(true);
    try {
      await removeUser({ data: { userId } });
      await refresh();
    } catch {
      /* ignore */
    }
    setBusy(false);
  }

  if (loading) {
    return <main className="p-8 text-sm text-muted-foreground">Carregando…</main>;
  }

  if (!user || denied) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-lg font-bold text-card-foreground">Área restrita</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta página é exclusiva para administradores do WhatsLink.
          </p>
          <Link
            to={user ? "/meus-links" : "/admin-login"}
            className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            {user ? "Ir para Meus Links" : "Entrar como administrador"}
          </Link>

        </div>
      </main>
    );
  }

  const maxDay = Math.max(1, ...(data?.last14.map((d) => d.clicks) ?? [1]));

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Administração</h1>
        <Link to="/" className="text-sm text-muted-foreground underline">
          Voltar ao site
        </Link>
      </div>

      <nav className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl border px-3 py-1.5 text-sm transition-colors ${
              tab === t.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {!data ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando dados…</p>
      ) : (
        <div className="mt-6 space-y-6">
          {tab === "dashboard" && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Usuários" value={data.totals.users} />
                <Stat label="Links" value={data.totals.links} />
                <Stat label="Cliques" value={data.totals.clicks} />
                <Stat label="Usuários ativos" value={data.totals.activeUsers} />
              </div>
              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold text-card-foreground">Links mais acessados</h2>
                <ul className="mt-3 space-y-2">
                  {data.topLinks.map((l) => (
                    <li key={l.code} className="flex items-center justify-between text-sm">
                      <span className="truncate text-card-foreground">/{l.code}</span>
                      <span className="ml-3 shrink-0 text-muted-foreground">
                        {l.owner} · {l.clicks} cliques
                      </span>
                    </li>
                  ))}
                  {data.topLinks.length === 0 && (
                    <li className="text-sm text-muted-foreground">Nenhum link ainda.</li>
                  )}
                </ul>
              </section>
            </>
          )}

          {tab === "users" && (
            <section className="space-y-3">
              <input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Pesquisar por e-mail"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              {users.map((u) => (
                <div key={u.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">
                        {u.email ?? u.id}
                        {u.isAdmin && (
                          <span className="ml-2 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            admin
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Plano {u.plan} · {u.links} links · {u.clicks} cliques · desde{" "}
                        {fmtDate(u.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={busy}
                        onClick={() => toggle(u.id, !u.isActive)}
                        className="rounded-xl border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent disabled:opacity-60"
                      >
                        {u.isActive ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        disabled={busy || u.id === user.id}
                        onClick={() => destroy(u.id, u.email)}
                        className="rounded-xl border border-destructive px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-40"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  {data.links.filter((l) => l.owner === (u.email ?? u.id)).length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-border pt-3">
                      {data.links
                        .filter((l) => l.owner === (u.email ?? u.id))
                        .map((l) => (
                          <li key={l.id} className="flex justify-between text-xs text-muted-foreground">
                            <span className="truncate">/{l.code}</span>
                            <span>{l.clicks} cliques</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
              )}
            </section>
          )}

          {tab === "links" && (
            <section className="space-y-3">
              <input
                value={linkQuery}
                onChange={(e) => setLinkQuery(e.target.value)}
                placeholder="Pesquisar por slug, URL ou usuário"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Slug</th>
                      <th className="px-4 py-3">Usuário</th>
                      <th className="px-4 py-3">Destino</th>
                      <th className="px-4 py-3">Cliques</th>
                      <th className="px-4 py-3">Criado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((l) => (
                      <tr key={l.id} className="border-t border-border">
                        <td className="px-4 py-3 text-card-foreground">/{l.code}</td>
                        <td className="px-4 py-3 text-muted-foreground">{l.owner}</td>
                        <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
                          {l.url}
                        </td>
                        <td className="px-4 py-3 text-card-foreground">{l.clicks}</td>
                        <td className="px-4 py-3 text-muted-foreground">{fmtDate(l.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {links.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum link encontrado.</p>
              )}
            </section>
          )}

          {tab === "plans" && (
            <section className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Usuários Grátis" value={data.totals.free} />
                <Stat label="Usuários Pro" value={data.totals.pro} />
              </div>
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Usuário</th>
                      <th className="px-4 py-3">Plano</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((u) => (
                      <tr key={u.id} className="border-t border-border">
                        <td className="px-4 py-3 text-card-foreground">{u.email ?? u.id}</td>
                        <td className="px-4 py-3 uppercase text-muted-foreground">{u.plan}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {u.plan === "pro" ? "Assinatura ativa" : "Sem assinatura"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "reports" && (
            <section className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold text-card-foreground">
                  Cliques nos últimos 14 dias
                </h2>
                <div className="mt-4 flex h-32 items-end gap-1">
                  {data.last14.map((d) => (
                    <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-primary"
                        style={{ height: `${(d.clicks / maxDay) * 100}%`, minHeight: 2 }}
                        title={`${d.day}: ${d.clicks}`}
                      />
                      <span className="text-[10px] text-muted-foreground">{d.day.slice(8)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold text-card-foreground">
                  Usuários com mais cliques
                </h2>
                <ul className="mt-3 space-y-2">
                  {[...data.users]
                    .sort((a, b) => b.clicks - a.clicks)
                    .slice(0, 5)
                    .map((u) => (
                      <li key={u.id} className="flex justify-between text-sm">
                        <span className="truncate text-card-foreground">{u.email ?? u.id}</span>
                        <span className="text-muted-foreground">{u.clicks} cliques</span>
                      </li>
                    ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
