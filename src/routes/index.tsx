import { createFileRoute, Link } from "@tanstack/react-router";
import { LinkGenerator } from "@/components/whatslink/LinkGenerator";
import whatsLinkLogo from "@/assets/whatslink-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "WhatsLink — Gerador de link do WhatsApp em segundos" },
      {
        name: "description",
        content:
          "Crie um link wa.me personalizado com número, DDD e mensagem automática. Copie, compartilhe e gere o QR Code grátis.",
      },
      { property: "og:title", content: "WhatsLink — Gerador de link do WhatsApp" },
      {
        property: "og:description",
        content:
          "Gere seu link do WhatsApp com mensagem automática e QR Code. Rápido, grátis e sem cadastro.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "WhatsLink",
          applicationCategory: "UtilitiesApplication",
          description: "Gerador de links do WhatsApp com mensagem automática e QR Code.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
        }),
      },
    ],
  }),
});

const STEPS = [
  { n: "1", t: "Digite seu número", d: "Escolha o país e informe o número com DDD." },
  { n: "2", t: "Personalize a mensagem", d: "Escreva o texto que já vem pronto na conversa." },
  { n: "3", t: "Copie e compartilhe", d: "Use o link ou o QR Code onde você quiser." },
];

const USES = [
  "Instagram",
  "Facebook",
  "Cartão de visita",
  "Anúncios",
  "Seu site",
  "Atendimento ao cliente",
];

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-[image:var(--gradient-hero)] px-5 pb-20 pt-14 text-primary-foreground sm:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <img
            src={whatsLinkLogo.url}
            alt="WhatsLink"
            className="mx-auto h-24 w-24 rounded-2xl object-cover shadow-[var(--shadow-soft)] sm:h-28 sm:w-28"
          />
          <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
            Crie seu link do WhatsApp em segundos
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base opacity-90 sm:text-lg">
            Gere um link personalizado para compartilhar seu WhatsApp com clientes, amigos e nas
            redes sociais.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              to="/planos"
              className="inline-block rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-semibold hover:bg-primary-foreground/25"
            >
              Ver planos
            </Link>
            <Link
              to="/meus-links"
              className="inline-block rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-semibold hover:bg-primary-foreground/25"
            >
              Meus Links
            </Link>
          </div>
        </div>
      </section>


      <div className="mx-auto -mt-12 max-w-xl px-5">
        <LinkGenerator />
      </div>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-center text-2xl font-bold text-foreground">Como funciona?</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                {s.n}
              </div>
              <h3 className="mt-3 font-semibold text-card-foreground">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20">
        <div className="rounded-3xl bg-secondary p-6 sm:p-8">
          <h2 className="text-xl font-bold text-secondary-foreground">Onde usar seu link</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Um clique e a conversa já começa — sem salvar o número na agenda.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {USES.map((u) => (
              <li
                key={u}
                className="rounded-full bg-card px-4 py-2 text-sm font-medium text-card-foreground"
              >
                {u}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8 text-center text-xs text-muted-foreground">
        WhatsLink apenas gera o link oficial do WhatsApp. Nenhuma mensagem é enviada
        automaticamente.
      </footer>
    </main>
  );
}
