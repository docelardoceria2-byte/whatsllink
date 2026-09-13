import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/$code")({
  loader: async ({ params }) => {
    const { data, error } = await supabase.rpc("resolve_short_link", { _code: params.code });
    const target = Array.isArray(data) ? data[0]?.url : null;
    if (error || !target) return { notFound: true as const };
    throw redirect({ href: target });
  },
  component: ShortLinkPage,
  head: () => ({
    meta: [
      { title: "Redirecionando… — WhatsLink" },
      { name: "description", content: "Abrindo a conversa do WhatsApp pelo seu link curto." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Redirecionando — WhatsLink" },
      { property: "og:description", content: "Abrindo a conversa do WhatsApp pelo seu link curto." },
    ],
  }),
});

function ShortLinkPage() {
  // Retorno de login (Google) nunca deve cair aqui
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { search, hash } = window.location;
    if (/(access_token|refresh_token|provider_token|[?&#]code=|error_description)/.test(search + hash)) {
      window.location.replace(`/auth/callback${search || ""}${hash || ""}`);
    }
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 text-center">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Link não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este link curto não existe ou expirou.
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Criar um novo link
        </a>
      </div>
    </main>
  );
}
