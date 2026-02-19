import { getServiceBySlug, getServiceSlugs } from "../../../lib/wordpress";
import Link from "next/link";
import Image from "next/image";
import AvailabilityPanel from "../../../components/AvailabilityPanel";

function cleanHtml(str) {
  return str.replace(/<[^>]+>/g, "");
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
  const packPrices = getPackPrices(service.meta);

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      {/* Breadcrumb */}
      <p className="text-xs text-neutral-500 mb-4">
        <Link href="/" className="hover:underline">
          Accueil
        </Link>{" "}
        / Service
      </p>

      {/* HERO IMAGE + TITLE + EXCERPT */}
      <section className="mb-8">
        {heroUrl && (
          <div className="relative w-full h-[420px] md:h-[500px] rounded-3xl overflow-hidden shadow-md border border-neutral-200 mb-5">
            <Image
              src={heroUrl}
              alt={cleanHtml(service.title.rendered)}
              fill
              className="object-cover object-center"
              priority
            />
          </div>
        )}

        <h1 className="text-3xl font-bold mb-3">
          {cleanHtml(service.title.rendered)}
        </h1>

        {unitPrice ? (
          <p className="text-sm font-semibold text-amber-800 mb-1">Tarif unitaire: {unitPrice}</p>
        ) : null}
        {packPrices.length > 0 ? (
          <p className="text-sm font-semibold text-neutral-700 mb-4">
            {packPrices.map((p) => `Pack ${p.size}: ${p.value}`).join(" · ")}
          </p>
        ) : null}

        {service.excerpt?.rendered && (
          <div
            className="text-sm text-neutral-600 mb-4 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: service.excerpt.rendered }}
          />
        )}
      </section>

      {/* MAIN CONTENT */}
      <section className="prose prose-sm max-w-none text-neutral-800 mb-8">
        <div
          dangerouslySetInnerHTML={{ __html: service.content.rendered }}
        />
      </section>

      {/* CTA */}
      <div className="space-y-6">
        <AvailabilityPanel slug={params.slug} itemType="service" />
        <a
          href={`/?service=${encodeURIComponent(params.slug)}#contact`}
          className="inline-flex items-center px-5 py-2.5 rounded-full bg-amber-700 text-sm font-semibold text-white hover:bg-amber-800"
        >
          Demander ce service
        </a>
      </div>
    </main>
  );
}
