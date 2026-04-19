import Link from "next/link";
import {
  getSubscriptionBySlug,
  getSubscriptionSlugs,
} from "../../../lib/wordpress";
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

export async function generateStaticParams() {
  const slugs = await getSubscriptionSlugs().catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const sub = await getSubscriptionBySlug(resolvedParams.slug).catch(() => null);
  if (!sub) return {};
  const title = cleanHtml(sub.title?.rendered || "Abonnement");
  return {
    title: `${title} - Conciergerie by Isa`,
    description: cleanHtml(sub.excerpt?.rendered || ""),
  };
}

export default async function SubscriptionPage({ params }) {
  const resolvedParams = await params;
  const sub = await getSubscriptionBySlug(resolvedParams.slug).catch(() => null);

  if (!sub) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-4">Abonnement introuvable</h1>
        <p className="mb-4">La formule recherchée n’existe pas ou plus.</p>
        <Link href="/" className="text-amber-800 hover:underline text-sm">
          Retour à l’accueil
        </Link>
      </main>
    );
  }

  const title = cleanHtml(sub.title?.rendered || "Formule");
  const price = sub.meta?.cbi_price || "Sur devis";
  const frequency = sub.meta?.cbi_frequency || "Formule";
  const unit = sub.meta?.cbi_unit ? ` / ${sub.meta.cbi_unit}` : "";
  const excerptHtml = sub.excerpt?.rendered || "";
  const contentHtml = sub.content?.rendered || "";

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <section className="border-b border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <p className="text-xs text-neutral-500 mb-4">
            <Link href="/" className="hover:underline">
              Accueil
            </Link>{" "}
            / Abonnement
          </p>

          <div className="grid gap-8 md:grid-cols-[1.08fr_0.92fr] md:items-start">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-800">
                Formule d’abonnement
              </p>
              <h1 className="mb-3 text-3xl font-bold text-neutral-950 md:text-5xl">
                {title}
              </h1>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
                {frequency}
              </p>
              <p className="mb-5 text-3xl font-bold text-amber-800">
                {price}
                <span className="text-sm font-medium text-neutral-500">{unit}</span>
              </p>

              {excerptHtml ? (
                <div
                  className="prose prose-sm mb-6 max-w-none text-sm text-neutral-700 md:text-base"
                  dangerouslySetInnerHTML={{ __html: excerptHtml }}
                />
              ) : null}

              <div className="flex flex-wrap gap-3">
                <a
                  href={`/?subscription=${encodeURIComponent(resolvedParams.slug)}#contact`}
                  className="inline-flex items-center rounded-full bg-amber-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800"
                >
                  Demander cette formule
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
              <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-neutral-950">
                  Bon à savoir
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      Rythme
                    </p>
                    <p className="mt-2 text-sm text-neutral-800">
                      Une formule pensée pour un besoin récurrent et mieux cadré
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      Budget
                    </p>
                    <p className="mt-2 text-sm text-neutral-800">
                      Plus de visibilité sur vos interventions du mois
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

              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-neutral-950">
                  Pourquoi choisir une formule ?
                </h2>
                <p className="text-sm leading-relaxed text-neutral-700">
                  Cette formule convient lorsque vous avez besoin d’un cadre
                  régulier : plus de simplicité, plus d’anticipation et moins de
                  gestion au cas par cas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-[1fr_320px] md:items-start">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-5 text-2xl font-semibold text-neutral-950">
              Détails de la formule
            </h2>
            <div className="prose prose-sm max-w-none text-neutral-800">
              <div
                dangerouslySetInnerHTML={{ __html: contentHtml || excerptHtml }}
              />
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-neutral-950">
                Cette formule est adaptée si…
              </h3>
              <ul className="space-y-3 text-sm text-neutral-700">
                <li>Vous avez des besoins réguliers dans le mois.</li>
                <li>Vous voulez un cadre simple et plus de visibilité budgétaire.</li>
                <li>Vous cherchez une organisation plus fluide au quotidien.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-neutral-950">
                Besoin d’aide pour choisir ?
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-neutral-700">
                Décrivez votre rythme, vos attentes et vos besoins récurrents.
                Nous vous aidons à choisir la formule la plus juste pour votre quotidien.
              </p>
              <a
                href={`/?subscription=${encodeURIComponent(resolvedParams.slug)}#contact`}
                className="inline-flex items-center rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
              >
                Demander cette formule
              </a>
            </div>
          </aside>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="space-y-6">
          <AvailabilityPanel slug={resolvedParams.slug} itemType="subscription" />
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="mb-2 text-xl font-semibold text-neutral-950">
                  Envie de mettre cette formule en place ?
                </h2>
                <p className="text-sm leading-relaxed text-neutral-600">
                  Utilisez le formulaire pour préciser votre contexte, votre date
                  de démarrage idéale et vos attentes.
                </p>
              </div>
              <a
                href={`/?subscription=${encodeURIComponent(resolvedParams.slug)}#contact`}
                className="inline-flex items-center rounded-full bg-amber-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800"
              >
                Demander cette formule
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
