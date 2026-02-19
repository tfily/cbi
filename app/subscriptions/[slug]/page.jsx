import Link from "next/link";
import {
  getSubscriptionBySlug,
  getSubscriptionSlugs,
} from "../../../lib/wordpress";
import AvailabilityPanel from "../../../components/AvailabilityPanel";

function cleanHtml(str) {
  return str.replace(/<[^>]+>/g, "");
}

export async function generateStaticParams() {
  const slugs = await getSubscriptionSlugs().catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const sub = await getSubscriptionBySlug(params.slug).catch(() => null);
  if (!sub) return {};
  const title = cleanHtml(sub.title?.rendered || "Abonnement");
  return {
    title: `${title} - Conciergerie by Isa`,
    description: cleanHtml(sub.excerpt?.rendered || ""),
  };
}

export default async function SubscriptionPage({ params }) {
  const sub = await getSubscriptionBySlug(params.slug).catch(() => null);

  if (!sub) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-4">Abonnement introuvable</h1>
        <p className="mb-4">La formule recherchee n existe pas ou plus.</p>
        <Link href="/" className="text-amber-800 hover:underline text-sm">
          Retour a l accueil
        </Link>
      </main>
    );
  }

  const title = cleanHtml(sub.title?.rendered || "Formule");
  const price = sub.meta?.cbi_price || "Sur devis";
  const frequency = sub.meta?.cbi_frequency || "Formule";
  const unit = sub.meta?.cbi_unit ? ` / ${sub.meta.cbi_unit}` : "";

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <p className="text-xs text-neutral-500 mb-4">
        <Link href="/" className="hover:underline">
          Accueil
        </Link>{" "}
        / Abonnement
      </p>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 md:p-8 shadow-sm mb-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
          {frequency}
        </p>
        <h1 className="text-3xl font-bold mb-3 text-neutral-900">{title}</h1>
        <p className="text-3xl font-bold text-amber-800 mb-4">
          {price}
          <span className="text-sm font-medium text-neutral-500">{unit}</span>
        </p>
        {sub.excerpt?.rendered ? (
          <div
            className="text-sm text-neutral-700 prose prose-sm max-w-none mb-3"
            dangerouslySetInnerHTML={{ __html: sub.excerpt.rendered }}
          />
        ) : null}
        {!sub.excerpt?.rendered && sub.content?.rendered ? (
          <div
            className="text-sm text-neutral-700 prose prose-sm max-w-none mb-3"
            dangerouslySetInnerHTML={{ __html: sub.content.rendered }}
          />
        ) : null}
      </section>

      <div className="space-y-6">
        <AvailabilityPanel slug={params.slug} itemType="subscription" />
        <a
          href={`/?subscription=${encodeURIComponent(params.slug)}#contact`}
          className="inline-flex items-center px-5 py-2.5 rounded-full bg-amber-700 text-sm font-semibold text-white hover:bg-amber-800"
        >
          Demander cette formule
        </a>
      </div>
    </main>
  );
}
