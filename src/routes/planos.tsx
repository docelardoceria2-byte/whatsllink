import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, usePlan } from "@/hooks/useAuth";

export const Route = createFileRoute("/planos")({
  component: PlanosPage,
  head: () => ({
    meta: [
      { title: "Planos WhatsLink — Grátis e Pro por R$ 9,90/mês" },
      {
        name: "description",
        content:
          "Compare o plano Grátis e o Pro do WhatsLink: sem marca, cores e logo, QR Code personalizado e estatísticas de cliques.",
      },
      { property: "og:title", content: "Planos WhatsLink — Grátis e Pro" },
      {
        property: "og:description",
        content:
          "Escolha entre o plano Grátis e o Pro do WhatsLink por R$ 9,90/mês com personalização completa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/planos" }],
  }),
});

const FREE = [
  "Criar link personalizado",
  "Página básica",
  "WhatsApp e redes sociais",
  "Recursos limitados",
];

const PRO = [
  "Sem a marca do WhatsLink",
  "Cores, foto e logo personalizados",
  "Mais botões e links",
  "QR Code personalizado",
  "Estatísticas de cliques",
  "Mais opções de personalização da página",
];

function PlanosPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const plan = usePlan(user?.id);

  function assinarPro() {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    window.alert("Pagamento em breve! Sua conta continua no plano Grátis por enquanto.");
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-[image:var(--gradient-hero)] px-5 pb-16 pt-14 text-primary-foreground">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Planos do WhatsLink</h1>
          <p className="mx-auto mt-3 max-w-lg text-base opacity-90">
            Comece grátis e faça upgrade quando quiser mais personalização.
          </p>
          {!loading && (
            <p className="mt-4 text-sm opacity-90">
              {user
                ? `Seu plano atual: ${plan === "pro" ? "Pro" : "Grátis"}`
                : "Entre para acompanhar seu plano."}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto -mt-10 grid max-w-3xl gap-4 px-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-bold text-card-foreground">Grátis</h2>
          <p className="mt-1 text-2xl font-bold text-card-foreground">R$ 0</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {FREE.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          <div className="mt-6 text-sm font-medium text-muted-foreground">
            {plan === "free" && user ? "Plano ativo" : "Incluso ao criar sua conta"}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-primary bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-bold text-card-foreground">Pro</h2>
          <p className="mt-1 text-2xl font-bold text-card-foreground">
            R$ 9,90
            <span className="text-sm font-medium text-muted-foreground">/mês</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {PRO.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          <button
            onClick={assinarPro}
            disabled={plan === "pro"}
            className="mt-6 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {plan === "pro" ? "Plano ativo" : "Assinar Pro"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-10 text-center text-sm">
        <Link to="/" className="text-muted-foreground underline">
          Voltar ao gerador de links
        </Link>
        {user && (
          <button
            onClick={() => supabase.auth.signOut()}
            className="ml-4 text-muted-foreground underline"
          >
            Sair
          </button>
        )}
      </div>
    </main>
  );
}
