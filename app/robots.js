import { getBaseUrl } from "../lib/site";

export default function robots() {
  const baseUrl = getBaseUrl();
  const host = new URL(baseUrl).host;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host,
  };
}
