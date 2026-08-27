import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { QRCodeCanvas } from "qrcode.react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, usePlan } from "@/hooks/useAuth";

export const Route = createFileRoute("/link/$code")({
  component: LinkStatsPage,
  head: () => ({
    meta: [
      { title: "Estatísticas do link — WhatsLink" },
      {
        name: "description",
        content: "Veja o total de cliques e o desempenho dos últimos 7 dias do seu link do WhatsApp.",
      },
      { property: "og:title", content: "Estatísticas do link — WhatsLink" },
      {
        property: "og:description",
        content: "Total de cliques e gráfico dos últimos 7 dias do seu link personalizado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type LinkRow = { id: string; code: string; url: string; clicks: number; created_at: string };

function last7Days() {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function LinkStatsPage() {
  const { code } = Route.useParams();
  const { user, loading } = useAuth();
  const plan = usePlan(user?.id);
  const [row, setRow] = useState<LinkRow | null>(null);
  const [daily, setDaily] = useState<Record<string, number>>({});
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("short_links")
        .select("id, code, url, clicks, created_at")
        .eq("user_id", user.id)
        .eq("code", code)
        .maybeSingle();
      if (!active) return;
      if (!data) {
        setNotFound(true);
        return;
      }
      setRow(data as LinkRow);
      const { data: days } = await supabase
        .from("link_click_days")
        .select("day, clicks")
        .eq("link_id", (data as LinkRow).id);
      if (!active) return;
      const map: Record<string, number> = {};
      (days ?? []).forEach((d) => {
        map[d.day as string] = d.clicks as number;
      });
      setDaily(map);
    })();
    return () => {
      active = false;
    };
  }, [user, code]);

  const chart = last7Days().map((d) => ({
    dia: `${d.slice(8, 10)}/${d.slice(5, 7)}`,
    cliques: daily[d] ?? 0,
  }));

  const shortUrl =
    typeof window !== "undefined" ? `${window.location.origin}/${code}` : `/${code}`;

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-[image:var(--gradient-hero)] px-5 pb-16 pt-14 text-primary-foreground">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">Estatísticas de /{code}</h1>
          <p className="mt-2 text-sm opacity-90">Acompanhe os cliques do seu link.</p>
        </div>
      </section>

      <div className="mx-auto -mt-10 max-w-3xl px-5 pb-20">
        {loading ? (
          <div className="rounded-2xl bg-card p-6 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
            Carregando...
          </div>
        ) : !user ? (
          <div className="rounded-2xl bg-card p-6 text-center shadow-[var(--shadow-card)]">
            <p className="text-sm text-muted-foreground">Entre na sua conta para ver as estatísticas.</p>
            <Link
              to="/auth"
              className="mt-4 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Entrar
            </Link>
          </div>
        ) : notFound ? (
          <div className="rounded-2xl bg-card p-6 text-center shadow-[var(--shadow-card)]">
            <p className="text-sm text-muted-foreground">Link não encontrado na sua conta.</p>
            <Link
              to="/meus-links"
              className="mt-4 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Voltar para Meus Links
            </Link>
          </div>
        ) : !row ? (
          <div className="rounded-2xl bg-card p-6 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
            Carregando estatísticas...
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
                <p className="text-sm text-muted-foreground">Total de cliques</p>
                <p className="mt-1 text-2xl font-bold text-card-foreground">{row.clicks}</p>
              </div>
              <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
                <p className="text-sm text-muted-foreground">Cliques hoje</p>
                <p className="mt-1 text-2xl font-bold text-card-foreground">
                  {daily[new Date().toISOString().slice(0, 10)] ?? 0}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <p className="text-sm font-semibold text-card-foreground">Últimos 7 dias</p>
              <div className="mt-4 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="dia" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="cliques" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <p className="text-sm font-semibold text-card-foreground">QR Code do link</p>
              {plan === "pro" ? (
                <div className="mt-4 flex justify-center rounded-xl bg-background p-4">
                  <QRCodeCanvas value={shortUrl} size={168} />
                </div>
              ) : (
                <div className="mt-3 rounded-xl bg-muted p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    O QR Code personalizado está disponível no plano Pro.
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

            <div className="mt-6 text-center text-sm">
              <Link to="/meus-links" className="text-muted-foreground underline">
                Voltar para Meus Links
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
