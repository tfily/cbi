import Image from "next/image";
import { getAboutPage, getSiteInfo } from "../../lib/wordpress";

function cleanHtml(str) {
  return str.replace(/<[^>]+>/g, "");
}

function buildExcerpt(html, fallback) {
  if (!html) return fallback;
  const text = cleanHtml(html).trim();
  if (!text) return fallback;
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

export async function generateMetadata() {
  const aboutPage = await getAboutPage().catch(() => null);
  const title = aboutPage?.title?.rendered
    ? cleanHtml(aboutPage.title.rendered)
    : "A propos";
  const description = buildExcerpt(
    aboutPage?.excerpt?.rendered || aboutPage?.content?.rendered,
    "Decouvrez notre conciergerie et notre facon de simplifier votre quotidien."
  );

  return {
    title: `${title} - Conciergerie by Isa`,
    description,
  };
}

export default async function AboutPage() {
  const [aboutPage, siteInfo] = await Promise.all([
    getAboutPage().catch(() => null),
    getSiteInfo().catch(() => ({ name: "Conciergerie by Isa", description: "" })),
  ]);

  const heroMedia =
    aboutPage?._embedded?.["wp:featuredmedia"] &&
    aboutPage._embedded["wp:featuredmedia"][0];
  const heroImage =
    heroMedia?.media_details?.sizes?.large?.source_url ||
    heroMedia?.source_url ||
    null;

  const title =
    aboutPage?.title?.rendered && cleanHtml(aboutPage.title.rendered)
      ? cleanHtml(aboutPage.title.rendered)
      : `A propos de ${siteInfo.name}`;

  const introHtml = aboutPage?.excerpt?.rendered || null;
  const introText =
    siteInfo.description ||
    "Une conciergerie humaine, locale et attentive qui orchestre chaque detail de votre quotidien.";

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <section className="relative overflow-hidden border-b border-neutral-200">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f3e0bc]/90 via-[#e8d3a7]/85 to-[#cba26a]/80" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 md:py-24 grid gap-10 md:grid-cols-[1.2fr_0.8fr] items-center">
          <div>
            <p className="uppercase tracking-[0.25em] text-xs text-amber-700 mb-4">
              {siteInfo.name}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-5">
              {title}
            </h1>
            {introHtml ? (
              <div
                className="text-sm md:text-base text-neutral-800 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: introHtml }}
              />
            ) : (
              <p className="text-sm md:text-base text-neutral-800">{introText}</p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/#contact"
                className="inline-flex items-center px-5 py-3 rounded-full bg-amber-700 text-white text-sm font-semibold shadow-sm hover:bg-amber-800 transition"
              >
                Parler de votre besoin
              </a>
              <a
                href="/#services"
                className="inline-flex items-center px-5 py-3 rounded-full border border-amber-700 text-amber-800 text-sm font-semibold hover:bg-amber-50 transition"
              >
                Explorer nos services
              </a>
            </div>
          </div>
          <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden border border-amber-100 shadow-lg bg-white/80">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-amber-800 bg-gradient-to-br from-amber-50 to-white">
                Photo de notre conciergerie
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 md:py-16 grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Notre histoire</h2>
          {aboutPage?.content?.rendered ? (
            <div
              className="prose prose-sm md:prose-base max-w-none text-neutral-800"
              dangerouslySetInnerHTML={{ __html: aboutPage.content.rendered }}
            />
          ) : (
            <div className="space-y-4 text-sm text-neutral-700">
              <p>
                Nous accompagnons des particuliers exigeants dans la gestion de leur foyer, de
                leurs animaux et de leurs deplacements a Paris et en petite couronne. Notre equipe
                construit des solutions sur-mesure, de l intention au moindre detail.
              </p>
              <p>
                Nous prenons le temps de comprendre vos habitudes, vos priorites et votre rythme
                pour orchestrer des prestations fiables, discretes et rassurantes.
              </p>
              <p className="text-amber-800 font-semibold">
                Ajoutez une page WordPress "A propos" pour personnaliser ce texte.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Nos engagements</h3>
          <ul className="space-y-4 text-sm text-neutral-700">
            <li>
              <span className="font-semibold text-neutral-900">Disponibilite :</span> une equipe
              reactive et joignable, avec un suivi clair de chaque demande.
            </li>
            <li>
              <span className="font-semibold text-neutral-900">Confiance :</span> des partenaires
              selectionnes, des processus soignes, une attention a la confidentialite.
            </li>
            <li>
              <span className="font-semibold text-neutral-900">Souplesse :</span> des prestations
              a la carte, ponctuelles ou recurrentes selon votre agenda.
            </li>
            <li>
              <span className="font-semibold text-neutral-900">Qualite :</span> chaque mission est
              verifiee pour garantir votre tranquillite.
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-white border-y border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Coordination locale",
              body: "Une presence terrain sur Paris et proche couronne pour une intervention rapide.",
            },
            {
              title: "Services sur-mesure",
              body: "Chaque prestation est adaptee a vos usages : intendance, animaux, logistique.",
            },
            {
              title: "Suivi transparent",
              body: "Des points reguliers, des confirmations claires et une equipe proactive.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5 shadow-sm"
            >
              <h4 className="font-semibold mb-2 text-neutral-900">{item.title}</h4>
              <p className="text-sm text-neutral-700">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Envie de gagner du temps ?</h2>
            <p className="text-sm text-neutral-700">
              Dites-nous ce qui vous simplifierait la vie, nous dessinons la solution avec vous.
            </p>
          </div>
          <a
            href="/#contact"
            className="inline-flex items-center px-5 py-3 rounded-full bg-amber-700 text-white text-sm font-semibold shadow-sm hover:bg-amber-800 transition"
          >
            Demander une prise de contact
          </a>
        </div>
      </section>
    </main>
  );
}
