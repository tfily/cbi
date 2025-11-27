import { getServiceBySlug, getServiceSlugs } from "../../../lib/wordpress";
import Link from "next/link";

function cleanHtml(str) {
  return str.replace(/<[^>]+>/g, "");
}

export async function generateStaticParams() {
  const slugs = await getServiceSlugs().catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const service = await getServiceBySlug(params.slug).catch(() => null);
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
  const service = await getServiceBySlug(params.slug).catch(() => null);

  if (!service) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-4">Service introuvable</h1>
        <p className="mb-4">Le service que vous recherchez n existe pas ou plus.</p>
        <Link href="/" className="text-amber-800 hover:underline text-sm">
          Retour à l accueil
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-xs text-neutral-500 mb-2">
        <Link href="/" className="hover:underline">
          Accueil
        </Link>{" "}
        / Service
      </p>
      <h1 className="text-3xl font-bold mb-4">
        {cleanHtml(service.title.rendered)}
      </h1>
      {service.excerpt?.rendered && (
        <div
          className="text-sm text-neutral-600 mb-4 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: service.excerpt.rendered }}
        />
      )}
      <div
        className="prose prose-sm max-w-none text-neutral-800 mb-8"
        dangerouslySetInnerHTML={{ __html: service.content.rendered }}
      />

      <a
        href="/#contact"
        className="inline-flex items-center px-5 py-2.5 rounded-full bg-amber-700 text-sm font-semibold text-white hover:bg-amber-800"
      >
        Demander ce service
      </a>
    </main>
  );
}
