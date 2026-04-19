import {
  getServices,
  getLatestNews,
  getSubscriptions,
  getInfoBoxes,
  getSiteInfo,
  getAboutPage,
} from "../lib/wordpress";
import { getVisibleProviders } from "../data/providers";
import ContactForm from "../components/ContactForm";
import { Suspense } from "react";
import Image from "next/image";

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

function getServicePriceDisplay(service) {
  const title = cleanHtml(service?.title?.rendered || "");
  const normalizedTitle = normalizeKey(title);
  const unitPrice = service?.meta?.cbi_price || service?.meta?.price || "";
  const feePrice =
    service?.meta?.cbi_service_fee ||
    service?.meta?.cbi_booking_fee ||
    (normalizedTitle === "reservation de transports" ? "5" : "");
  const type = String(service?.meta?.cbi_price_kind || "").toLowerCase();
  if ((type === "fee" || !unitPrice) && feePrice) {
    return `Frais de service : ${formatEuroLabel(feePrice)}`;
  }
  if (unitPrice) {
    return `Prix unitaire : ${formatEuroLabel(unitPrice)}`;
  }
  return "";
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
  return packs
    .filter((p) => p.size > 1)
    .sort((a, b) => a.size - b.size)
    .map((p) => `Pack ${p.size}: ${p.value}`);
}

function isPlaceholderNewsItem(item) {
  const title = normalizeKey(cleanHtml(item?.title?.rendered || ""));
  const excerpt = normalizeKey(cleanHtml(item?.excerpt?.rendered || ""));
  const content = normalizeKey(cleanHtml(item?.content?.rendered || ""));
  const text = `${title} ${excerpt} ${content}`
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return true;
  const placeholderPhrases = [
    "hello world",
    "bonjour tout le monde",
    "bienvenue sur wordpress",
    "welcome to wordpress",
    "modifiez ou supprimez",
    "edit or delete it",
    "start writing",
  ];
  if (placeholderPhrases.some((phrase) => text.includes(phrase))) return true;
  if (title === "hello world" || title === "bonjour tout le monde") return true;
  return false;
}

function pickSignatureSubscriptionSlug(subscriptions) {
  const items = Array.isArray(subscriptions) ? subscriptions : [];
  if (!items.length) return "premium";

  const byPrice = items.find((sub) => {
    const price = String(sub?.meta?.cbi_price || "")
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    const numeric = Number(price);
    return !Number.isNaN(numeric) && numeric === 299;
  });
  if (byPrice?.slug) return byPrice.slug;

  const byLabel = items.find((sub) => {
    const label = normalizeKey(cleanHtml(sub?.title?.rendered || ""));
    return label.includes("proactif") || label.includes("offre signature");
  });
  if (byLabel?.slug) return byLabel.slug;

  return items[0]?.slug || "premium";
}

function getSignatureOfferText(subscriptions, signatureSlug) {
  const items = Array.isArray(subscriptions) ? subscriptions : [];
  const signature = items.find((sub) => sub?.slug === signatureSlug) || items[0];
  if (!signature) return "";

  const candidates = [
    signature?.meta?.cbi_signature_pitch,
    signature?.meta?.cbi_offer_text,
    signature?.excerpt?.rendered,
    signature?.content?.rendered,
  ];

  for (const candidate of candidates) {
    const cleaned = cleanHtml(candidate).replace(/\s+/g, " ").trim();
    if (cleaned) return cleaned;
  }

  return "";
}

export default async function HomePage({ searchParams }) {
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
  const resolvedSearchParams = (await searchParams) || {};
  const customRequestParam =
    typeof resolvedSearchParams.custom_request === "string"
      ? resolvedSearchParams.custom_request
      : Array.isArray(resolvedSearchParams.custom_request)
        ? resolvedSearchParams.custom_request[0]
        : "";
  const isCustomRequestActive =
    customRequestParam === "1" || customRequestParam === "2";

  if (maintenanceMode) {
    const aboutPage = await getAboutPage().catch(() => null);
    const excerpt = aboutPage?.excerpt?.rendered || "";
    const title = aboutPage?.title?.rendered
      ? cleanHtml(aboutPage.title.rendered)
      : "À propos";

    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-900">
        <section className="relative overflow-hidden border-b border-neutral-200">
          <div
            className="absolute inset-0 z-0 bg-no-repeat bg-center bg-contain"
            style={{
              backgroundImage: "url('/hero-bg.png')",
            }}
          />
          <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#f3e0bc]/95 via-[#e0c38f]/85 to-[#cba26a]/90" />
          <div className="relative z-20 max-w-3xl mx-auto px-4 py-20 md:py-28 text-center space-y-6">
            <p className="uppercase tracking-[0.4em] text-[11px] text-amber-800 font-semibold">
              Maintenance en cours !
            </p>
            {/* <p className="text-4xl md:text-5xl font-bold text-neutral-900">
              Site temporairement indisponible
            </p> */}
            {excerpt ? (
              <div
                className="text-sm md:text-base text-neutral-800 prose prose-sm max-w-none mx-auto"
                dangerouslySetInnerHTML={{ __html: excerpt }}
              />
            ) : (
              <p className="text-sm text-neutral-700">
                Ajoutez un extrait à la page "À propos" pour l’afficher ici.
              </p>
            )}
          </div>
        </section>
      </main>
    );
  }

  const [services, news, subscriptions, infoBoxes, siteInfo] = await Promise.all([
    getServices().catch(() => []),
    getLatestNews(2).catch(() => []),
    getSubscriptions().catch(() => []),
    getInfoBoxes().catch(() => []),
    getSiteInfo().catch(() => ({ name: "Conciergerie by Isa", description: "" })),
  ]);
  const visibleNews = (news || []).filter((item) => !isPlaceholderNewsItem(item));
  const providerCategories = getVisibleProviders();
  const signatureSubscriptionSlug = pickSignatureSubscriptionSlug(subscriptions);
  const signatureOfferText =
    getSignatureOfferText(subscriptions, signatureSubscriptionSlug) ||
    "Courses, déplacements, animaux, réservations : tout est pris en charge avec discrétion et efficacité.";

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <section className="relative overflow-hidden border-b border-neutral-200">
        <div
          className="absolute inset-0 z-0 bg-no-repeat bg-center bg-contain"
          style={{
            backgroundImage: "url('/hero-bg.png')",
          }}
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#f5e7ca]/95 via-[#ead8b1]/88 to-[#d3ab70]/88" />

        <div className="relative z-20 max-w-5xl mx-auto px-4 py-16 md:py-24">
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] items-start">
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-900">
                  Conciergerie privée à Paris
                </p>
                <h1 className="max-w-2xl text-3xl font-bold leading-tight text-neutral-950 md:text-5xl">
                  Simplifier votre quotidien, avec discrétion et précision.
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-neutral-800 md:text-base">
                  Courses, animaux, intendance, déplacements, réservations :
                  Conciergerie by Isa vous accompagne à Paris et en proche
                  couronne avec un service souple, fiable et humain.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <a
                  href="/#contact"
                  className="inline-flex items-center rounded-full bg-amber-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800"
                >
                  Parler de votre besoin
                </a>
                <a
                  href="/#services"
                  className="inline-flex items-center rounded-full border border-amber-700 px-5 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-50"
                >
                  Voir les services
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                    Zone
                  </p>
                  <p className="mt-2 text-sm font-medium text-neutral-900">
                    Paris et proche couronne
                  </p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                    Réponse
                  </p>
                  <p className="mt-2 text-sm font-medium text-neutral-900">
                    Retour rapide et suivi clair
                  </p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                    Format
                  </p>
                  <p className="mt-2 text-sm font-medium text-neutral-900">
                    Ponctuel ou récurrent
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-amber-900/15 bg-white/80 p-6 shadow-sm backdrop-blur md:p-7">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-800">
                  Offre signature
                </p>
                <h2 className="mb-3 text-2xl font-bold text-neutral-950 md:text-3xl">
                  Un quotidien mieux orchestré
                </h2>
                <p className="mb-4 text-sm italic text-neutral-700 md:text-base">
                  “Chaque détail géré avant même que vous le demandiez.”
                </p>
                <p className="mb-5 text-sm leading-relaxed text-neutral-800 md:text-base">
                  {signatureOfferText}
                </p>
                <a
                  href={`/?subscription=${encodeURIComponent(signatureSubscriptionSlug)}#contact`}
                  className="inline-flex items-center rounded-full border border-amber-700/30 bg-amber-50 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-amber-100"
                >
                  Découvrir cette formule
                </a>
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-white/85 p-6 shadow-sm backdrop-blur">
                <h3 className="mb-4 text-lg font-semibold text-neutral-950">
                  Comment ça marche
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-900">
                      1
                    </span>
                    <p className="text-sm leading-relaxed text-neutral-700">
                      Vous nous présentez votre besoin, ponctuel ou récurrent.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-900">
                      2
                    </span>
                    <p className="text-sm leading-relaxed text-neutral-700">
                      Nous confirmons le cadre, le tarif et le créneau le plus adapté.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-900">
                      3
                    </span>
                    <p className="text-sm leading-relaxed text-neutral-700">
                      La mission est organisée avec rigueur, discrétion et clarté.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-14">
          <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-800">
                Pourquoi choisir Isa
              </p>
              <h2 className="text-2xl font-bold text-neutral-950">
                Une conciergerie pensée pour les besoins réels du quotidien.
              </h2>
              <p className="text-sm leading-relaxed text-neutral-600">
                Une réponse claire, un cadre fiable et des prestations souples
                pour déléguer en toute confiance.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
                <h3 className="mb-2 text-base font-semibold text-neutral-950">
                  Disponibilité locale
                </h3>
                <p className="text-sm text-neutral-700">
                  Présence à Paris et en proche couronne pour des interventions
                  rapides et cadrées.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
                <h3 className="mb-2 text-base font-semibold text-neutral-950">
                  Service sur-mesure
                </h3>
                <p className="text-sm text-neutral-700">
                  Prestations ponctuelles ou récurrentes selon votre rythme,
                  votre foyer et vos contraintes.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
                <h3 className="mb-2 text-base font-semibold text-neutral-950">
                  Suivi transparent
                </h3>
                <p className="text-sm text-neutral-700">
                  Un échange clair avant intervention, puis une exécution suivie
                  avec soin.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
                <h3 className="mb-2 text-base font-semibold text-neutral-950">
                  Cadre de confiance
                </h3>
                {infoBoxes.length > 0 ? (
                  <div
                    className="text-sm text-neutral-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: infoBoxes[0].content.rendered }}
                  />
                ) : (
                  <p className="text-sm text-neutral-700">
                    Confidentialité, discrétion et attention portée à chaque
                    détail de la mission.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="max-w-5xl mx-auto px-4 py-14 md:py-18">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-800">
              Services à la carte
            </p>
            <h2 className="mb-3 text-2xl font-bold text-neutral-950">
              Des interventions concrètes, selon votre rythme.
            </h2>
            <p className="text-sm leading-relaxed text-neutral-600">
              Chaque service peut être demandé ponctuellement ou intégré à une
              organisation plus régulière, selon votre quotidien.
            </p>
          </div>
          <a
            href="/#contact"
            className="hidden md:inline-flex rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-amber-300 hover:text-amber-800"
          >
            Parler de votre besoin
          </a>
        </div>

        {services.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Les services seront affichés ici dès qu’ils auront été ajoutés dans WordPress.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service) => {
  // Get featured image from WP REST _embed
  const media =
    service._embedded?.["wp:featuredmedia"] &&
    service._embedded["wp:featuredmedia"][0];
  const imgUrl =
    media?.media_details?.sizes?.medium?.source_url || media?.source_url || null;
  const priceLabel = getServicePriceDisplay(service);
  const packPriceLabels = getPackPrices(service.meta);

  return (
    <article
      key={service.id}
      className="group flex h-full flex-col justify-between rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg"
    >
      {imgUrl && (
        <div className="relative mb-4 h-44 w-full overflow-hidden rounded-2xl bg-neutral-100">
          <Image
            src={imgUrl}
            alt={cleanHtml(service.title.rendered)}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            loading="lazy"
          />
        </div>
      )}

      <a href={`/services/${service.slug}`} className="block">
        <h3 className="mb-2 text-lg font-semibold text-neutral-950 group-hover:text-amber-800">
          {cleanHtml(service.title.rendered)}
        </h3>
        {priceLabel ? (
          <p className="text-sm font-semibold text-amber-800 mb-1">{priceLabel}</p>
        ) : null}
        {packPriceLabels.length > 0 ? (
          <p className="mb-2 text-xs font-semibold text-neutral-500">
            {packPriceLabels.join(" · ")}
          </p>
        ) : null}
        <div
          className="prose prose-sm mb-2 max-w-none text-sm text-neutral-700"
          dangerouslySetInnerHTML={{
            __html: service.excerpt?.rendered || service.content.rendered,
          }}
        />
      </a>
      <div className="mt-5 flex flex-wrap gap-4">
        <a
          href={`/services/${service.slug}`}
          className="inline-flex text-sm font-semibold text-amber-800 hover:underline"
        >
          Voir le détail
        </a>
        <a
          href={`/services/${service.slug}#availability`}
          className="inline-flex text-sm font-semibold text-neutral-600 hover:underline"
        >
          Voir disponibilités
        </a>
        <a
          href={`/?service=${encodeURIComponent(service.slug)}#contact`}
          className="inline-flex text-sm font-semibold text-neutral-600 hover:underline"
        >
          Demander ce service
        </a>
      </div>
    </article>
  );
            })}

          </div>
        )}
      </section>

      <section
        id="subscriptions"
        className="border-y border-neutral-200 bg-white py-14 md:py-18"
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-8 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="max-w-2xl">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-800">
                Formules d’abonnement
              </p>
              <h2 className="mb-3 text-2xl font-bold text-neutral-950">
                Un cadre plus régulier pour déléguer sans y penser.
              </h2>
              <p className="text-sm leading-relaxed text-neutral-600">
                Les abonnements conviennent aux besoins récurrents : plus de
                visibilité, un budget maîtrisé et une organisation plus fluide.
              </p>
            </div>
            <a
              href="/#contact"
              className="inline-flex rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-amber-300 hover:text-amber-800"
            >
              Choisir la bonne formule
            </a>
          </div>
          {subscriptions.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Ajoutez des abonnements dans WordPress pour les afficher ici.
            </p>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {subscriptions.map((sub, index) => {
                const highlight = index === 1;
                return (
                  <div
                    key={sub.id}
                    className={`relative flex h-full flex-col justify-between rounded-3xl border border-neutral-200 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                      highlight
                        ? "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white"
                        : "bg-neutral-50"
                    }`}
                  >
                    {highlight && (
                      <span className="absolute -top-3 right-5 inline-flex items-center rounded-full bg-amber-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
                        Populaire
                      </span>
                    )}
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
                        {sub.meta?.cbi_frequency || "Formule"}
                      </p>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        {cleanHtml(sub.title.rendered)}
                      </h3>
                      <p className="text-3xl font-bold text-amber-800 mb-4">
                        {sub.meta?.cbi_price || "Sur devis"}
                        <span className="text-sm font-medium text-neutral-500">
                          {sub.meta?.cbi_unit ? ` / ${sub.meta.cbi_unit}` : ""}
                        </span>
                      </p>
                      {sub.excerpt?.rendered ? (
                        <div
                          className="text-xs text-neutral-600 mb-4 space-y-2 prose prose-xs max-w-none"
                          dangerouslySetInnerHTML={{ __html: sub.excerpt.rendered }}
                        />
                      ) : sub.content?.rendered ? (
                        <div
                          className="text-xs text-neutral-600 mb-4 space-y-2 prose prose-xs max-w-none"
                          dangerouslySetInnerHTML={{ __html: sub.content.rendered }}
                        />
                      ) : null}
                    </div>
                    {sub.slug && (
                      <div className="mt-4 flex flex-col gap-2">
                        <a
                          href={`/subscriptions/${sub.slug}`}
                          className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition"
                        >
                          Voir disponibilités
                        </a>
                        <a
                          href={`/?subscription=${encodeURIComponent(sub.slug)}#contact`}
                          className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                            highlight
                              ? "bg-amber-700 text-white hover:bg-amber-800"
                              : "border border-amber-700 text-amber-800 hover:bg-amber-50"
                          }`}
                        >
                          {highlight ? "Découvrir cette formule" : "Choisir cette formule"}
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {visibleNews.length > 0 ? (
        <section id="news" className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-2xl font-bold">Actualités et offres</h2>
            <span className="text-xs text-neutral-500">
              Dernières nouvelles depuis notre conciergerie
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {visibleNews.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl bg-white border border-neutral-100 p-5 shadow-sm"
              >
                <p className="text-xs text-neutral-500 mb-1">
                  {new Date(item.date).toLocaleDateString("fr-FR")}
                </p>
                <h3 className="text-lg font-semibold mb-2">
                  {item.slug ? (
                    <a
                      href={`/actualites/${item.slug}`}
                      className="hover:text-amber-800"
                    >
                      {cleanHtml(item.title.rendered)}
                    </a>
                  ) : (
                    cleanHtml(item.title.rendered)
                  )}
                </h3>
                <div
                  className="text-sm text-neutral-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: item.excerpt.rendered }}
                />
                {item.slug ? (
                  <div className="mt-3">
                    <a
                      href={`/actualites/${item.slug}`}
                      className="inline-flex text-sm font-semibold text-amber-800 hover:underline"
                    >
                      Lire l’article
                    </a>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {providerCategories.length > 0 ? (
        <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-baseline justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Prestataires par catégorie</h2>
              <p className="text-sm text-neutral-600">
                Un répertoire simple à compléter par famille de besoin.
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {providerCategories.map((category) => (
              <section
                key={category.slug}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-semibold mb-1">{category.label}</h3>
                <p className="text-sm text-neutral-600 mb-4">{category.description}</p>
                <div className="space-y-4">
                  {category.providers.map((provider) => (
                    <article
                      key={`${category.slug}-${provider.name}`}
                      className="rounded-xl border border-neutral-100 bg-neutral-50 p-4"
                    >
                      <h4 className="font-semibold text-neutral-900">{provider.name}</h4>
                      {provider.services?.length ? (
                        <p className="mt-1 text-sm text-neutral-700">
                          {provider.services.join(" · ")}
                        </p>
                      ) : null}
                      <div className="mt-2 space-y-1 text-sm text-neutral-600">
                        {provider.phone ? <p>{provider.phone}</p> : null}
                        {provider.email ? <p>{provider.email}</p> : null}
                        {provider.city ? <p>{provider.city}</p> : null}
                        {provider.notes ? <p>{provider.notes}</p> : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      ) : null}

      <section
        id="contact"
        className="bg-neutral-900 text-neutral-50 py-12 md:py-16"
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200">
                  Contact et demande de service
                </p>
                <h2 className="mb-3 text-3xl font-bold text-white">
                  Dites-nous ce qui vous simplifierait la vie.
                </h2>
                <p className="text-sm leading-relaxed text-neutral-300">
                  Décrivez votre besoin, choisissez un service si vous le
                  souhaitez, et nous revenons vers vous pour confirmer le cadre,
                  le tarif et la disponibilité la plus adaptée.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
                    Zone couverte
                  </p>
                  <p className="mt-2 text-sm text-neutral-100">
                    Paris et proche couronne
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
                    Organisation
                  </p>
                  <p className="mt-2 text-sm text-neutral-100">
                    Intervention ponctuelle ou récurrente selon vos besoins
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/15 via-amber-400/5 to-transparent p-5">
                <div className="flex flex-col gap-4">
                  <div className="max-w-xl">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200">
                      Demande hors catalogue
                    </p>
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      Un besoin particulier ?
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-300">
                      Décrivez votre besoin. Nous l&apos;enregistrons et revenons
                      vers vous rapidement avec une réponse adaptée.
                    </p>
                  </div>
                  <div>
                    <a
                      href={
                        isCustomRequestActive
                          ? "/#contact"
                          : "/?custom_request=1#contact"
                      }
                      className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-amber-400"
                    >
                      {isCustomRequestActive
                        ? "Revenir au catalogue"
                        : "Demander un service sur-mesure"}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Suspense
                fallback={
                  <p className="text-sm text-neutral-400">
                    Chargement du formulaire de contact...
                  </p>
                }
              >
                <ContactForm services={services} subscriptions={subscriptions} />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
