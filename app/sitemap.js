import { getServiceSlugs, getSubscriptionSlugs } from "../lib/wordpress";

function getBaseUrl() {
  const fromEnv =
    process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  return (fromEnv || "https://conciergeriebyisa.fr").replace(/\/$/, "");
}

export default async function sitemap() {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const staticRoutes = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    {
      url: `${baseUrl}/payment/return`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const [serviceSlugs, subscriptionSlugs] = await Promise.all([
    getServiceSlugs().catch(() => []),
    getSubscriptionSlugs().catch(() => []),
  ]);

  const serviceRoutes = (serviceSlugs || []).map((slug) => ({
    url: `${baseUrl}/services/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const subscriptionRoutes = (subscriptionSlugs || []).map((slug) => ({
    url: `${baseUrl}/subscriptions/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...serviceRoutes, ...subscriptionRoutes];
}

