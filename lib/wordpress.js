const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "";
const WP_SITE_URL = process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL || "";

// Safe fetch wrapper
async function wpFetch(endpoint, options = {}) {
  if (!WP_API_URL) {
    console.warn(
      "[WordPress] NEXT_PUBLIC_WORDPRESS_API_URL is not set. Returning empty result for",
      endpoint
    );
    return [];
  }

  const res = await fetch(`${WP_API_URL}${endpoint}`, {
    next: { revalidate: 60 },
    ...options,
  });

  if (!res.ok) {
    console.error("WordPress API error:", res.status, endpoint);
    return [];
  }

  return res.json();
}

export async function getServices() {
  return wpFetch("/services?per_page=100&_embed");
}


export async function getServiceBySlug(slug) {
  if (!slug) return null;
  const items = await wpFetch(`/services?slug=${encodeURIComponent(slug)}&per_page=1`);
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

export async function getServiceSlugs() {
  const items = await wpFetch("/services?per_page=100&_fields=slug");
  if (!Array.isArray(items)) return [];
  return items.map((item) => item.slug).filter(Boolean);
}

export async function getSubscriptions() {
  const items = await wpFetch("/subscriptions?per_page=20");
  return Array.isArray(items) ? items : [];
}

export async function getInfoBoxes() {
  const items = await wpFetch("/info-boxes?per_page=10");
  return Array.isArray(items) ? items : [];
}

export async function getLatestNews(limit = 3) {
  const items = await wpFetch(`/posts?per_page=${limit}&orderby=date&order=desc`);
  return Array.isArray(items) ? items : [];
}

export async function getSiteInfo() {
  if (!WP_SITE_URL) {
    console.warn(
      "[WordPress] NEXT_PUBLIC_WORDPRESS_SITE_URL is not set. Using fallback site info."
    );
    return { name: "Conciergerie by Isa", description: "" };
  }

  const res = await fetch(`${WP_SITE_URL}/wp-json`, {
    next: { revalidate: 300 },
  }).catch((err) => {
    console.error("Failed to fetch site info:", err);
    return null;
  });

  if (!res || !res.ok) {
    console.warn("Using fallback site info (bad response from /wp-json)");
    return { name: "Conciergerie by Isa", description: "" };
  }

  const data = await res.json().catch(() => ({}));
  return {
    name: data.name || "Conciergerie by Isa",
    description: data.description || "",
  };
}
