import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";

const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode() {
  return Array.from(
    { length: 6 },
    () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
  ).join("");
}

type Country = { code: string; label: string; flag: string; digits: number[] };

const COUNTRIES: Country[] = [
  { code: "55", label: "Brasil (+55)", flag: "🇧🇷", digits: [10, 11] },
  { code: "351", label: "Portugal (+351)", flag: "🇵🇹", digits: [9] },
  { code: "1", label: "EUA / Canadá (+1)", flag: "🇺🇸", digits: [10] },
  { code: "44", label: "Reino Unido (+44)", flag: "🇬🇧", digits: [10] },
  { code: "34", label: "Espanha (+34)", flag: "🇪🇸", digits: [9] },
  { code: "39", label: "Itália (+39)", flag: "🇮🇹", digits: [9, 10] },
  { code: "54", label: "Argentina (+54)", flag: "🇦🇷", digits: [10] },
];

function formatBR(digits: string) {
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function LinkGenerator() {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]!);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shortLink, setShortLink] = useState<string | null>(null);
  const [shortCopied, setShortCopied] = useState(false);
  const [shortening, setShortening] = useState(false);
  const [alias, setAlias] = useState("");
  const [editToken, setEditToken] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [aliasError, setAliasError] = useState<string | null>(null);


  const digits = phone.replace(/\D/g, "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!digits) {
      setError("Digite o seu número de telefone.");
      return;
    }
    if (!country.digits.includes(digits.length)) {
      setError(
        `Número inválido para ${country.label}. Use ${country.digits.join(" ou ")} dígitos com DDD.`,
      );
      return;
    }
    setError(null);
    const base = `https://wa.me/${country.code}${digits}`;
    setLink(message.trim() ? `${base}?text=${encodeURIComponent(message.trim())}` : base);
    setCopied(false);
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar. Copie o link manualmente.");
    }
  }

  async function copyShort() {
    if (!shortLink) return;
    try {
      await navigator.clipboard.writeText(shortLink);
      setShortCopied(true);
      setTimeout(() => setShortCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar. Copie o link manualmente.");
    }
  }

  async function shorten() {
    if (!link || shortening) return;
    setShortening(true);
    setError(null);
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomCode();
      const { error: insertError } = await supabase
        .from("short_links")
        .insert({ code, url: link });
      if (!insertError) {
        setShortLink(`${window.location.origin}/${code}`);
        setShortening(false);
        return;
      }
      if (insertError.code !== "23505") break;
    }
    setError("Não foi possível encurtar o link agora. Tente novamente.");
    setShortening(false);
  }

  function reset() {
    setLink(null);
    setShortLink(null);
    setPhone("");
    setMessage("");
    setError(null);
  }

  if (link) {
    return (
      <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <h2 className="text-lg font-semibold text-card-foreground">Seu link está pronto 🎉</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Compartilhe onde quiser — quem clicar abre uma conversa com você.
        </p>

        <div className="mt-5 break-all rounded-2xl bg-muted px-4 py-3 font-mono text-sm text-foreground">
          {link}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            onClick={copy}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            {copied ? "Link copiado!" : "Copiar link"}
          </button>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Abrir WhatsApp
          </a>
        </div>

        {shortLink ? (
          <div className="mt-4 rounded-2xl border border-border p-4">
            <p className="text-sm font-medium text-card-foreground">Link curto</p>
            <div className="mt-2 break-all rounded-xl bg-muted px-4 py-3 font-mono text-sm text-foreground">
              {shortLink}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                onClick={copyShort}
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                {shortCopied ? "Copiado!" : "Copiar"}
              </button>
              <a
                href={shortLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Abrir
              </a>
            </div>
          </div>
        ) : (
          <button
            onClick={shorten}
            disabled={shortening}
            className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-60"
          >
            {shortening ? "Encurtando..." : "Encurtar link"}
          </button>
        )}

        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-border p-5">
          <QRCodeCanvas value={shortLink ?? link} size={168} includeMargin />
          <p className="text-xs text-muted-foreground">Aponte a câmera para abrir a conversa</p>
        </div>

        <button
          onClick={reset}
          className="mt-5 w-full text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Gerar um novo link
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="country" className="text-sm font-medium text-card-foreground">
            País
          </label>
          <select
            id="country"
            value={country.code}
            onChange={(e) =>
              setCountry(COUNTRIES.find((c) => c.code === e.target.value) ?? COUNTRIES[0]!)
            }
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-primary"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="phone" className="text-sm font-medium text-card-foreground">
            Número com DDD
          </label>
          <div className="mt-1.5 flex items-center rounded-xl border border-input bg-background focus-within:border-primary">
            <span className="pl-4 text-base text-muted-foreground">+{country.code}</span>
            <input
              id="phone"
              inputMode="numeric"
              autoComplete="tel"
              placeholder={country.code === "55" ? "(85) 99999-9999" : "999999999"}
              value={country.code === "55" ? formatBR(digits) : phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 13))}
              className="w-full bg-transparent px-3 py-3 text-base text-foreground outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="message" className="text-sm font-medium text-card-foreground">
            Mensagem automática <span className="text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            id="message"
            rows={3}
            maxLength={500}
            placeholder="Olá! Vi seu link e gostaria de saber mais."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1.5 w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-primary"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-opacity hover:opacity-90"
        >
          Gerar meu link
        </button>
      </div>
    </form>
  );
}
