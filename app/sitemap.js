import {
  getPostBySlug,
  getPostSlugs,
  getServiceSlugs,
  getSubscriptionSlugs,
} from "../lib/wordpress";
import { getBaseUrl, isPlaceholderNewsItem } from "../lib/site";

export default async function sitemap() {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const staticRoutes = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/carte`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];

  const [serviceSlugs, subscriptionSlugs, postSlugs] = await Promise.all([
    getServiceSlugs().catch(() => []),
    getSubscriptionSlugs().catch(() => []),
    getPostSlugs().catch(() => []),
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

  const posts = await Promise.all(
    (postSlugs || []).map(async (slug) => getPostBySlug(slug).catch(() => null))
  );
  const postRoutes = posts
    .filter((post) => post && !isPlaceholderNewsItem(post))
    .map((post) => ({
      url: `${baseUrl}/actualites/${post.slug}`,
      lastModified: post.modified || now,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  return [...staticRoutes, ...serviceRoutes, ...subscriptionRoutes, ...postRoutes];
}
