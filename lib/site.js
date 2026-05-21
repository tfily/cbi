export function getBaseUrl() {
  const fromEnv =
    process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  return (fromEnv || "https://conciergeriebyisa.fr").replace(/\/$/, "");
}

export function getCanonicalUrl(path = "/") {
  const normalizedPath = String(path || "/").startsWith("/")
    ? String(path || "/")
    : `/${String(path || "")}`;
  return `${getBaseUrl()}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export function cleanHtml(str) {
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
    .replace(/&ccedil;/g, "ç")
    .trim();
}

export function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function isPlaceholderNewsItem(item) {
  const title = normalizeKey(cleanHtml(item?.title?.rendered || ""));
  const excerpt = normalizeKey(cleanHtml(item?.excerpt?.rendered || ""));
  const content = normalizeKey(cleanHtml(item?.content?.rendered || ""));
  const text = `${title} ${excerpt} ${content}`
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return true;

  const placeholderPhrases = [
    "hello world",
    "bonjour tout le monde",
    "bienvenue sur wordpress",
    "welcome to wordpress",
    "modifiez ou supprimez",
    "edit or delete it",
    "start writing",
  ];

  if (placeholderPhrases.some((phrase) => text.includes(phrase))) return true;
  if (title === "hello world" || title === "bonjour tout le monde") return true;
  return false;
}
