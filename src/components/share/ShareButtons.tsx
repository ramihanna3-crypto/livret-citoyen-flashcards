import { useState } from "react";
import { Mail, MessageSquare, Copy, Check } from "lucide-react";
import { useProgress } from "@/lib/useProgress";
import { uiStrings } from "@/lib/ui-strings";
import { languageById } from "@/lib/languages";
import { cn } from "@/lib/utils";

/**
 * Whole-site share buttons.
 *
 * Renders an explicit row of platform icons (WhatsApp, Telegram, Facebook,
 * Email, SMS, Copy link) — the user picked Option B over a hidden share
 * sheet because explicit visibility outperforms discoverability for this
 * audience.
 *
 * The shared message is pre-translated in the user's current UI language
 * (Arabic, Ukrainian, Dari, Pashto, Haitian Creole, Turkish, French) so
 * recipients see the invitation in a language they read. The URL is the
 * entire site, not the current page — a Telegram contact who taps the
 * link should land on the Home page, not a specific deck.
 *
 * Used in two places (controlled by `variant`):
 *   - "home"   — on the Home page, between deck picker and the counter
 *   - "finish" — on the deck-completion screen ("Bravo !"), with a softer,
 *                emotionally-timed copy ("did this help? share it…")
 */

const SITE_URL = "https://livret-citoyen.com";

// French baseline strings used alongside the per-language ones (the app
// renders bilingual UI throughout — French + the user's selected language).
const FR_PROMPT = "Partagez ce site";
const FR_FINISH_PROMPT = "Cette application vous a aidé ? Partagez-la avec une personne qui en a besoin.";
// Three-block layout for messenger apps. Each block on its own line with
// a blank line between, so the brand name reads as a header at the top and
// the URL reads as a clear call-to-action at the bottom — even though
// WhatsApp / Telegram / SMS can't actually center text, the separation
// gives the same visual structure the user asked for.
//
// Copy revised again per user request: name the source book "Livret du
// citoyen" explicitly in the body for credibility — recipients who
// recognize it as the official Ministère de l'Intérieur booklet for the
// assimilation interview understand this isn't a random app but a study
// tool for the actual published material. The gloss "le livret officiel"
// makes that authority signal legible to recipients who don't already
// know the book by name. Closing triplet "simple, gratuit, sans
// inscription" is short enough to skim.
const FR_MESSAGE =
  "Livret du Citoyen\n\n" +
  "Préparez l'entretien de nationalité française avec le Livret du citoyen, le livret officiel. Simple, gratuit, sans inscription.\n\n" +
  SITE_URL;
const FR_LINK_COPIED = "Lien copié";

type Variant = "home" | "finish";
type Props = { variant?: Variant };

// Brand SVGs (paths from simple-icons, MIT). Lucide doesn't ship these
// because of brand-mark licensing; inlining is the standard workaround.
function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.595 5.371l-.999 3.648 3.893-1.022zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 011.141.195v3.325a8.623 8.623 0 00-.653-.036 26.805 26.805 0 00-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 00-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  );
}

export function ShareButtons({ variant = "home" }: Props) {
  const { prefs } = useProgress();
  const ui = uiStrings(prefs.language);
  const lang = languageById(prefs.language);
  const [copied, setCopied] = useState(false);

  // Per-language message body for everything that takes a `?text=` param.
  // Falls back to French if a translation is missing.
  const message = ui.share_message || FR_MESSAGE;
  const messageEnc = encodeURIComponent(message);
  const urlEnc = encodeURIComponent(SITE_URL);
  const subjectEnc = encodeURIComponent("Livret du Citoyen");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // No clipboard permission (rare); silently no-op. The other 5 buttons
      // still work, so the user isn't blocked.
    }
  }

  // Each button: brand color on hover so the icons feel like the real apps
  // they open, but a neutral resting state so the row doesn't shout.
  const platforms = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${messageEnc}`,
      Icon: WhatsAppIcon,
      hoverClass: "hover:bg-[#25D366]/10 hover:text-[#25D366] focus-visible:bg-[#25D366]/10",
    },
    {
      key: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${urlEnc}&text=${messageEnc}`,
      Icon: TelegramIcon,
      hoverClass: "hover:bg-[#229ED9]/10 hover:text-[#229ED9] focus-visible:bg-[#229ED9]/10",
    },
    {
      key: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${urlEnc}`,
      Icon: FacebookIcon,
      hoverClass: "hover:bg-[#1877F2]/10 hover:text-[#1877F2] focus-visible:bg-[#1877F2]/10",
    },
    {
      key: "email",
      label: "Email",
      href: `mailto:?subject=${subjectEnc}&body=${messageEnc}`,
      Icon: Mail,
      hoverClass:
        "hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] focus-visible:bg-[var(--color-primary)]/10",
    },
    {
      key: "sms",
      label: "SMS",
      href: `sms:?&body=${messageEnc}`,
      Icon: MessageSquare,
      hoverClass:
        "hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] focus-visible:bg-[var(--color-primary)]/10",
    },
  ] as const;

  const buttonBase = cn(
    "inline-flex items-center justify-center w-11 h-11 rounded-full",
    "bg-[var(--color-card)] border border-[var(--color-border)]",
    "text-[var(--color-foreground)] transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40",
  );

  // Wrapper layout differs between the two surfaces:
  //   "home"   — generous top padding, sits below the marquee
  //   "finish" — tighter, sits below the "Recommencer / Retour" buttons
  const sectionClass = variant === "finish" ? "mt-6 space-y-3" : "pt-6 space-y-3";

  return (
    <section className={sectionClass} aria-label="Partage">
      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        {variant === "finish" ? FR_FINISH_PROMPT : FR_PROMPT}
        {" · "}
        <span dir={lang.dir} lang={lang.lang}>
          {variant === "finish" ? ui.share_finish_prompt : ui.share_prompt}
        </span>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {platforms.map(({ key, label, href, Icon, hoverClass }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Partager via ${label}`}
            className={cn(buttonBase, hoverClass)}
          >
            <Icon className="w-5 h-5" />
          </a>
        ))}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? FR_LINK_COPIED : "Copier le lien"}
          className={cn(
            buttonBase,
            "hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] focus-visible:bg-[var(--color-primary)]/10",
          )}
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>
      {copied && (
        <p
          className="text-center text-xs text-[var(--color-primary)]"
          aria-live="polite"
          dir={lang.dir}
          lang={lang.lang}
        >
          {FR_LINK_COPIED} · {ui.share_link_copied}
        </p>
      )}
    </section>
  );
}
