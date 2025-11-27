const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const WP_SITE_URL = process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL;

if (!WP_API_URL) {
  throw new Error("NEXT_PUBLIC_WORDPRESS_API_URL is not set");
}
if (!WP_SITE_URL) {
  throw new Error("NEXT_PUBLIC_WORDPRESS_SITE_URL is not set");
}

async function wpFetch(endpoint, options = {}) {
  const res = await fetch(`${WP_API_URL}${endpoint}`, {
    next: { revalidate: 60 },
    ...options,
  });

  if (!res.ok) {
    console.error("WordPress API error:", res.status, endpoint);
    throw new Error(`Failed to fetch ${endpoint}`);
  }

  return res.json();
}

export async function getServices() {
  return wpFetch("/services?per_page=100");
}

export async function getServiceBySlug(slug) {
  const items = await wpFetch(`/services?slug=${encodeURIComponent(slug)}&per_page=1`);
  return items[0] || null;
}

export async function getServiceSlugs() {
  const items = await wpFetch("/services?per_page=100&_fields=slug");
  return items.map((item) => item.slug);
}

export async function getSubscriptions() {
  const items = await wpFetch("/subscriptions?per_page=20");
  return items;
}

export async function getInfoBoxes() {
  return wpFetch("/info-boxes?per_page=10");
}

export async function getLatestNews(limit = 3) {
  return wpFetch(`/posts?per_page=${limit}&orderby=date&order=desc`);
}

export async function getSiteInfo() {
  const res = await fetch(`${WP_SITE_URL}/wp-json`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    console.error("Failed to fetch site info", res.status);
    return { name: "Conciergerie by Isa", description: "" };
  }
  const data = await res.json();
  return {
    name: data.name || "Conciergerie by Isa",
    description: data.description || "",
  };
}
