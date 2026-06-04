import {
  getServices,
  getLatestNews,
  getSubscriptions,
  getInfoBoxes,
  getSiteInfo,
  getAboutPage,
} from "../lib/wordpress";
import { getPublishedFeedback } from "../lib/feedback";
import { getVisibleProviders } from "../data/providers";
import ContactForm from "../components/ContactForm";
import TestimonialsSection from "../components/TestimonialsSection";
import { Suspense } from "react";
import Image from "next/image";
import { getBaseUrl, getCanonicalUrl, isPlaceholderNewsItem } from "../lib/site";

export const metadata = {
  alternates: {
    canonical: getCanonicalUrl("/"),
  },
  title: "Conciergerie by Isa - Conciergerie privée à Paris et proche couronne",
  description:
    "Conciergerie privée à Paris et proche couronne pour déléguer les courses, animaux, déplacements, intendance et demandes sur-mesure avec un suivi discret et réactif.",
};

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
  return packs
    .filter((p) => p.size > 1)
    .sort((a, b) => a.size - b.size)
    .map((p) => `Pack ${p.size}: ${p.value}`);
}

function getDefaultPackModeFromLabels(packLabels) {
  const firstPackLabel = Array.isArray(packLabels) ? packLabels[0] : "";
  const match = String(firstPackLabel || "").match(/Pack\s+(\d+)/i);
  return match ? `pack${match[1]}` : "";
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

function buildHomeSchema({
  siteInfo,
  services,
  subscriptions,
  signatureOfferText,
}) {
  const baseUrl = getBaseUrl();
  const serviceNames = (services || [])
    .map((service) => cleanHtml(service?.title?.rendered || ""))
    .filter(Boolean);
  const subscriptionNames = (subscriptions || [])
    .map((subscription) => cleanHtml(subscription?.title?.rendered || ""))
    .filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${baseUrl}#professional-service`,
    name: siteInfo?.name || "Conciergerie by Isa",
    url: baseUrl,
    description:
      siteInfo?.description ||
      "Conciergerie privée à Paris pour simplifier le quotidien, organiser les déplacements, l intendance et les besoins récurrents.",
    areaServed: [
      {
        "@type": "City",
        name: "Paris",
      },
      {
        "@type": "AdministrativeArea",
        name: "Hauts-de-Seine",
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Paris",
      addressCountry: "FR",
    },
    sameAs: [
      "https://www.instagram.com/conciergeriebyisa?igsh=aml3dGVicjEzZXBr",
      "https://www.linkedin.com/in/isabelle-haquin-conciergerie-by-isa-009106385?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
    ],
    knowsAbout: [...serviceNames, ...subscriptionNames],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services et formules Conciergerie by Isa",
      itemListElement: [
        ...(serviceNames.length
          ? [
              {
                "@type": "OfferCatalog",
                name: "Services en ligne",
                itemListElement: serviceNames.map((name) => ({
                  "@type": "ListItem",
                  item: {
                    "@type": "Service",
                    name,
                  },
                })),
              },
            ]
          : []),
        ...(subscriptionNames.length
          ? [
              {
                "@type": "OfferCatalog",
                name: "Abonnements",
                itemListElement: subscriptionNames.map((name) => ({
                  "@type": "ListItem",
                  item: {
                    "@type": "Service",
                    name,
                  },
                })),
              },
            ]
          : []),
      ],
    },
    slogan: signatureOfferText || undefined,
  };
}

function getFeaturedServiceLinks(services) {
  return (services || [])
    .slice(0, 4)
    .map((service) => ({
      slug: service.slug,
      title: cleanHtml(service?.title?.rendered || ""),
      excerpt: cleanHtml(service?.excerpt?.rendered || "").slice(0, 120),
    }))
    .filter((service) => service.slug && service.title);
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

  const [services, news, subscriptions, infoBoxes, siteInfo, testimonials] =
    await Promise.all([
      getServices().catch(() => []),
      getLatestNews(2).catch(() => []),
      getSubscriptions().catch(() => []),
      getInfoBoxes().catch(() => []),
      getSiteInfo().catch(() => ({ name: "Conciergerie by Isa", description: "" })),
      getPublishedFeedback({ limit: 3 }).catch(() => []),
    ]);
  const visibleNews = (news || []).filter((item) => !isPlaceholderNewsItem(item));
  const providerCategories = getVisibleProviders();
  const signatureSubscriptionSlug = pickSignatureSubscriptionSlug(subscriptions);
  const signatureOfferText =
    getSignatureOfferText(subscriptions, signatureSubscriptionSlug) ||
    "Courses, déplacements, animaux, réservations : tout est pris en charge avec discrétion et efficacité.";
  const homeSchema = buildHomeSchema({
    siteInfo,
    services,
    subscriptions,
    signatureOfferText,
  });
  const featuredServiceLinks = getFeaturedServiceLinks(services);

  return (
    <main className="cbi-page min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
      />
      <section className="relative overflow-hidden border-b border-[rgba(36,31,26,0.12)] bg-[var(--cbi-bg-main)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(200,169,106,0.14),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(36,31,26,0.08),_transparent_38%)]" />

        <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-20">
          <div className="grid gap-8 md:grid-cols-[0.78fr_1.22fr] md:items-center">
            <div className="relative p-1 md:p-0">
              <div className="space-y-5">
                <p className="cbi-kicker">Conciergerie privée à Paris</p>
                <h1 className="cbi-title max-w-xl text-3xl font-bold leading-tight md:text-5xl">
                  Un quotidien plus simple, géré avec discrétion et précision.
                </h1>
                <p className="cbi-copy max-w-lg text-sm leading-relaxed md:text-base">
                  Courses, animaux, déplacements, intendance et demandes sur-mesure à Paris et en proche couronne, avec un suivi clair et une réponse rapide.
                </p>

                <div className="flex flex-wrap gap-3 pt-1">
                  <a href="/#contact" className="cbi-cta-primary">
                    Parler de votre besoin
                  </a>
                  <a href="/#services" className="cbi-cta-secondary">
                    Voir les services
                  </a>
                </div>

                <div className="grid gap-3 pt-2 sm:grid-cols-3">
                  <div className="border border-[rgba(36,31,26,0.1)] bg-[rgba(255,253,248,0.72)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--cbi-text-muted)]">
                      Zone
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--cbi-text-main)]">
                      Paris et proche couronne
                    </p>
                  </div>
                  <div className="border border-[rgba(36,31,26,0.1)] bg-[rgba(255,253,248,0.72)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--cbi-text-muted)]">
                      Réponse
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--cbi-text-main)]">
                      Retour rapide et suivi clair
                    </p>
                  </div>
                  <div className="border border-[rgba(36,31,26,0.1)] bg-[rgba(255,253,248,0.72)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--cbi-text-muted)]">
                      Format
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--cbi-text-main)]">
                      Ponctuel ou récurrent
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-h-[360px] overflow-hidden rounded-[1rem] border border-[rgba(36,31,26,0.1)] bg-[#dcc3a0] shadow-[0_30px_70px_rgba(31,27,23,0.12)] md:min-h-[520px]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/hero-bg.png')",
                }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,247,241,0.06),rgba(36,31,26,0.08))]" />
              <div className="absolute bottom-5 left-5 w-[calc(100%-2.5rem)] max-w-[24rem] border border-white/45 bg-[rgba(255,252,247,0.72)] px-4 py-3 backdrop-blur-sm md:bottom-6 md:left-6 md:w-auto">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7f6740]">
                  Service discret
                </p>
                <p
                  className="mt-1 text-sm leading-6 text-[var(--cbi-text-main)] md:text-[15px]"
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                  }}
                >
                  Une présence rassurante pour gérer les détails du quotidien sans alourdir votre agenda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[rgba(36,31,26,0.12)] bg-[var(--cbi-bg-soft)]">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-12">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="cbi-card p-6 md:p-7">
              <p className="cbi-kicker mb-3">Offre signature</p>
              <h2 className="cbi-title mb-3 text-2xl font-bold md:text-3xl">
                Un quotidien mieux orchestré
              </h2>
              <p className="mb-4 text-sm italic text-[var(--cbi-text-muted)] md:text-base">
                "Chaque détail géré avant même que vous le demandiez."
              </p>
              <p className="cbi-copy mb-5 text-sm leading-relaxed md:text-base">
                {signatureOfferText}
              </p>
              <a
                href={`/?subscription=${encodeURIComponent(signatureSubscriptionSlug)}#contact`}
                className="cbi-cta-secondary"
              >
                Découvrir cette formule
              </a>
            </div>

            <div className="cbi-card-dark p-6 md:p-7">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e2c48c]">
                Comment ça marche
              </p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(200,169,106,0.2)] text-sm font-semibold text-[#f4dfb5]">
                    1
                  </span>
                  <p className="text-sm leading-relaxed text-[#f3eadf]">
                    Vous nous présentez votre besoin, ponctuel ou récurrent.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(200,169,106,0.2)] text-sm font-semibold text-[#f4dfb5]">
                    2
                  </span>
                  <p className="text-sm leading-relaxed text-[#f3eadf]">
                    Nous confirmons le cadre, le créneau et la meilleure organisation possible.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(200,169,106,0.2)] text-sm font-semibold text-[#f4dfb5]">
                    3
                  </span>
                  <p className="text-sm leading-relaxed text-[#f3eadf]">
                    La mission est suivie avec rigueur, discrétion et clarté.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[rgba(36,31,26,0.12)] bg-[var(--cbi-bg-warm)]">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-14">
          <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div className="space-y-4">
              <p className="cbi-kicker">
                Pourquoi choisir Isa
              </p>
              <h2 className="cbi-title text-2xl font-bold">
                Une conciergerie locale pensée pour les besoins réels du quotidien.
              </h2>
              <p className="cbi-copy text-sm leading-relaxed">
                Une réponse claire pour déléguer à Paris et en proche couronne :
                prestations ponctuelles, besoins récurrents et organisation sur-mesure.
              </p>
              <div className="overflow-hidden border border-[rgba(36,31,26,0.1)] bg-[rgba(255,253,248,0.72)] shadow-[0_12px_28px_rgba(31,27,23,0.05)]">
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src="/why-choose-isa-unsplash.jpg"
                    alt="Façades élégantes d'appartements parisiens avec verdure"
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="cbi-card p-5">
                <h3 className="mb-2 text-base font-semibold text-[var(--cbi-text-main)]">
                  Disponibilité locale
                </h3>
                <p className="text-sm text-[var(--cbi-text-muted)]">
                  Présence à Paris et en proche couronne pour des interventions
                  rapides et cadrées.
                </p>
              </div>
              <div className="cbi-card p-5">
                <h3 className="mb-2 text-base font-semibold text-[var(--cbi-text-main)]">
                  Service sur-mesure
                </h3>
                <p className="text-sm text-[var(--cbi-text-muted)]">
                  Prestations ponctuelles ou récurrentes selon votre rythme,
                  votre foyer et vos contraintes.
                </p>
              </div>
              <div className="cbi-card p-5">
                <h3 className="mb-2 text-base font-semibold text-[var(--cbi-text-main)]">
                  Suivi transparent
                </h3>
                <p className="text-sm text-[var(--cbi-text-muted)]">
                  Un échange clair avant intervention, puis une exécution suivie
                  avec soin.
                </p>
              </div>
              <div className="cbi-card p-5">
                <h3 className="mb-2 text-base font-semibold text-[var(--cbi-text-main)]">
                  Cadre de confiance
                </h3>
                {infoBoxes.length > 0 ? (
                  <div
                    className="prose prose-sm max-w-none text-sm text-[var(--cbi-text-muted)]"
                    dangerouslySetInnerHTML={{ __html: infoBoxes[0].content.rendered }}
                  />
                ) : (
                  <p className="text-sm text-[var(--cbi-text-muted)]">
                    Confidentialité, discrétion et attention portée à chaque
                    détail de la mission.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[rgba(36,31,26,0.12)] bg-[var(--cbi-bg-main)]">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-14">
          <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-start">
            <div className="space-y-4">
              <p className="cbi-kicker">
                Conciergerie à Paris
              </p>
              <h2 className="cbi-title text-2xl font-bold">
                Une conciergerie privée pour Paris et proche couronne.
              </h2>
              <p className="cbi-copy text-sm leading-relaxed">
                Nous accompagnons les particuliers et foyers actifs qui veulent
                déléguer des tâches concrètes du quotidien, organiser leurs
                déplacements, gérer leurs absences ou mettre en place une aide
                plus régulière à Paris et dans les communes voisines.
              </p>
              <p className="cbi-copy text-sm leading-relaxed">
                L’objectif est simple : offrir un cadre fiable, une réponse
                rapide et une exécution discrète pour les besoins pratiques du
                quotidien comme pour les demandes plus personnalisées.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="cbi-card p-5">
                <h3 className="mb-2 text-base font-semibold text-[var(--cbi-text-main)]">
                  Zones fréquemment demandées
                </h3>
                <p className="text-sm text-[var(--cbi-text-muted)]">
                  Paris 6e, 7e, 15e, 16e, 17e, Neuilly-sur-Seine, Boulogne-Billancourt
                  et communes de proche couronne selon le besoin.
                </p>
              </div>
              <div className="cbi-card p-5">
                <h3 className="mb-2 text-base font-semibold text-[var(--cbi-text-main)]">
                  Missions récurrentes
                </h3>
                <p className="text-sm text-[var(--cbi-text-muted)]">
                  Gestion des clés, pressing, garde d’animaux, intendance,
                  accompagnement logistique et coordination de déplacements.
                </p>
              </div>
              <div className="cbi-card p-5 sm:col-span-2">
                <h3 className="mb-2 text-base font-semibold text-[var(--cbi-text-main)]">
                  Réponse adaptée au rythme de vie
                </h3>
                <p className="text-sm text-[var(--cbi-text-muted)]">
                  Intervention ponctuelle, organisation hebdomadaire ou formule
                  plus régulière : nous aidons à choisir le bon cadre selon le
                  niveau d’autonomie recherché, le budget et la fréquence des demandes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="border-b border-[rgba(36,31,26,0.12)] bg-[var(--cbi-bg-soft)]">
        <div className="max-w-5xl mx-auto px-4 py-14 md:py-18">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="cbi-kicker mb-2">
                Packs en ligne
              </p>
              <h2 className="cbi-title mb-3 text-2xl font-bold">
                Des services de conciergerie à Paris, disponibles selon votre rythme.
              </h2>
              <p className="cbi-copy text-sm leading-relaxed">
                Retrouvez les services disponibles à la réservation en ligne,
                avec leurs packs et un cadre d’intervention clair sur Paris et proche couronne.
              </p>
            </div>
            <a href="/#contact" className="cbi-cta-secondary hidden md:inline-flex">
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
  const packPriceLabels = getPackPrices(service.meta);
  const defaultPackMode = getDefaultPackModeFromLabels(packPriceLabels);
  const contactHref = `/?service=${encodeURIComponent(service.slug)}${
    defaultPackMode ? `&price_mode=${encodeURIComponent(defaultPackMode)}` : ""
  }#contact`;

  return (
    <article
      key={service.id}
      className="group cbi-card flex h-full flex-col justify-between p-5 transition duration-200 hover:-translate-y-1 hover:border-[rgba(200,169,106,0.45)] hover:shadow-[0_22px_48px_rgba(31,27,23,0.12)]"
    >
      {imgUrl && (
        <div className="relative mb-4 h-44 w-full overflow-hidden rounded-2xl bg-[rgba(36,31,26,0.06)]">
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
        <h3 className="mb-2 text-lg font-semibold text-[var(--cbi-text-main)] group-hover:text-[#7f6740]">
          {cleanHtml(service.title.rendered)}
        </h3>
        <div
          className="prose prose-sm mb-2 max-w-none text-sm text-[var(--cbi-text-muted)]"
          dangerouslySetInnerHTML={{
            __html: service.excerpt?.rendered || service.content.rendered,
          }}
        />
      </a>
      <div className="mt-5 flex flex-wrap gap-4">
        <a
          href={`/services/${service.slug}`}
          className="inline-flex text-sm font-semibold text-[#7f6740] hover:underline"
        >
          Voir le détail
        </a>
        <a
          href={`/services/${service.slug}#availability`}
          className="inline-flex text-sm font-semibold text-[var(--cbi-text-muted)] hover:underline"
        >
          Voir disponibilités
        </a>
        <a
          href={contactHref}
          className="inline-flex text-sm font-semibold text-[var(--cbi-text-muted)] hover:underline"
        >
          Demander ce service
        </a>
      </div>
    </article>
  );
            })}

            </div>
          )}
        </div>
      </section>

      {featuredServiceLinks.length > 0 ? (
        <section className="border-y border-[rgba(36,31,26,0.12)] bg-[var(--cbi-bg-warm)]">
          <div className="max-w-5xl mx-auto px-4 py-12 md:py-14">
            <div className="mb-6 max-w-2xl">
              <p className="cbi-kicker mb-2">
                Services recherchés
              </p>
              <h2 className="cbi-title text-2xl font-bold">
                Accès rapide aux besoins les plus demandés.
              </h2>
              <p className="cbi-copy mt-3 text-sm leading-relaxed">
                Ces pages concentrent les demandes les plus fréquentes pour une
                conciergerie privée à Paris : animaux, clés, pressing,
                déplacements et organisation du quotidien.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {featuredServiceLinks.map((service) => (
                <a
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="cbi-card-soft p-5 shadow-sm transition hover:border-[rgba(200,169,106,0.45)] hover:shadow-[0_16px_36px_rgba(31,27,23,0.08)]"
                >
                  <h3 className="mb-2 text-base font-semibold text-[var(--cbi-text-main)]">
                    {service.title}
                  </h3>
                  <p className="text-sm text-[var(--cbi-text-muted)]">
                    {service.excerpt || "Découvrir le détail de cette prestation."}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-[#7f6740]">
                    Voir le service
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {testimonials.length > 0 ? (
        <section className="border-b border-[rgba(36,31,26,0.12)] bg-[var(--cbi-bg-main)]">
          <div className="max-w-5xl mx-auto px-4 py-12 md:py-14">
            <TestimonialsSection
              reviews={testimonials}
              title="Des avis clients publiés après validation."
              intro="Chaque témoignage affiché ici est rattaché à une commande réelle, relu avant publication et associé au service concerné."
            />
          </div>
        </section>
      ) : null}

      <section
        id="subscriptions"
        className="border-y border-[rgba(36,31,26,0.12)] bg-[var(--cbi-bg-soft)] py-14 md:py-18"
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-8 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="max-w-2xl">
              <p className="cbi-kicker mb-2">
                Formules d’abonnement
              </p>
              <h2 className="cbi-title mb-3 text-2xl font-bold">
                Un cadre plus régulier pour déléguer sans y penser.
              </h2>
              <p className="cbi-copy text-sm leading-relaxed">
                Les abonnements conviennent aux besoins récurrents : plus de
                visibilité, un budget maîtrisé et une organisation plus fluide.
              </p>
            </div>
            <a href="/#contact" className="cbi-cta-secondary">
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
                    className={`relative flex h-full flex-col justify-between rounded-3xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(31,27,23,0.12)] ${
                      highlight
                        ? "border-[rgba(200,169,106,0.4)] bg-[linear-gradient(160deg,#fffaf2_0%,#f4ebdb_100%)]"
                        : "border-[rgba(36,31,26,0.12)] bg-[rgba(255,253,248,0.92)]"
                    }`}
                  >
                    {highlight && (
                      <span className="absolute -top-3 right-5 inline-flex items-center rounded-full bg-[var(--cbi-bg-premium)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
                        Populaire
                      </span>
                    )}
                    <div>
                      <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[var(--cbi-text-muted)]">
                        {sub.meta?.cbi_frequency || "Formule"}
                      </p>
                      <h3 className="mb-2 text-lg font-semibold text-[var(--cbi-text-main)]">
                        {cleanHtml(sub.title.rendered)}
                      </h3>
                      {sub.excerpt?.rendered ? (
                        <div
                          className="prose prose-xs mb-4 max-w-none space-y-2 text-xs text-[var(--cbi-text-muted)]"
                          dangerouslySetInnerHTML={{ __html: sub.excerpt.rendered }}
                        />
                      ) : sub.content?.rendered ? (
                        <div
                          className="prose prose-xs mb-4 max-w-none space-y-2 text-xs text-[var(--cbi-text-muted)]"
                          dangerouslySetInnerHTML={{ __html: sub.content.rendered }}
                        />
                      ) : null}
                    </div>
                    {sub.slug && (
                      <div className="mt-4 flex flex-col gap-2">
                        <a
                          href={`/subscriptions/${sub.slug}`}
                          className="cbi-cta-secondary"
                        >
                          Voir disponibilités
                        </a>
                        <a
                          href={`/?subscription=${encodeURIComponent(sub.slug)}#contact`}
                          className={`inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition ${
                            highlight
                              ? "bg-[var(--cbi-bg-premium)] text-white hover:bg-[#15110d]"
                              : "border border-[rgba(31,27,23,0.2)] text-[var(--cbi-text-main)] hover:bg-[rgba(36,31,26,0.05)]"
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
        <section id="news" className="border-b border-[rgba(36,31,26,0.12)] bg-[var(--cbi-bg-warm)]">
          <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="cbi-title text-2xl font-bold">Actualités et offres</h2>
              <span className="text-xs text-[var(--cbi-text-muted)]">
                Dernières nouvelles depuis notre conciergerie
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {visibleNews.map((item) => (
                <article
                  key={item.id}
                  className="cbi-card p-5"
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
                  className="prose prose-sm max-w-none text-sm text-[var(--cbi-text-muted)]"
                  dangerouslySetInnerHTML={{ __html: item.excerpt.rendered }}
                />
                {item.slug ? (
                  <div className="mt-3">
                    <a
                      href={`/actualites/${item.slug}`}
                      className="inline-flex text-sm font-semibold text-[#7f6740] hover:underline"
                    >
                      Lire l’article
                    </a>
                  </div>
                ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {providerCategories.length > 0 ? (
        <section className="bg-[var(--cbi-bg-main)]">
          <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
            <div className="mb-8 flex items-baseline justify-between gap-4">
              <div>
                <h2 className="cbi-title mb-2 text-2xl font-bold">Prestataires par catégorie</h2>
                <p className="cbi-copy text-sm">
                  Un répertoire simple à compléter par famille de besoin.
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {providerCategories.map((category) => (
                <section
                  key={category.slug}
                  className="cbi-card p-5"
                >
                <h3 className="text-lg font-semibold mb-1">{category.label}</h3>
                <p className="mb-4 text-sm text-[var(--cbi-text-muted)]">{category.description}</p>
                <div className="space-y-4">
                  {category.providers.map((provider) => (
                    <article
                      key={`${category.slug}-${provider.name}`}
                      className="cbi-card-soft rounded-xl p-4"
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
          </div>
        </section>
      ) : null}

      <section
        id="contact"
        className="bg-[var(--cbi-bg-premium)] text-neutral-50 py-12 md:py-16"
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e2c48c]">
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e2c48c]">
                    Zone couverte
                  </p>
                  <p className="mt-2 text-sm text-neutral-100">
                    Paris et proche couronne
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e2c48c]">
                    Organisation
                  </p>
                  <p className="mt-2 text-sm text-neutral-100">
                    Intervention ponctuelle ou récurrente selon vos besoins
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-[rgba(200,169,106,0.25)] bg-[linear-gradient(145deg,rgba(200,169,106,0.18),rgba(200,169,106,0.04),transparent)] p-5">
                <div className="flex flex-col gap-4">
                  <div className="max-w-xl">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e2c48c]">
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
                      className="inline-flex items-center justify-center rounded-full bg-[#e2c48c] px-5 py-3 text-sm font-semibold text-[var(--cbi-bg-premium)] transition hover:bg-[#edd3a3]"
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
