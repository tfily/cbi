import Link from "next/link";
import { getPostBySlug, getPostSlugs } from "../../../lib/wordpress";

function cleanHtml(str) {
  return String(str || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&rsquo;|&#8217;/g, "'")
    .trim();
}

export async function generateStaticParams() {
  const slugs = await getPostSlugs().catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug).catch(() => null);
  if (!post) return {};
  return {
    title: `${cleanHtml(post.title?.rendered || "Actualité")} - Conciergerie by Isa`,
    description: cleanHtml(post.excerpt?.rendered || ""),
  };
}

export default async function NewsDetailPage({ params }) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug).catch(() => null);

  if (!post) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-3">Actualité introuvable</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Cette actualité n'existe plus ou n'est pas publiée.
        </p>
        <Link href="/" className="text-amber-800 hover:underline text-sm font-semibold">
          Retour à l'accueil
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-xs text-neutral-500 mb-4">
        <Link href="/" className="hover:underline">
          Accueil
        </Link>{" "}
        / Actualités
      </p>

      <p className="text-xs text-neutral-500 mb-2">
        {new Date(post.date).toLocaleDateString("fr-FR")}
      </p>
      <h1 className="text-3xl font-bold mb-5">{cleanHtml(post.title?.rendered || "")}</h1>

      {post.excerpt?.rendered ? (
        <div
          className="text-sm text-neutral-700 mb-6 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
        />
      ) : null}

      {post.content?.rendered ? (
        <div
          className="prose prose-sm max-w-none text-neutral-800"
          dangerouslySetInnerHTML={{ __html: post.content.rendered }}
        />
      ) : null}
    </main>
  );
}
