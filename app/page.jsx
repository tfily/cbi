import {
  getServices,
  getLatestNews,
  getSubscriptions,
  getInfoBoxes,
  getSiteInfo,
  getAboutPage,
} from "../lib/wordpress";
import ContactForm from "../components/ContactForm";
import { Suspense } from "react";
import Image from "next/image";

function cleanHtml(str) {
  return str.replace(/<[^>]+>/g, "");
}

export default async function HomePage() {
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

  if (maintenanceMode) {
    const aboutPage = await getAboutPage().catch(() => null);
    const excerpt = aboutPage?.excerpt?.rendered || "";
    const title = aboutPage?.title?.rendered
      ? cleanHtml(aboutPage.title.rendered)
      : "A propos";

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
                Ajoutez un extrait a la page "A propos" pour l afficher ici.
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

  // Choose a random hero image among several lifestyle variants
  const heroImages = [
    { src: "/hero-conciergerie-1.png", alt: "Conciergerie, organisation du quotidien" },
    { src: "/hero-conciergerie-2.png", alt: "Services de conciergerie à domicile" },
    { src: "/hero-conciergerie-3.png", alt: "Accompagnement personnalisé et services sur-mesure" },
  ];
  const randomHero = heroImages[Math.floor(Math.random() * heroImages.length)];

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* HERO SECTION – Option A: no side image, centered content */}
<section className="relative overflow-hidden border-b border-neutral-200">
  {/* Background image */}
  <div
    className="absolute inset-0 z-0 bg-no-repeat bg-center bg-contain"
    style={{
      backgroundImage: "url('/hero-bg.png')",
    }}
  />

  {/* Gradient overlay */}
  <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#f3e0bc]/95 via-[#e0c38f]/85 to-[#cba26a]/90" />

  {/* Content */}
  <div className="relative z-20 max-w-3xl mx-auto px-4 py-24 md:py-32 text-center">
    <p className="uppercase tracking-[0.25em] text-xs text-amber-700 mb-4">
      {siteInfo.name}
    </p>

    <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight text-neutral-900">
      Votre sérénité, <br /> notre priorité
    </h1>

    <p className="text-neutral-800 mb-8 text-sm md:text-base leading-relaxed">
      {siteInfo.description ||
        "Services de conciergerie personnalisés pour simplifier votre quotidien, prendre soin de votre foyer, de vos animaux et organiser vos déplacements et loisirs."}
    </p>

    <div className="flex flex-wrap justify-center gap-4">
      <a
        href="/#contact"
        className="inline-flex items-center px-5 py-3 rounded-full bg-amber-700 text-white text-sm font-semibold shadow-sm hover:bg-amber-800 transition"
      >
        Demander un service
      </a>
      <a
        href="/#subscriptions"
        className="inline-flex items-center px-5 py-3 rounded-full border border-amber-700 text-amber-800 text-sm font-semibold hover:bg-amber-50 transition"
      >
        Découvrir les abonnements
      </a>
    </div>
  </div>
</section>


      {/* Info box with full-width city silhouette background (no overlap) */}
      <section className="relative overflow-hidden max-w-5xl mx-auto px-4 mt-20 py-14 min-h-[50vh]">

        {/* Background silhouette fills the section, clipped inside it */}
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-no-repeat bg-center bg-cover opacity-25 grayscale"
          style={{
            backgroundImage: "url('/info-bg.png')",
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-xl mx-auto space-y-4 text-neutral-900">
          <h2 className="text-lg font-semibold">Informations clés</h2>

          {infoBoxes.length === 0 ? (
            <p className="text-sm text-neutral-700">
              Ajoutez des infos clés dans WordPress pour les afficher ici.
            </p>
          ) : (
            (() => {
              const random = infoBoxes[Math.floor(Math.random() * infoBoxes.length)];
              return (
                <ul className="text-sm text-neutral-800 space-y-2">
                  <li key={random.id}>
                    <span className="font-medium">
                      {cleanHtml(random.title.rendered)}:{" "}
                    </span>
                    <span
                      className="text-neutral-800"
                      dangerouslySetInnerHTML={{ __html: random.content.rendered }}
                    />
                  </li>
                </ul>
              );
            })()
          )}
        </div>

      </section>

      {/* Services from WordPress */}
      <section id="services" className="max-w-5xl mx-auto my-auto px-4 py-12 md:py-16">
        <div className="flex items-baseline justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Nos services de conciergerie</h2>
            <p className="text-sm text-neutral-600">
              Des solutions à la carte, ponctuelles ou récurrentes, adaptées à votre quotidien.
            </p>
          </div>
          <a
            href="/#contact"
            className="hidden md:inline-flex text-sm font-semibold text-amber-800 hover:underline"
          >
            Nous confier une demande
          </a>
        </div>

        {services.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Les services seront affichés ici dès qu ils auront été ajoutés dans WordPress.
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
  const priceLabel = service.meta?.cbi_price || service.meta?.price || "";

  return (
    <article
      key={service.id}
      className="group rounded-2xl bg-white border border-neutral-100 p-5 shadow-sm flex flex-col justify-between hover:border-amber-300 hover:shadow-md transition"
    >
      {/* Top: image if available */}
      {imgUrl && (
        <div className="relative w-full h-40 mb-4 rounded-xl overflow-hidden bg-neutral-100">
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
        <h3 className="text-lg font-semibold mb-2 group-hover:text-amber-800">
          {cleanHtml(service.title.rendered)}
        </h3>
        {priceLabel ? (
          <p className="text-sm font-semibold text-amber-800 mb-2">{priceLabel}</p>
        ) : null}
        <div
          className="text-sm text-neutral-700 mb-2 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: service.excerpt?.rendered || service.content.rendered,
          }}
        />
      </a>
      <div className="mt-4 flex gap-4">
        <a
          href={`/services/${service.slug}`}
          className="inline-flex text-sm font-semibold text-amber-800 hover:underline"
        >
          Voir le détail
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

      {/* Subscriptions from WP */}
      <section
        id="subscriptions"
        className="bg-white border-y border-neutral-200 py-12 md:py-16"
      >
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2">Formules d'abonnement</h2>
          <p className="text-sm text-neutral-600 mb-8">
            Maîtrisez votre budget grâce à des abonnements flexibles et transparents.
          </p>
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
                        ? "bg-gradient-to-br from-amber-50 via-white to-white border-amber-200"
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
                      {sub.excerpt?.rendered && (
                        <div
                          className="text-xs text-neutral-600 mb-4 space-y-2 prose prose-xs max-w-none"
                          dangerouslySetInnerHTML={{ __html: sub.excerpt.rendered }}
                        />
                      )}
                      {!sub.excerpt?.rendered && sub.content?.rendered && (
                        <div
                          className="text-xs text-neutral-600 mb-4 space-y-2 prose prose-xs max-w-none"
                          dangerouslySetInnerHTML={{ __html: sub.content.rendered }}
                        />
                      )}
                    </div>
                    {sub.slug && (
                      <a
                        href={`/?subscription=${encodeURIComponent(sub.slug)}#contact`}
                        className={`mt-4 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                          highlight
                            ? "bg-amber-700 text-white hover:bg-amber-800"
                            : "border border-amber-700 text-amber-800 hover:bg-amber-50"
                        }`}
                      >
                        {highlight ? "Je réserve cette formule" : "Choisir cette formule"}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* News / Promo from posts */}
      <section id="news" className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-bold">Actualités et offres</h2>
          <span className="text-xs text-neutral-500">
            Dernières nouvelles depuis notre conciergerie
          </span>
        </div>

        {news.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Aucune actualité pour le moment. Ajoutez des articles dans WordPress pour les afficher ici.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {news.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl bg-white border border-neutral-100 p-5 shadow-sm"
              >
                <p className="text-xs text-neutral-500 mb-1">
                  {new Date(item.date).toLocaleDateString("fr-FR")}
                </p>
                <h3 className="text-lg font-semibold mb-2">
                  {cleanHtml(item.title.rendered)}
                </h3>
                <div
                  className="text-sm text-neutral-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: item.excerpt.rendered }}
                />
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Contact form */}
      <section
        id="contact"
        className="bg-neutral-900 text-neutral-50 py-12 md:py-16"
      >
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2">Contact et demande de service</h2>
          <p className="text-sm text-neutral-300 mb-8">
            Décrivez votre besoin, choisissez un type de service et nous vous recontactons pour
            confirmer la prestation et le tarif.
          </p>

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
      </section>
    </main>
  );
}
