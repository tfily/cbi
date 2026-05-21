import { getWooOrder } from "./woocommerce";

const PREVIEW_FEEDBACK = [
  {
    id: "preview-gestion-des-cles",
    date: "2026-05-18T10:00:00.000Z",
    title: "Avis test gestion des clés",
    message:
      "Prise en charge très fluide, remise des clés bien cadrée et communication rassurante du début à la fin.",
    rating: 5,
    customerName: "Claire M.",
    serviceName: "Gestion des clés",
    serviceSlug: "gestion-des-cles",
    pricingLabel: "Pack 5 : 45€",
    itemType: "service",
    publishAllowed: true,
  },
  {
    id: "preview-home",
    date: "2026-05-14T10:00:00.000Z",
    title: "Avis test homepage",
    message:
      "Service réactif, discret et très simple à organiser. Le cadre était clair et la prestation conforme à ce qui avait été annoncé.",
    rating: 5,
    customerName: "Sophie R.",
    serviceName: "Pressing et blanchisserie",
    serviceSlug: "pressing-et-blanchisserie",
    pricingLabel: "Pack 5 collectes : 50 €",
    itemType: "service",
    publishAllowed: true,
  },
];

function getWpRestBase() {
  return (
    process.env.WORDPRESS_SITE_URL ||
    process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL ||
    ""
  ).replace(/\/$/, "");
}

function getWpAuthHeader() {
  const user = process.env.WP_CONTACT_USER;
  const pass = process.env.WP_CONTACT_APP_PASSWORD;
  if (!user || !pass) return "";
  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return `Basic ${token}`;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function readOrderMeta(order, key) {
  return (
    (order?.meta_data || []).find((entry) => entry?.key === key)?.value || ""
  );
}

export function buildReviewTitle({ orderId, serviceName }) {
  const cleanedServiceName = String(serviceName || "").trim();
  if (cleanedServiceName) {
    return `Avis ${cleanedServiceName} - commande #${orderId}`;
  }
  return `Avis commande #${orderId}`;
}

export function buildOrderReviewContext(order) {
  if (!order?.id) return null;

  const serviceSlug =
    readOrderMeta(order, "service_slug") ||
    readOrderMeta(order, "subscription_slug") ||
    "";
  const itemType = readOrderMeta(order, "item_type") || "service";
  const serviceName =
    readOrderMeta(order, "service_name") ||
    order?.line_items?.[0]?.name ||
    "";
  const pricingLabel = readOrderMeta(order, "pricing_label") || "";
  const scheduledDate = readOrderMeta(order, "scheduled_date") || "";
  const timeSlot = readOrderMeta(order, "time_slot") || "";
  const customerName = [
    order?.billing?.first_name || "",
    order?.billing?.last_name || "",
  ]
    .join(" ")
    .trim();

  return {
    orderId: String(order.id),
    orderStatus: String(order.status || ""),
    serviceName: String(serviceName || ""),
    serviceSlug: String(serviceSlug || ""),
    itemType: String(itemType || "service"),
    pricingLabel: String(pricingLabel || ""),
    scheduledDate: String(scheduledDate || ""),
    timeSlot: String(timeSlot || ""),
    customerName,
    customerEmail: String(order?.billing?.email || ""),
    orderDate: String(order?.date_completed || order?.date_created || ""),
  };
}

export async function getOrderReviewContext(orderId, email) {
  if (!orderId) {
    throw new Error("Missing order ID.");
  }

  const order = await getWooOrder(orderId);
  const context = buildOrderReviewContext(order);
  if (!context) {
    throw new Error("Order not found.");
  }

  const expectedEmail = normalizeEmail(context.customerEmail);
  const providedEmail = normalizeEmail(email);
  if (!expectedEmail || !providedEmail || expectedEmail !== providedEmail) {
    throw new Error("This order could not be verified.");
  }

  return context;
}

function mapFeedbackItem(item) {
  const meta = item?.meta || {};
  return {
    id: item?.id,
    date: item?.date || "",
    title:
      typeof item?.title?.rendered === "string"
        ? item.title.rendered.replace(/<[^>]+>/g, "").trim()
        : "",
    message:
      typeof item?.content?.rendered === "string"
        ? item.content.rendered.replace(/<[^>]+>/g, "").trim()
        : "",
    rating: Number(meta?.cbi_rating || 0),
    customerName: String(meta?.cbi_customer_name || "").trim(),
    serviceName: String(meta?.cbi_service_name || "").trim(),
    serviceSlug: String(meta?.cbi_service_slug || "").trim(),
    pricingLabel: String(meta?.cbi_pricing_label || "").trim(),
    itemType: String(meta?.cbi_item_type || "").trim(),
    publishAllowed: String(meta?.cbi_feedback_publish_ok || "") === "1",
  };
}

function getPreviewFeedback({ serviceSlug = "", limit = 3 } = {}) {
  const normalizedServiceSlug = String(serviceSlug || "").trim();
  const items = PREVIEW_FEEDBACK.filter(
    (item) =>
      !normalizedServiceSlug || item.serviceSlug === normalizedServiceSlug
  );
  return Number(limit) > 0 ? items.slice(0, limit) : items;
}

export async function getPublishedFeedback({ serviceSlug = "", limit = 3 } = {}) {
  const shouldUsePreviewFeedback =
    process.env.NODE_ENV !== "production" &&
    process.env.DISABLE_FAKE_REVIEWS !== "true";

  const restBase = getWpRestBase();
  if (!restBase) {
    return shouldUsePreviewFeedback
      ? getPreviewFeedback({ serviceSlug, limit })
      : [];
  }

  const authHeader = getWpAuthHeader();
  if (!authHeader) {
    return shouldUsePreviewFeedback
      ? getPreviewFeedback({ serviceSlug, limit })
      : [];
  }

  const params = new URLSearchParams({
    per_page: "100",
    status: "publish",
    orderby: "date",
    order: "desc",
    _fields: "id,date,title,content,meta",
  });

  const res = await fetch(`${restBase}/wp-json/wp/v2/cbi-feedback?${params.toString()}`, {
    headers: {
      Authorization: authHeader,
    },
    next: { revalidate: 300 },
  }).catch((error) => {
    console.error("[Feedback] failed to load published feedback:", error);
    return null;
  });

  if (!res?.ok) {
    console.error("[Feedback] WordPress API error:", res?.status || "unknown");
    return [];
  }

  const items = await res.json().catch(() => []);
  const normalizedServiceSlug = String(serviceSlug || "").trim();
  const reviews = (Array.isArray(items) ? items : [])
    .map(mapFeedbackItem)
    .filter(
      (item) =>
        item.publishAllowed &&
        item.rating >= 1 &&
        item.message &&
        (!normalizedServiceSlug || item.serviceSlug === normalizedServiceSlug)
    );

  if (reviews.length === 0 && shouldUsePreviewFeedback) {
    return getPreviewFeedback({ serviceSlug, limit });
  }

  return Number(limit) > 0 ? reviews.slice(0, limit) : reviews;
}
