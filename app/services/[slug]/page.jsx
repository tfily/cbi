import { getServiceBySlug, getServiceSlugs } from "../../../lib/wordpress";
import Link from "next/link";
import Image from "next/image";
import AvailabilityPanel from "../../../components/AvailabilityPanel";

function cleanHtml(str) {
  const noTags = String(str || "").replace(/<[^>]+>/g, "");
  return noTags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&rsquo;|&#8217;/g, "’")
    .replace(/&ldquo;|&#8220;/g, "“")
    .replace(/&rdquo;|&#8221;/g, "”")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&ecirc;/g, "ê")
    .replace(/&agrave;/g, "à")
    .replace(/&ccedil;/g, "ç");
}

function formatEuroLabel(value) {
  if (value == null || value === "") return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (raw.includes("€")) return raw;
  if (/eur/i.test(raw)) return raw.replace(/eur/gi, "€");
  const normalized = raw.replace(",", ".");
  const numeric = Number(normalized);
  if (!Number.isNaN(numeric)) {
    const fixed = Number.isInteger(numeric)
      ? String(numeric)
      : numeric.toFixed(2).replace(/\.00$/, "").replace(".", ",");
    return `${fixed}€`;
  }
  return `${raw}€`;
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getPackPrices(meta) {
  if (!meta) return [];
  const packs = [];
  Object.entries(meta).forEach(([key, value]) => {
    if (!value) return;
    const patterns = [
      /^cbi_price_pack_(\d+)$/i,
      /^cbi_pack_(\d+)_price$/i,
      /^cbi_price_(\d+)x?$/i,
      /^price_pack_(\d+)$/i,
      /^pack_(\d+)_price$/i,
    ];
    for (const pattern of patterns) {
      const match = key.match(pattern);
      if (match) {
        packs.push({ size: Number(match[1]), value: String(value) });
        break;
      }
    }
  });
  return packs.filter((p) => p.size > 1).sort((a, b) => a.size - b.size);
}

export async function generateStaticParams() {
  const slugs = await getServiceSlugs().catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const service = await getServiceBySlug(resolvedParams.slug).catch(() => null);
  if (!service) {
    return {};
  }
  const title = cleanHtml(service.title.rendered);
  return {
    title: `${title} - Conciergerie by Isa`,
    description: cleanHtml(service.excerpt?.rendered || ""),
  };
}

export default async function ServicePage({ params }) {
  const resolvedParams = await params;
  const service = await getServiceBySlug(resolvedParams.slug).catch(() => null);

  if (!service) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-4">Service introuvable</h1>
        <p className="mb-4">Le service que vous recherchez n’existe pas ou n’est plus disponible.</p>
        <Link href="/" className="text-amber-800 hover:underline text-sm">
          Retour à l’accueil
        </Link>
      </main>
    );
  }

  // Featured image from WordPress (_embed)
  const media =
    service._embedded?.["wp:featuredmedia"] &&
    service._embedded["wp:featuredmedia"][0];

  const heroUrl =
    media?.media_details?.sizes?.large?.source_url ||
    media?.media_details?.sizes?.medium_large?.source_url ||
    media?.source_url ||
    null;
  const unitPrice = service.meta?.cbi_price || service.meta?.price || "";
  const feePrice =
    service.meta?.cbi_service_fee ||
    service.meta?.cbi_booking_fee ||
    (normalizeKey(cleanHtml(service.title.rendered)) === "reservation de transports"
      ? "5"
      : "");
  const priceType = String(service.meta?.cbi_price_kind || "").toLowerCase();
  const priceDisplay =
    ((priceType === "fee" || !unitPrice) && feePrice)
      ? `Frais de service : ${formatEuroLabel(feePrice)}`
      : unitPrice
        ? `Prix unitaire : ${formatEuroLabel(unitPrice)}`
        : "";
  const packPrices = getPackPrices(service.meta);
  const serviceTitle = cleanHtml(service.title.rendered);
  const excerptHtml = service.excerpt?.rendered || "";
  const contentHtml = service.content?.rendered || "";

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <section className="border-b border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <p className="text-xs text-neutral-500 mb-4">
            <Link href="/" className="hover:underline">
              Accueil
            </Link>{" "}
            / Service
          </p>

          <div className="grid gap-8 md:grid-cols-[1.08fr_0.92fr] md:items-start">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-800">
                Service à la carte
              </p>
              <h1 className="mb-3 text-3xl font-bold text-neutral-950 md:text-5xl">
                {serviceTitle}
              </h1>

              {priceDisplay ? (
                <p className="mb-2 text-sm font-semibold text-amber-800">{priceDisplay}</p>
              ) : null}
              {packPrices.length > 0 ? (
                <p className="mb-5 text-sm font-semibold text-neutral-600">
                  {packPrices.map((p) => `Pack ${p.size}: ${p.value}`).join(" · ")}
                </p>
              ) : null}

              {excerptHtml ? (
                <div
                  className="prose prose-sm mb-6 max-w-none text-sm text-neutral-700 md:text-base"
                  dangerouslySetInnerHTML={{ __html: excerptHtml }}
                />
              ) : null}

              <div className="flex flex-wrap gap-3">
                <a
                  href={`/?service=${encodeURIComponent(resolvedParams.slug)}#contact`}
                  className="inline-flex items-center rounded-full bg-amber-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800"
                >
                  Demander ce service
                </a>
                <a
                  href="#availability"
                  className="inline-flex items-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
                >
                  Voir les disponibilités
                </a>
              </div>
            </div>

            <div className="space-y-4">
              {heroUrl ? (
                <div className="relative h-[360px] overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm md:h-[440px]">
                  <Image
                    src={heroUrl}
                    alt={serviceTitle}
                    fill
                    className="object-cover object-center"
                    priority
                  />
                </div>
              ) : null}

              <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-neutral-950">
                  Bon à savoir
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      Format
                    </p>
                    <p className="mt-2 text-sm text-neutral-800">
                      Intervention ponctuelle ou récurrente selon votre besoin
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      Organisation
                    </p>
                    <p className="mt-2 text-sm text-neutral-800">
                      Cadre validé avec vous avant toute intervention
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      Zone
                    </p>
                    <p className="mt-2 text-sm text-neutral-800">
                      Paris et proche couronne
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-[1fr_320px] md:items-start">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-5 text-2xl font-semibold text-neutral-950">
              Détails de la prestation
            </h2>
            <div className="prose prose-sm max-w-none text-neutral-800">
              <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-neutral-950">
                Cette prestation vous convient si…
              </h3>
              <ul className="space-y-3 text-sm text-neutral-700">
                <li>Vous voulez déléguer une mission précise sans perdre de temps.</li>
                <li>Vous avez besoin d’un cadre simple, clair et réactif.</li>
                <li>Vous souhaitez un service souple, ponctuel ou récurrent.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-neutral-950">
                Besoin d’un échange rapide ?
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-neutral-700">
                Décrivez votre contexte et nous revenons vers vous pour confirmer
                le bon format, le tarif et la disponibilité la plus adaptée.
              </p>
              <a
                href={`/?service=${encodeURIComponent(resolvedParams.slug)}#contact`}
                className="inline-flex items-center rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
              >
                Demander ce service
              </a>
            </div>
          </aside>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="space-y-6">
          <AvailabilityPanel slug={resolvedParams.slug} itemType="service" />
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="mb-2 text-xl font-semibold text-neutral-950">
                  Prêt à nous confier cette demande ?
                </h2>
                <p className="text-sm leading-relaxed text-neutral-600">
                  Utilisez le formulaire pour préciser votre besoin, votre date
                  idéale et toute contrainte utile.
                </p>
              </div>
              <a
                href={`/?service=${encodeURIComponent(resolvedParams.slug)}#contact`}
                className="inline-flex items-center rounded-full bg-amber-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800"
              >
                Demander ce service
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
