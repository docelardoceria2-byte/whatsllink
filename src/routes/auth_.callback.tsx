import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth_/callback")({
  ssr: false,
  component: AuthCallbackPage,
  head: () => ({
    meta: [
      { title: "Entrando… — WhatsLink" },
      { name: "description", content: "Finalizando seu acesso ao WhatsLink." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Entrando — WhatsLink" },
      { property: "og:description", content: "Finalizando seu acesso ao WhatsLink." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const errorDescription =
        url.searchParams.get("error_description") ?? hash.get("error_description");

      if (errorDescription) {
        if (!cancelled) setError(errorDescription);
        return;
      }

      const code = url.searchParams.get("code");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        let session = (await supabase.auth.getSession()).data.session;
        if (!session) {
          session = await new Promise((resolve) => {
            const timeout = window.setTimeout(() => {
              subscription.unsubscribe();
              resolve(null);
            }, 5000);
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
              (event, nextSession) => {
                if (event !== "SIGNED_IN" || !nextSession) return;
                window.clearTimeout(timeout);
                subscription.unsubscribe();
                resolve(nextSession);
              },
            );
          });
        }
        if (cancelled) return;

        if (session) {
          const saved = sessionStorage.getItem("whatslink:after-login");
          sessionStorage.removeItem("whatslink:after-login");
          const dest = saved && saved.startsWith("/") && !saved.startsWith("//") ? saved : "/planos";
          window.history.replaceState({}, "", "/auth/callback");
          navigate({ to: dest });
        } else {
          setError("Não foi possível confirmar sua sessão. Tente entrar novamente.");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Falha ao entrar.");
      }
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 text-center">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {error ? "Não foi possível entrar" : "Entrando…"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "Estamos finalizando seu acesso, aguarde um instante."}
        </p>
        {error && (
          <a
            href="/auth"
            className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Voltar para o acesso
          </a>
        )}
      </div>
    </main>
  );
}
